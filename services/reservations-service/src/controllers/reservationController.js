const axios = require('axios');
const { Op } = require('sequelize'); // Importamos los operadores lógicos
const Reservation = require('../models/Reservation');
require('dotenv').config();

const createReservation = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id']; // Obtenemos el ID del Frontend
    if (!hotelId) return res.status(400).json({ message: 'Falta cabecera x-hotel-id' });

    const { guestId, roomTypeId, checkIn, checkOut, totalGuests } = req.body;
    // Validar fechas
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ message: 'La fecha de salida debe ser posterior a la de entrada' });
    }

    // 1. CONSULTAR INVENTARIO (Pasando el hotelId)
    let totalRoomsOfType = 0;
    try {
      const response = await axios.get(process.env.ROOMS_SERVICE_URL, {
        headers: { 'x-hotel-id': hotelId } // <--- CRÍTICO: Pasamos el ID a Rooms
      });
      const allRooms = response.data;
      totalRoomsOfType = allRooms.filter(room => room.RoomType && room.RoomType.id === parseInt(roomTypeId)).length;
    } catch (error) {
      return res.status(503).json({ message: 'Error en servicio de habitaciones' });
    }

    // PASO 2: VERIFICAR DISPONIBILIDAD (EN ESTE HOTEL)
    const conflictingReservations = await Reservation.count({
      where: {
        hotelId, // <--- FILTRO CLAVE: Solo contar reservas de ESTE hotel
        roomTypeId,
        status: { [Op.in]: ['CONFIRMED', 'CHECKED_IN'] }, 
        [Op.and]: [
          { checkIn: { [Op.lt]: checkOut } }, 
          { checkOut: { [Op.gt]: checkIn } } 
        ]
      }
    });

    const availableRooms = totalRoomsOfType - conflictingReservations;

    if (availableRooms <= 0) {
      return res.status(409).json({ message: 'Lo sentimos, no hay disponibilidad para estas fechas.' });
    }

   // 3. GUARDAR RESERVA
    const newReservation = await Reservation.create({
      guestId, roomTypeId, checkIn, checkOut, status: 'CONFIRMED',
      totalGuests: totalGuests || 1,
      hotelId // Guardamos el ID
    });

    // 4. CREAR FOLIO AUTOMÁTICO (Pasando el hotelId)
    try {
      await axios.post(process.env.BILLING_SERVICE_URL, {
        reservationId: newReservation.id
      }, {
        headers: { 'x-hotel-id': hotelId } // <--- CRÍTICO: Pasamos el ID a Billing
      });
    } catch (billingError) {
      console.error("Error creando folio:", billingError.message);
    }


    return res.status(201).json({
      message: 'Reserva creada exitosamente',
      reservation: newReservation
    });

  } catch (error) {
    console.error("Error en createReservation:", error);
    return res.status(500).json({ message: 'Error interno', error: error.message });
  }
};

const getReservations = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'];
    if (!hotelId) return res.status(400).json({ message: 'Falta cabecera x-hotel-id' });

    // Solo devolver reservas de este hotel
    const reservations = await Reservation.findAll({ where: { hotelId } });
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

    // 2. Comunicar al servicio de Habitaciones: "Suma 1 persona"
    try {
      await axios.patch(`${process.env.ROOMS_SERVICE_URL}/${roomNumber}/status`, {
        occupancyChange: reservation.totalGuests
      },
    {
    headers: { 'x-hotel-id': req.headers['x-hotel-id'] } 
    }
    );
    } catch (error) {
      // Si la habitación está llena, el servicio de rooms devolverá error 400
      return res.status(400).json({ 
          message: 'Error al asignar habitación: ' + (error.response?.data?.message || error.message) 
      });
    }

    // 3. Actualizar la reserva localmente
    reservation.status = 'CHECKED_IN';
    reservation.assignedRoomId = roomNumber;
    await reservation.save();
    
    //AUDIT
    sendAudit('CHECK_IN', `Reserva ${reservation.id} asignada a ${roomNumber}`, req.headers['x-hotel-id']);

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
    const reservation = await Reservation.findByPk(reservationId);
    
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    if (reservation.status !== 'CHECKED_IN') return res.status(400).json({ message: 'No está en casa' });

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

    // 3. Liberar espacio en la habitación
    if (reservation.assignedRoomId) {
      try {
        // Obtenemos la cantidad que entró. Si por error es null/0, asumimos 1 para limpiar algo.
        const peopleToRemove = reservation.totalGuests > 0 ? reservation.totalGuests : 1;
        
        await axios.patch(`${process.env.ROOMS_SERVICE_URL}/${reservation.assignedRoomId}/status`, {
          occupancyChange: -peopleToRemove, // RESTAMOS
          status: 'DIRTY' // Marcamos sucia
        },
    {
    headers: { 'x-hotel-id': req.headers['x-hotel-id'] } 
    }
      );
      } catch (roomError) {
        console.error("Error liberando habitación:", roomError.message);
      }
    }

    reservation.status = 'CHECKED_OUT';
    await reservation.save();

    
    //AUDIT
    sendAudit('CHECK_OUT', `Reserva ${reservation.id} asignada a ${roomNumber}`, req.headers['x-hotel-id']);


    res.json({ message: 'Check-out exitoso.', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// EXTENDER ESTADÍA
const extendReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { newCheckOut } = req.body;

    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    // Actualizamos fecha
    reservation.checkOut = newCheckOut;
    await reservation.save();

    res.json({ message: 'Estadía extendida correctamente', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendAudit = (action, details, hotelId) => {
   // Fire and Forget (No esperamos respuesta para no bloquear al usuario)
   axios.post(process.env.AUDIT_SERVICE_URL, {
       action, details, hotelId, username: 'Sistema/Usuario' 
       // Nota: Para tener el username real, deberíamos pasarlo desde el frontend en el header también.
       // Por ahora lo dejamos genérico o leemos un header 'x-user-name' si decidimos implementarlo.
   }).catch(err => console.error("Fallo auditoría:", err.message));
};


module.exports = { createReservation, getReservations, checkIn, checkOut, extendReservation };