const axios = require('axios');
const { Op } = require('sequelize');
const Reservation = require('../models/Reservation');
require('dotenv').config();

// Helper para auditoría (para no repetir código)
const sendAudit = (action, details, hotelId) => {
   axios.post(process.env.AUDIT_SERVICE_URL, {
       action, details, hotelId, username: 'Sistema' 
   }).catch(err => console.error("Fallo auditoría:", err.message));
};

const createReservation = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'];
    const tenantId = req.headers['x-tenant-id'];
    if (!hotelId) return res.status(400).json({ message: 'Falta cabecera x-hotel-id' });

    const { guestId, roomTypeId, checkIn, checkOut, totalGuests, groupEventId, specificRoomNumber } = req.body;

    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ message: 'Fechas inválidas: Salida debe ser después de Entrada' });
    }

    // ---------------------------------------------------------
    // LÓGICA DE DISPONIBILIDAD (MEJORADA)
    // ---------------------------------------------------------
    
    // CASO A: ASIGNACIÓN ESPECÍFICA (Reserva Telefónica / Walk-in con habitación elegida)
    if (specificRoomNumber) {
        // Verificar que ESA habitación no esté ocupada en esas fechas
        const collision = await Reservation.findOne({
          where: {
            hotelId,
            assignedRoomId: specificRoomNumber, // Buscamos por número de habitación
            status: { [Op.in]: ['CONFIRMED', 'CHECKED_IN'] }, // Solo reservas vivas
            [Op.and]: [
              { checkIn: { [Op.lt]: checkOut } }, // Choca si entra antes de que yo salga
              { checkOut: { [Op.gt]: checkIn } }  // Y sale después de que yo entre
            ]
          }
        });

        if (collision) {
          return res.status(409).json({ message: `La habitación ${specificRoomNumber} ya está ocupada o reservada en esas fechas.` });
        }
    } 
    
    // CASO B: RESERVA GENÉRICA (Sin número de habitación, solo por tipo)
    else {
        // 1. Consultar Inventario Total
        let totalRoomsOfType = 0;
        try {
          const response = await axios.get(process.env.ROOMS_SERVICE_URL, { headers: { 'x-hotel-id': hotelId } });
          const allRooms = response.data;
          totalRoomsOfType = allRooms.filter(room => room.RoomType && room.RoomType.id === parseInt(roomTypeId)).length;
        } catch (error) {
          return res.status(503).json({ message: 'Error consultando inventario' });
        }

        // 2. Contar Reservas Conflictivas Generales
        const conflictingReservations = await Reservation.count({
          where: {
            hotelId, roomTypeId, 
            status: { [Op.in]: ['CONFIRMED', 'CHECKED_IN'] },
            [Op.and]: [{ checkIn: { [Op.lt]: checkOut } }, { checkOut: { [Op.gt]: checkIn } }]
          }
        });

        if ((totalRoomsOfType - conflictingReservations) <= 0) {
          return res.status(409).json({ message: 'No hay disponibilidad general para estas fechas.' });
        }
    }

    // ---------------------------------------------------------
    // GUARDADO
    // ---------------------------------------------------------
    const newReservation = await Reservation.create({
      guestId, roomTypeId, checkIn, checkOut, 
      status: 'CONFIRMED',
      totalGuests: totalGuests || 1, 
      hotelId,
      groupEventId: groupEventId || null,
      assignedRoomId: specificRoomNumber || null 
    });

    // Crear Folio si no es grupo
    if (!groupEventId) {
        axios.post(process.env.BILLING_SERVICE_URL, { reservationId: newReservation.id }, 
            { headers: { 'x-hotel-id': hotelId, 'x-tenant-id': tenantId || '' } }
        ).catch(e => console.error("Error folio", e.message));
    }

    // Auditoría
    sendAudit('RESERVATION_CREATED', `Reserva #${newReservation.id} creada`, hotelId);

    res.status(201).json({ message: 'Reserva creada', reservation: newReservation });

  } catch (error) {
    console.error("Error createReservation:", error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
};

const getReservations = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'];
    const { guestId } = req.query;
    const where = { hotelId };
    if (guestId) where.guestId = guestId;
    
    const reservations = await Reservation.findAll({ where });
    res.json(reservations);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const checkIn = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { roomNumber } = req.body;
    const hotelId = req.headers['x-hotel-id'];

    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) return res.status(404).json({ message: 'No encontrada' });
    if (reservation.status === 'CHECKED_IN') return res.status(400).json({ message: 'Ya está Checked-in' });

    // Actualizar Habitación
    await axios.patch(`${process.env.ROOMS_SERVICE_URL}/${roomNumber}/status`, 
      { occupancyChange: reservation.totalGuests },
      { headers: { 'x-hotel-id': hotelId } }
    );

    reservation.status = 'CHECKED_IN';
    reservation.assignedRoomId = roomNumber;
    await reservation.save();
    
    sendAudit('CHECK_IN', `Reserva ${reservation.id} -> ${roomNumber}`, hotelId);

    // Crear Folio si no existe (Backup)
    axios.post(process.env.BILLING_SERVICE_URL, { reservationId: reservation.id },
       { headers: { 'x-hotel-id': hotelId } }
    ).catch(() => {});

    res.json({ message: 'Check-in exitoso', reservation });
  } catch (error) {
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
};

