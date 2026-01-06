const Room = require('../models/Room');
const RoomType = require('../models/RoomType');

// 1. SEMILLA DE DATOS (Necesaria para crear las habitaciones)
const seedDatabase = async (req, res) => {
  try {
    // Crear Tipos
    // Usamos findOrCreate para no duplicar si ya existen
    const [simple] = await RoomType.findOrCreate({ where: { name: 'Simple' }, defaults: { basePrice: 50.00, capacity: 1 } });
    const [double] = await RoomType.findOrCreate({ where: { name: 'Doble' }, defaults: { basePrice: 80.00, capacity: 2 } });
    const [suite] = await RoomType.findOrCreate({ where: { name: 'Suite' }, defaults: { basePrice: 150.00, capacity: 4 } });

    // Borrar habitaciones anteriores para limpiar
    await Room.destroy({ where: {}, truncate: true });

    // Crear Habitaciones Físicas
    await Room.bulkCreate([
      { number: '101', roomTypeId: simple.id, status: 'AVAILABLE', maxOccupancy: 1, currentOccupancy: 0 },
      { number: '102', roomTypeId: simple.id, status: 'DIRTY', maxOccupancy: 1, currentOccupancy: 0 },
      { number: '201', roomTypeId: double.id, status: 'AVAILABLE', maxOccupancy: 2, currentOccupancy: 0 },
      { number: '202', roomTypeId: double.id, status: 'OCCUPIED', maxOccupancy: 2, currentOccupancy: 2 },
      { number: '301', roomTypeId: suite.id, status: 'AVAILABLE', maxOccupancy: 4, currentOccupancy: 0 },
    ]);

    res.json({ message: 'Datos de prueba generados correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. OBTENER HABITACIONES
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [RoomType], 
      order: [['number', 'ASC']]
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. ACTUALIZAR ESTADO (La nueva lógica inteligente)
const updateRoomStatus = async (req, res) => {
  try {
    const { number } = req.params; 
    const { status, occupancyChange } = req.body; 

    const room = await Room.findOne({ where: { number } });
    
    if (!room) return res.status(404).json({ message: 'Habitación no encontrada' });

    // Lógica inteligente de cupos
    if (occupancyChange !== undefined) {
      const newOccupancy = room.currentOccupancy + parseInt(occupancyChange);
      
      // Validar límites
      if (newOccupancy < 0) room.currentOccupancy = 0;
      else if (newOccupancy > room.maxOccupancy) return res.status(400).json({ message: 'Excede capacidad máxima' });
      else room.currentOccupancy = newOccupancy;

      // Calcular estado automático
      if (room.currentOccupancy === 0) {
          // Si estaba ocupada y se vacía, pasa a sucia (a menos que ya estuviera disponible)
          if(room.status !== 'AVAILABLE') room.status = 'DIRTY';
      }
      else if (room.currentOccupancy < room.maxOccupancy) room.status = 'PARTIALLY_OCCUPIED';
      else room.status = 'OCCUPIED'; // Llena
    } else {
      // Cambio manual de estado (limpieza)
      if (status) room.status = status;
      if (status === 'AVAILABLE') room.currentOccupancy = 0; 
    }

    await room.save();

    res.json({ message: `Estado actualizado: ${room.status}`, room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ¡ESTA ES LA PARTE IMPORTANTE! ASEGÚRATE DE EXPORTAR LAS 3
module.exports = { seedDatabase, getRooms, updateRoomStatus };