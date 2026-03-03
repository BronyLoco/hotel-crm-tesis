const GroupEvent = require('../models/GroupEvent');
const Guest = require('../models/Guest');

// Crear Evento
const createEvent = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) return res.status(400).json({ message: "Falta tenantId" });

    const { name, contactName, expectedGuests, startDate, endDate, roomRequirements, agreedPrice } = req.body;

    // Generar código automático si no viene (ej. RES-XK9)
    const code = req.body.code || `RES-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const newEvent = await GroupEvent.create({
      name,
      code,
      contactName,
      expectedGuests: expectedGuests || 1,
      startDate,
      endDate,
      roomRequirements: roomRequirements || [], // Array de objetos { typeId: 1, qty: 2 }
      agreedPrice: agreedPrice || 0,
      tenantId
    });

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar Eventos con Conteo
const getEvents = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    
    const events = await GroupEvent.findAll({
      where: { tenantId },
      include: [{ model: Guest }], // Traemos huéspedes para contar
      order: [['createdAt', 'DESC']]
    });

    // Formateamos para el frontend
    const result = events.map(e => ({
      ...e.toJSON(),
      registeredCount: e.Guests.length
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { expectedGuests, agreedPrice, name } = req.body;
    
    // Actualizamos lo que venga
    const updateData = {};
    if (expectedGuests) updateData.expectedGuests = expectedGuests;
    if (agreedPrice) updateData.agreedPrice = agreedPrice;
    if (name) updateData.name = name;

    await GroupEvent.update(updateData, { where: { id } });
    res.json({ message: "Evento actualizado" });
  } catch (e) { res.status(500).json({ error: e.message }); }

};

const toggleEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body; // true o false

    await GroupEvent.update({ isActive }, { where: { id } });
    res.json({ message: `Evento ${isActive ? 'abierto' : 'cerrado'} exitosamente` });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { createEvent, getEvents, updateEvent, toggleEventStatus };