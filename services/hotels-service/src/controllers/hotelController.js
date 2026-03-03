const Hotel = require('../models/Hotel');
const HotelStaff = require('../models/HotelStaff');
const { Op} =require('sequelize');

// Crear un Hotel nuevo
const createHotel = async (req, res) => {
  try {
    console.log("📥 [HOTELS] Recibida petición crear hotel:", req.body);

    const { name, address, stars, tenantId } = req.body;
    
    if (!tenantId) {
        console.error("🔴 [HOTELS] Error: tenantId es null o undefined");
        return res.status(400).json({ message: "Falta el ID de la empresa (tenantId)" });
    }

    const newHotel = await Hotel.create({ name, address, stars, tenantId });
    
    console.log("✅ [HOTELS] Hotel creado:", newHotel.toJSON());
    res.status(201).json(newHotel);
  } catch (error) {
    console.error("🔴 [HOTELS] ERROR SQL:", error);
    res.status(500).json({ error: error.message });
  }
};

// Listar MIS hoteles
const getMyHotels = async (req, res) => {
  try {
    const { tenantId, userId, role } = req.query;

    // --- DEBUG MAESTRO ---
    // Ponlo aquí para ver EXACTAMENTE qué está enviando el Frontend
    console.log(`🔎 [HOTELS] Petición recibida. Params:`, req.query);

    // CASO 1: Es un Gerente (Busca por Empresa/Tenant)
    if (role === 'MANAGER') {
        if (!tenantId) {
            console.warn("⚠️ [HOTELS] Manager sin tenantId");
            return res.status(400).json({ message: "Falta tenantId" });
        }

        const hotels = await Hotel.findAll({ where: { tenantId } });
        console.log(`✅ [HOTELS] Manager: Encontrados ${hotels.length} hoteles.`);
        return res.json(hotels);
    } 
    
    // CASO 2: Es un Recepcionista (Busca por Asignación Personal)
    else {
        console.log(`👤 [HOTELS] Buscando asignaciones para empleado ID: ${userId}`);
        
        if (!userId) {
             return res.status(400).json({ message: "Falta userId para buscar empleado" });
        }

        const assignments = await HotelStaff.findAll({ where: { userId } });
        
        if (assignments.length === 0) {
            console.log("⚠️ [HOTELS] Empleado sin hoteles asignados.");
            return res.json([]);
        }

        const hotelIds = assignments.map(a => a.hotelId);
        const hotels = await Hotel.findAll({ where: { id: { [Op.in]: hotelIds } } });
        
        return res.json(hotels);
    }

  } catch (error) {
    console.error("🔴 [HOTELS] Error Crítico:", error);
    res.status(500).json({ error: error.message });
  }
};

// NUEVO: Asignar empleado a hotel
const addStaff = async (req, res) => {
  try {
    const { hotelId, userId } = req.body;
    // Validar que no exista ya
    const existing = await HotelStaff.findOne({ where: { hotelId, userId } });
    if (existing) return res.status(400).json({ message: "Ya trabaja aquí" });

    await HotelStaff.create({ hotelId, userId });
    res.json({ message: "Personal asignado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NUEVO: Obtener personal de un hotel
const getStaff = async (req, res) => {
    try {
        const { hotelId } = req.query;
        // Aquí solo devolvemos los IDs, en el frontend cruzaremos con Auth para nombres
        // O idealmente haríamos una petición interna a Auth, pero vamos simple.
        const staff = await HotelStaff.findAll({ where: { hotelId } });
        res.json(staff);
    } catch (e) { res.status(500).json({ error: e.message }); }
}
const getTenantStaff = async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ message: "Falta tenantId" });

    // 1. Buscar todos mis hoteles
    const myHotels = await Hotel.findAll({ where: { tenantId }, attributes: ['id'] });
    const myHotelIds = myHotels.map(h => h.id);

    if (myHotelIds.length === 0) return res.json([]);

    // 2. Buscar todas las asignaciones en esos hoteles
    const allAssignments = await HotelStaff.findAll({ 
        where: { hotelId: { [Op.in]: myHotelIds } } 
    });

    // 3. Extraer IDs de usuarios únicos
    const uniqueUserIds = [...new Set(allAssignments.map(a => a.userId))];

    // Devolvemos solo los IDs, el frontend buscará los nombres
    res.json(uniqueUserIds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createHotel, getMyHotels, addStaff, getStaff, getTenantStaff };