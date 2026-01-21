const Guest = require('../models/Guest');
const { Op } = require('sequelize');

// 1. Crear un nuevo huésped
const createGuest = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id']; // LEER HEADER
    if (!hotelId) return res.status(400).json({ message: 'Falta x-hotel-id' });

    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      documentId, 
      groupCode,
      country,
      city 
    } = req.body;

    // Verificar si ya existe (opcional, pero buena práctica)
    const existingGuest = await Guest.findOne({ where: { documentId, hotelId } });
    if (existingGuest) {
      return res.status(400).json({ message: 'El huésped ya existe con este documento.' });
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
      groupCode: groupCode || null,
      hotelId
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
    const hotelId = req.headers['x-hotel-id']; // LEER HEADER
    if (!hotelId) return res.status(400).json({ message: 'Falta x-hotel-id' });

    const { groupCode, documentId } = req.query; // Agregamos documentId
    let whereClause = {hotelId};

    if (groupCode) whereClause.groupCode = groupCode;
    if (documentId) whereClause.documentId = documentId; // Filtro nuevo

    const guests = await Guest.findAll({ where: whereClause });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener huéspedes' });
  }
};

module.exports = { createGuest, getGuests };