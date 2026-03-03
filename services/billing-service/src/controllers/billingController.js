const { Op } = require('sequelize');
const Folio = require('../models/Folio');
const Charge = require('../models/Charge');

// Crear Folio (Se llamará cuando haya Check-in)
const createFolio = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'];
    const { reservationId, groupEventId } = req.body;

    // --- LOGS DE DEBUG (Miralos en docker logs billing_service) ---
    console.log("💰 [BILLING] createFolio llamado.");
    console.log("   -> Header x-hotel-id:", hotelId);
    console.log("   -> Body:", req.body);
    // -------------------------------------------------------------

    if (!hotelId) {
        console.error("❌ Falta x-hotel-id");
        return res.status(400).json({ message: "Falta x-hotel-id en header" });
    }

    // Validación: O es reserva o es grupo
    if (!reservationId && !groupEventId) {
        console.error("❌ Falta ID de reserva o grupo");
        return res.status(400).json({ message: "Debe enviar reservationId o groupEventId" });
    }

    // Verificar existencia
    let whereClause = {};
    if (reservationId) whereClause.reservationId = reservationId;
    if (groupEventId) whereClause.groupEventId = groupEventId;

    const existing = await Folio.findOne({ where: whereClause });
    if (existing) {
        console.log("✅ Folio ya existía:", existing.id);
        return res.status(200).json(existing);
    }

    console.log("🔨 Creando nuevo folio...");
    const newFolio = await Folio.create({ 
        reservationId: reservationId || null,
        groupEventId: groupEventId || null,
        hotelId 
    });
    
    console.log("✅ Folio creado ID:", newFolio.id);
    res.status(201).json(newFolio);

  } catch (error) {
    console.error("🔴 Error SQL/Lógica en createFolio:", error);
    res.status(500).json({ error: error.message });
  }
};
const getFolioByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const folio = await Folio.findOne({ where: { groupEventId: groupId }, include: [Charge] });
        if (!folio) return res.status(404).json({ message: 'No hay cuenta maestra' });
        res.json(folio);
    } catch (e) { res.status(500).json({error: e.message}); }
};

// Agregar un cargo (Coca-cola, Lavandería, etc)
const addCharge = async (req, res) => {
  try {
    const { folioId } = req.params;
    const { description, amount } = req.body;

    const folio = await Folio.findByPk(folioId);
    if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });

    if (folio.status === 'CLOSED') {
      return res.status(400).json({ message: 'No se pueden agregar cargos a un folio cerrado' });
    }

    // Crear el cargo
    const charge = await Charge.create({
      folioId,
      description,
      amount
    });

    // Actualizar el total del folio
    // Nota: En un sistema real esto sería un trigger o cálculo dinámico, pero aquí lo sumamos simple.
    const currentTotal = parseFloat(folio.totalAmount);
    const newAmount = parseFloat(amount);
    folio.totalAmount = currentTotal + newAmount;
    await folio.save();

    res.json({ message: 'Cargo agregado', charge, newTotal: folio.totalAmount });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ver detalle de cuenta
const getFolioDetails = async (req, res) => {
  console.log(`💰 [BILLING] Buscando folio para reserva: ${req.params.reservationId}`);
  try {
    const { reservationId } = req.params; // Buscamos por Reserva, es más fácil para el frontend
    
    const folio = await Folio.findOne({
      where: { reservationId },
      include: [Charge] // Traer todos los cargos
    });

    if (!folio) {
      console.warn("   -> Folio no encontrado (404)");
      return res.status(404).json({ message: 'No hay cuenta' });
    }

    res.json(folio);
  } catch (error) {
    console.error("🔴 [BILLING] Error buscando:", error);
    res.status(500).json({ error: error.message });
  }
};

const payFolio = async (req, res) => {
  try {
    const { folioId } = req.params;
    const folio = await Folio.findByPk(folioId);

    if (!folio) return res.status(404).json({ message: 'Folio no encontrado' });

    if (folio.totalAmount > 0 && folio.status === 'PAID') {
        return res.status(400).json({ message: 'Este folio ya está pagado' });
    }

    // En un sistema real aquí iría la integración con Stripe/PayPal/Tarjeta
    // Para la tesis, simulamos que el pago fue exitoso.
    folio.status = 'PAID';
    await folio.save();

    res.json({ message: 'Pago registrado exitosamente. Folio cerrado.', folio });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reporte simple de ingresos
const getDailyRevenue = async (req, res) => {
  try {
    const folios = await Folio.findAll({ where: { status: 'PAID' } });
    
    // Sumar el total (Reduce de JavaScript)
    const total = folios.reduce((sum, folio) => sum + parseFloat(folio.totalAmount), 0);
    
    res.json({ totalRevenue: total, count: folios.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getRevenueReport = async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id']; // <--- LEER HEADER
    if (!hotelId) return res.status(400).json({ message: 'Falta x-hotel-id' });

    const { startDate, endDate } = req.query;
    
    // Filtro base: Solo pagados Y de este hotel
    let whereClause = { status: 'PAID', hotelId }; 

    if (startDate && endDate) {
      whereClause.updatedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const folios = await Folio.findAll({ 
      where: whereClause,
      include: [Charge] 
    });
    
    const totalRevenue = folios.reduce((sum, f) => sum + parseFloat(f.totalAmount || 0), 0);
    
    res.json({ 
      totalRevenue, 
      count: folios.length, 
      folios 
    });

  } catch (error) {
    console.error("Error en reporte:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  createFolio, 
  addCharge, 
  getFolioDetails, 
  payFolio, 
  getDailyRevenue,
  getRevenueReport,
  getFolioByGroup 
};