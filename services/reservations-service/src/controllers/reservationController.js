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
    const { roomNumber } = req.body; // El recepcionista eligió la "101"

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

    res.json({ message: 'Check-in realizado con éxito', reservation });

  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("🔴 ERROR CRÍTICO EN CHECK-IN:", error); 
  }
};

module.exports = { createReservation, getReservations, checkIn };