const Guest = require('../models/Guest');
const { Op } = require('sequelize');
const GroupEvent = require('../models/GroupEvent');
const axios = require('axios');
// 1. Crear un nuevo huésped
const createGuest = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id']; // LEER HEADER
    const tenantId = req.headers['x-tenant-id']; // LEER HEADER
    if (!hotelId || !tenantId) return res.status(400).json({ message: 'Falta x-hotel-id o x-tenant-id' });

    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      documentId, 
      groupCode,
      country,
      city,
      nationality,
      birthDate,
      civilStatus 
    } = req.body;

     let groupEventId = null;
 if (groupCode && groupCode !== 'WALKIN') {
        // Buscamos el evento que coincida con el código y la empresa
        const event = await GroupEvent.findOne({ 
            where: { 
                code: groupCode, 
                tenantId 
            } 
        });
        
        if (event) {
            if (!event.isActive) {
                return res.status(403).json({ message: 'El registro para este grupo ha sido CERRADO por el administrador.' });
            }
            groupEventId = event.id;
        } else {
            console.warn(`⚠️ Código ${groupCode} no encontrado en la BD de eventos.`);
        }
    }

    // Crear en BD
    const newGuest = await Guest.create({
      firstName,
      lastName,
      email: email || null,
      phoneNumber,
      documentId,
      country,
      city,
      nationality,
      birthDate,
      civilStatus,
      groupCode: groupCode || null,
      groupEventId,
      hotelId,
      tenantId
    });

    return res.status(201).json(newGuest);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear el huésped', error: error.message });
  }
};

// 2. Obtener todos los huéspedes
const getGuests = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id']; 
    const tenantId = req.headers['x-tenant-id']; 

    if (!hotelId || !tenantId) return res.status(400).json({ message: 'Falta x-hotel-id o x-tenant-id' });

    const { groupCode, documentId, scope } = req.query; 

    let whereClause = {};
    
    // Lógica de Compartir Huéspedes
    if (scope === 'GLOBAL') {
        // Busca en toda la empresa
        whereClause.tenantId = tenantId;
    } else {
        // Busca solo en este hotel (Default)
        whereClause.hotelId = hotelId;
    }

    if (groupCode) whereClause.groupCode = groupCode;
    if (documentId) whereClause.documentId = documentId;

    const guests = await Guest.findAll({ where: whereClause });
    res.json(guests);
  } catch (error) {
    console.error(error); // Importante para ver el error en Docker
    res.status(500).json({ message: 'Error al obtener huéspedes', error: error.message });
  }
};

const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelId = req.headers['x-hotel-id']; // Seguridad extra

    const guest = await Guest.findByPk(id);
    if (!guest) return res.status(404).json({ message: "Huésped no encontrado" });
    try {
        const response = await axios.get(`${process.env.RESERVATIONS_SERVICE_URL}`, {
            params: { guestId: id },
            headers: { 'x-hotel-id': hotelId }
        });
        const activeReservations = response.data;

        // Si tiene reservas (aunque sean pasadas, para mantener historial), no borramos.
        // Si quisieras permitir borrar si ya hizo check-out, filtrarías por status.
        // Pero lo más seguro es: "Si tiene historial, no se toca".
        if (activeReservations.length > 0) {
            return res.status(409).json({ 
                message: "⛔ No se puede eliminar: El huésped tiene habitaciones asignadas o historial en el hotel." 
            });
        }
    } catch (netError) {
        console.error("Error consultando reservas:", netError.message);
        // Opcional: Decidir si abortar o continuar si falla el servicio de reservas.
        // Por seguridad, mejor abortar.
        return res.status(503).json({ message: "No se pudo verificar el historial del huésped. Intente más tarde." });
    }
    await guest.destroy();
    
    res.json({ message: "Huésped eliminado de la lista." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelId = req.headers['x-hotel-id']; 
    
    // Buscamos al huésped (asegurando que sea del hotel/tenant correcto si aplicamos filtros estrictos)
    const guest = await Guest.findByPk(id);
    
    if (!guest) return res.status(404).json({ message: "Huésped no encontrado" });

    const { 
        firstName, lastName, email, phoneNumber, documentId, 
        country, city, nationality, birthDate, civilStatus, 
        isVip 
    } = req.body;

    await guest.update({
        firstName, lastName, email, phoneNumber, documentId,
        country, city, nationality, birthDate, civilStatus,
        isVip
    });

    res.json({ message: "Huésped actualizado correctamente", guest });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createGuest, getGuests, deleteGuest, updateGuest };