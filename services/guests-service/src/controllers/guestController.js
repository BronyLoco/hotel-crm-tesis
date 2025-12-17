const Guest = require('../models/Guest');

// 1. Crear un nuevo huésped
const createGuest = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, documentId } = req.body;

    // Verificar si ya existe (opcional, pero buena práctica)
    const existingGuest = await Guest.findOne({ where: { documentId } });
    if (existingGuest) {
      return res.status(400).json({ message: 'El huésped ya existe con este documento.' });
    }

    // Crear en BD
    const newGuest = await Guest.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      documentId
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
    const guests = await Guest.findAll();
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener huéspedes' });
  }
};

module.exports = { createGuest, getGuests };