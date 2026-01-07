const Room = require('../models/Room');
const RoomType = require('../models/RoomType');

// 1. SEMILLA DE DATOS
const seedDatabase = async (req, res) => {
  try {
    // CAMBIO IMPORTANTE: Quitamos "truncate: true".
    // Esto hace un "DELETE FROM table", que es más lento pero respeta las FK y no da error.
    await Room.destroy({ where: {} });
    await RoomType.destroy({ where: {} });

    // ... (El resto del código de creación de tipos y habitaciones sigue IGUAL) ...
    // Tipo A: Económica
    const typeEco = await RoomType.create({ 
      name: 'Económica (Simple/Baño Comp.)', 
      basePrice: 10.00, 
      capacity: 1 
    });

    const typeStd = await RoomType.create({ 
      name: 'Estándar (Simple/Baño Priv./TV)', 
      basePrice: 20.00, 
      capacity: 2 
    });

    const typeMat = await RoomType.create({ 
      name: 'Matrimonial (Baño Priv./TV)', 
      basePrice: 35.00, 
      capacity: 2 
    });

    const typeFam = await RoomType.create({ 
      name: 'Familiar (3-4 Camas)', 
      basePrice: 15.00, 
      capacity: 4 
    });

    await Room.bulkCreate([
      { number: '101', roomTypeId: typeEco.id, status: 'AVAILABLE', maxOccupancy: 1, currentOccupancy: 0 },
      { number: '102', roomTypeId: typeEco.id, status: 'AVAILABLE', maxOccupancy: 1, currentOccupancy: 0 },
      { number: '201', roomTypeId: typeStd.id, status: 'AVAILABLE', maxOccupancy: 2, currentOccupancy: 0 },
      { number: '202', roomTypeId: typeStd.id, status: 'DIRTY', maxOccupancy: 2, currentOccupancy: 0 },
      { number: '301', roomTypeId: typeMat.id, status: 'AVAILABLE', maxOccupancy: 2, currentOccupancy: 0 },
      { number: '401', roomTypeId: typeFam.id, status: 'AVAILABLE', maxOccupancy: 4, currentOccupancy: 0 },
    ]);

    res.json({ message: 'Catalogo de habitaciones actualizado al nuevo modelo de negocio' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

const updateRoomStatus = async (req, res) => {
  try {
    const { number } = req.params; 
    const { status, occupancyChange } = req.body; 

    const room = await Room.findOne({ where: { number } });
    
    if (!room) return res.status(404).json({ message: 'Habitación no encontrada' });

    if (occupancyChange !== undefined) {
      const newOccupancy = room.currentOccupancy + parseInt(occupancyChange);
      
      if (newOccupancy < 0) room.currentOccupancy = 0;
      else if (newOccupancy > room.maxOccupancy) return res.status(400).json({ message: 'Excede capacidad máxima' });
      else room.currentOccupancy = newOccupancy;

      if (room.currentOccupancy === 0) {
          if(room.status !== 'AVAILABLE') room.status = 'DIRTY';
      }
      else if (room.currentOccupancy < room.maxOccupancy) room.status = 'PARTIALLY_OCCUPIED';
      else room.status = 'OCCUPIED'; 
    } else {
      if (status) room.status = status;
      if (status === 'AVAILABLE') room.currentOccupancy = 0; 
    }

    await room.save();

    res.json({ message: `Estado actualizado: ${room.status}`, room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { seedDatabase, getRooms, updateRoomStatus };