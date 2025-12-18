const Room = require('../models/Room');
const RoomType = require('../models/RoomType');

// Endpoint mágico para inicializar datos
const seedDatabase = async (req, res) => {
  try {
    // 1. Crear Tipos
    const simple = await RoomType.create({ name: 'Simple', basePrice: 50.00, capacity: 1 });
    const double = await RoomType.create({ name: 'Doble', basePrice: 80.00, capacity: 2 });
    const suite = await RoomType.create({ name: 'Suite', basePrice: 150.00, capacity: 4 });

    // 2. Crear Habitaciones Físicas
    await Room.bulkCreate([
      { number: '101', roomTypeId: simple.id, status: 'AVAILABLE' },
      { number: '102', roomTypeId: simple.id, status: 'DIRTY' },
      { number: '201', roomTypeId: double.id, status: 'AVAILABLE' },
      { number: '202', roomTypeId: double.id, status: 'OCCUPIED' },
      { number: '301', roomTypeId: suite.id, status: 'AVAILABLE' },
    ]);

    res.json({ message: 'Datos de prueba generados correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todas las habitaciones con su tipo
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [RoomType], // Esto hace el JOIN automáticamente
      order: [['number', 'ASC']]
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { seedDatabase, getRooms };