// --- CHECKOUT SIMPLIFICADO CON FUERZA BRUTA ---
const checkOut = async (req, res) => {
  console.log(`🏁 [CHECKOUT] Iniciando proceso para Reserva ID: ${req.params.reservationId}`);
  
  try {
    const { reservationId } = req.params;
    const { force } = req.body || {}; // Si no viene, será undefined (falsy)
    const hotelId = req.headers['x-hotel-id'];

    console.log(`📋 [CHECKOUT] Params recibidos -> Force: ${force}, HotelID: ${hotelId}`);

    if (!hotelId) {
        console.error("🔴 [CHECKOUT] Falta x-hotel-id");
        return res.status(400).json({ message: "Falta cabecera x-hotel-id" });
    }

    // 1. Buscar
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
        console.warn("⚠️ [CHECKOUT] Reserva no encontrada en BD");
        return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    console.log(`✅ [CHECKOUT] Reserva encontrada. Estado: ${reservation.status}. TotalGuests: ${reservation.totalGuests}`);

    if (reservation.status !== 'CHECKED_IN') {
        return res.status(400).json({ message: `No se puede hacer Check-out. Estado actual: ${reservation.status}` });
    }

    // 2. Billing
     if (!force) {
        try {
            const billingRes = await axios.get(`${process.env.BILLING_SERVICE_URL}/reservation/${reservationId}`, {
                headers: { 'x-hotel-id': hotelId }
            });
            
            const folio = billingRes.data;
            const amount = parseFloat(folio.totalAmount);

            // CORRECCIÓN: Solo bloqueamos si el monto es MAYOR a 0.
            // Si es 0 o negativo (saldo a favor), permitimos salir aunque no esté 'PAID'.
            if (folio.status !== 'PAID' && amount > 0) {
                return res.status(402).json({ message: `Deuda pendiente: $${amount}` });
            }
        } catch (e) { 
             // Si falla billing, logueamos pero permitimos intentar salir (o bloquear según política)
             console.error("Billing check skip", e.message); 
        }
    } else {
        console.log("⏩ [CHECKOUT] Modo FORCE activado. Saltando verificación de deuda.");
    }

    // 3. Rooms
    if (reservation.assignedRoomId) {
        console.log(`🛏️ [CHECKOUT] Liberando habitación ${reservation.assignedRoomId}...`);
        try {
            // Aseguramos que occupancyChange sea un número válido
            const count = reservation.totalGuests || 1; 
            
            const roomUrl = `${process.env.ROOMS_SERVICE_URL}/${reservation.assignedRoomId}/status`;
            console.log(`   -> Llamando a: ${roomUrl} con occupancyChange: -${count}`);

            await axios.patch(roomUrl, 
                { occupancyChange: -count, status: 'DIRTY' },
                { headers: { 'x-hotel-id': hotelId } }
            );
            console.log("✅ [CHECKOUT] Habitación liberada.");
        } catch (roomError) {
            // AQUI SUELE FALLAR: Imprimimos el error detallado de axios
            console.error("🔴 [CHECKOUT] Error Rooms Service:", roomError.response?.data || roomError.message);
        }
    }

    // 4. Guardar
    console.log("💾 [CHECKOUT] Guardando estado CHECKED_OUT en BD...");
    reservation.status = 'CHECKED_OUT';
    await reservation.save();

    // 5. Audit
    console.log("🕵️‍♂️ [CHECKOUT] Enviando auditoría...");
    sendAudit('CHECK_OUT', `Salida ${reservation.id} (Forzado: ${!!force})`, hotelId);

    console.log("🏁 [CHECKOUT] Finalizado exitosamente.");
    res.json({ message: 'Check-out exitoso' });

  } catch (error) {
    // CAPTURA FINAL
    console.error("🔥🔥🔥 [CHECKOUT] ERROR FATAL NO CONTROLADO:");
    console.error(error); // Imprime el stack trace completo
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

const extendReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { newCheckOut } = req.body;
    await Reservation.update({ checkOut: newCheckOut }, { where: { id: reservationId } });
    res.json({ message: 'Actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const changeRoom = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { newRoomNumber } = req.body;
    const hotelId = req.headers['x-hotel-id'];

    const r = await Reservation.findByPk(reservationId);
    if (!r) return res.status(404).json({ message: 'No encontrada' });

    if (r.status === 'CHECKED_IN' && r.assignedRoomId) {
        // Sacar de la vieja
        axios.patch(`${process.env.ROOMS_SERVICE_URL}/${r.assignedRoomId}/status`, 
            { occupancyChange: -r.totalGuests, status: 'DIRTY' }, { headers: { 'x-hotel-id': hotelId } }
        );
        // Meter en la nueva
        await axios.patch(`${process.env.ROOMS_SERVICE_URL}/${newRoomNumber}/status`, 
            { occupancyChange: r.totalGuests }, { headers: { 'x-hotel-id': hotelId } }
        );
    }
    r.assignedRoomId = newRoomNumber;
    await r.save();
    res.json({ message: 'Cambio realizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
// Cancelar una reserva futura
const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const hotelId = req.headers['x-hotel-id'];

    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    // Solo se pueden cancelar las CONFIRMADAS. 
    // Si ya hizo Check-in, se debe usar Check-out.
    if (reservation.status !== 'CONFIRMED') {
      return res.status(400).json({ message: `No se puede cancelar. Estado actual: ${reservation.status}` });
    }

    // Cambiar estado
    reservation.status = 'CANCELLED';
    
    // Opcional: Liberar la habitación asignada para mantener la data limpia, 
    // aunque la lógica de fechas ya ignora las canceladas.
    reservation.assignedRoomId = null; 
    
    await reservation.save();

    // Auditoría
    sendAudit('RESERVATION_CANCELLED', `Reserva #${reservationId} cancelada`, hotelId);

    res.json({ message: 'Reserva cancelada exitosamente', reservation });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await Reservation.findByPk(reservationId);
    
    if (!reservation) return res.status(404).json({ message: "No encontrada" });

    // Opcional: Validar que no esté ocupada actualmente
    if (reservation.status === 'CHECKED_IN') {
        return res.status(400).json({ message: "No se puede borrar una reserva con huésped en casa. Haga Check-out primero." });
    }

    await reservation.destroy();
    res.json({ message: "Reserva eliminada permanentemente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = { createReservation, getReservations, checkIn, checkOut, extendReservation, changeRoom, cancelReservation, deleteReservation };