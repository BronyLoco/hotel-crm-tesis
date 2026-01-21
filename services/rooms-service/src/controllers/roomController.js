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

// OBTENER HABITACIONES (Filtradas por Hotel)
const getRooms = async (req, res) => {
  try {
    // Leemos el Header que mandó el Frontend
    const hotelId = req.headers['x-hotel-id'];
    
    if (!hotelId) return res.status(400).json({ message: 'Falta cabecera x-hotel-id' });

    const rooms = await Room.findAll({
      where: { hotelId }, // <--- EL FILTRO MÁGICO
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
const initializeHotelRooms = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'];
    if (!hotelId) return res.status(400).json({ message: "Falta x-hotel-id" });

    // Verificar si ya tiene habitaciones
    const count = await Room.count({ where: { hotelId } });
    if (count > 0) return res.status(400).json({ message: "Este hotel ya tiene habitaciones." });

    // 1. Asegurar tipos (Buscamos o creamos los tipos globales)
    const [typeEco] = await RoomType.findOrCreate({ where: { name: 'Económica' }, defaults: { basePrice: 10.00, capacity: 1 } });
    const [typeStd] = await RoomType.findOrCreate({ where: { name: 'Estándar' }, defaults: { basePrice: 20.00, capacity: 2 } });
    const [typeMat] = await RoomType.findOrCreate({ where: { name: 'Matrimonial' }, defaults: { basePrice: 35.00, capacity: 2 } });

    // 2. Crear Habitaciones para ESTE hotel
    // Usamos prefijos para que no se repitan los números entre hoteles si validas unicidad global, 
    // pero si validas unicidad por hotel, pueden llamarse igual.
    // Asumiremos que 'number' es único globalmente por simplicidad en tu modelo actual, 
    // así que le agregamos el hotelId al número: "101-H1", "101-H2".
    
    const suffix = `-H${hotelId}`;

    await Room.bulkCreate([
      { number: `101${suffix}`, hotelId, roomTypeId: typeEco.id, status: 'AVAILABLE', maxOccupancy: 1, currentOccupancy: 0 },
      { number: `102${suffix}`, hotelId, roomTypeId: typeEco.id, status: 'AVAILABLE', maxOccupancy: 1, currentOccupancy: 0 },
      { number: `201${suffix}`, hotelId, roomTypeId: typeStd.id, status: 'AVAILABLE', maxOccupancy: 2, currentOccupancy: 0 },
      { number: `301${suffix}`, hotelId, roomTypeId: typeMat.id, status: 'AVAILABLE', maxOccupancy: 2, currentOccupancy: 0 },
    ]);

    res.json({ message: 'Habitaciones inicializadas para su hotel.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRoom = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'];
    const { number, roomTypeId, maxOccupancy } = req.body;
    
    const newRoom = await Room.create({
      number, roomTypeId, hotelId, maxOccupancy, currentOccupancy: 0, status: 'AVAILABLE'
    });
    res.json(newRoom);
  } catch (e) { res.status(500).json({error: e.message}); }
};

module.exports = { seedDatabase, getRooms, updateRoomStatus, initializeHotelRooms, createRoom };
