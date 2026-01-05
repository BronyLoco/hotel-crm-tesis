const axios = require('axios');
const { Op } = require('sequelize'); // Importamos los operadores lógicos
const Reservation = require('../models/Reservation');
require('dotenv').config();

const createReservation = async (req, res) => {
  try {
    const { guestId, roomTypeId, checkIn, checkOut } = req.body;

    // 1. Validar fechas lógicas básica
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ message: 'La fecha de salida debe ser posterior a la de entrada' });
    }

    // ---------------------------------------------------------
    // PASO 1: CONSULTAR INVENTARIO TOTAL (Microservicio Habitaciones)
    // ---------------------------------------------------------
    let totalRoomsOfType = 0;
    try {
      // Llamamos a Rooms Service
      const response = await axios.get(process.env.ROOMS_SERVICE_URL);
      const allRooms = response.data;
      
      // Contamos cuántas habitaciones existen de este tipo
      totalRoomsOfType = allRooms.filter(room => room.RoomType && room.RoomType.id === parseInt(roomTypeId)).length;
      
    } catch (error) {
      console.error("Error contactando al servicio de habitaciones:", error.message);
      // Fallback: Si falla el servicio, asumimos 0 para no romper, o lanzamos error 503
      return res.status(503).json({ message: 'El servicio de habitaciones no está disponible para validar inventario.' });
    }

    if (totalRoomsOfType === 0) {
      return res.status(400).json({ message: 'No existen habitaciones de ese tipo en el inventario.' });
    }

    // ---------------------------------------------------------
    // PASO 2: VERIFICAR DISPONIBILIDAD (Anti-Overbooking)
    // ---------------------------------------------------------
    // Lógica: Una reserva choca con otra si:
    // (NuevaEntrada < SalidaExistente) Y (NuevaSalida > EntradaExistente)
    
    const conflictingReservations = await Reservation.count({
      where: {
        roomTypeId,
        status: 'CONFIRMED',
        checkIn: { [Op.lt]: checkOut }, 
        checkOut: { [Op.gt]: checkIn } 
      }
    });

    const availableRooms = totalRoomsOfType - conflictingReservations;

    console.log(`Debug: Total: ${totalRoomsOfType}, Ocupadas: ${conflictingReservations}, Disponibles: ${availableRooms}`);

    if (availableRooms <= 0) {
      return res.status(409).json({ message: 'Lo sentimos, no hay disponibilidad para estas fechas.' });
    }

    // ---------------------------------------------------------
    // PASO 3: GUARDAR RESERVA
    // ---------------------------------------------------------
    const newReservation = await Reservation.create({
      guestId,
      roomTypeId,
      checkIn,
      checkOut,
      status: 'CONFIRMED'
    });

    return res.status(201).json({
      message: 'Reserva creada exitosamente',
      reservation: newReservation
    });

  } catch (error) {
    console.error("Error en createReservation:", error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkIn = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { roomNumber } = req.body;

    // 1. Buscar la reserva
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    if (reservation.status === 'CHECKED_IN') {
      return res.status(400).json({ message: 'Esta reserva ya tiene Check-in realizado' });
    }

    // 2. Comunicar al servicio de Habitaciones: "Marca la 101 como OCUPADA"
    try {
      await axios.patch(`${process.env.ROOMS_SERVICE_URL}/${roomNumber}/status`, {
        status: 'OCCUPIED'
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error contactando servicio de habitaciones', error: error.message });
    }

    // 3. Actualizar la reserva localmente
    reservation.status = 'CHECKED_IN';
    reservation.assignedRoomId = roomNumber;
    await reservation.save();

    // ---------------------------------------------------------
    // PASO 4 (NUEVO): CREAR AUTOMÁTICAMENTE EL FOLIO EN FACTURACIÓN
    // ---------------------------------------------------------
    try {
      console.log(`📡 Solicitando creación de folio para reserva ${reservationId}...`);
      await axios.post(process.env.BILLING_SERVICE_URL, {
        reservationId: reservation.id
      });
      console.log("✅ Folio creado exitosamente.");
    } catch (billingError) {
      // Si falla la facturación, NO detenemos el check-in, pero avisamos en consola.
      // En un sistema real, esto iría a una cola de reintentos (Kafka/RabbitMQ).
      console.error("⚠️ Advertencia: No se pudo crear el folio automáticamente:", billingError.message);
    }
    // ---------------------------------------------------------

    res.json({ message: 'Check-in realizado con éxito', reservation });

  } catch (error) {
    console.error("🔴 ERROR CRÍTICO EN CHECK-IN:", error); 
    res.status(500).json({ error: error.message });
  }
};
const checkOut = async (req, res) => {
  try {
    const { reservationId } = req.params;

    // 1. Buscar la reserva
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    if (reservation.status !== 'CHECKED_IN') {
      return res.status(400).json({ message: 'Solo se puede hacer Check-out de reservas activas (CHECKED_IN)' });
    }

    // 2. VALIDACIÓN DE DEUDA (Llamada a Billing)
    try {
      // Obtenemos el folio de esta reserva
      const response = await axios.get(`${process.env.BILLING_SERVICE_URL}/reservation/${reservationId}`);
      const folio = response.data;

      if (folio.status !== 'PAID') {
        // Si no está pagado, detenemos todo. ¡No te vas sin pagar!
        return res.status(402).json({ 
          message: `El huésped tiene deuda pendiente ($${folio.totalAmount}). Debe pagar el folio antes de salir.` 
        });
      }
    } catch (billingError) {
      // Si falla la conexión a billing, es arriesgado dejarlo ir, pero para dev:
      console.error("Error consultando deuda:", billingError.message);
      // Opcional: return res.status(500).json({ message: "Error verificando deuda" });
    }

    // 3. Liberar la Habitación (Ponerla en DIRTY para limpieza)
    if (reservation.assignedRoomId) {
      try {
        await axios.patch(`${process.env.ROOMS_SERVICE_URL}/${reservation.assignedRoomId}/status`, {
          status: 'DIRTY' // Se marca sucia para que limpien antes de volver a usar
        });
      } catch (roomError) {
        console.error("Error liberando habitación:", roomError.message);
      }
    }

    // 4. Cerrar Reserva
    reservation.status = 'CHECKED_OUT';
    await reservation.save();

    res.json({ message: 'Check-out exitoso. Habitación liberada para limpieza.', reservation });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createReservation, getReservations, checkIn, checkOut };