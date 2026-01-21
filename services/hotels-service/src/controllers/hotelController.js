const Hotel = require('../models/Hotel');

// Crear un Hotel nuevo
const createHotel = async (req, res) => {
  try {
    // tenantId vendrá del Frontend (del usuario logueado)
    const { name, address, stars, tenantId } = req.body;
    
    const newHotel = await Hotel.create({ name, address, stars, tenantId });
    res.status(201).json(newHotel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar MIS hoteles
const getMyHotels = async (req, res) => {
  try {
    const { tenantId } = req.query; // Filtramos por el dueño
    if (!tenantId) return res.status(400).json({ message: "Falta tenantId" });

    const hotels = await Hotel.findAll({ where: { tenantId } });
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createHotel, getMyHotels };