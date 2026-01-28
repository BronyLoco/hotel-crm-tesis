const AuditLog = require('../models/AuditLog');

// Guardar un evento (Llamado por otros microservicios)
const logEvent = async (req, res) => {
  try {
    const { action, details, userId, username, hotelId } = req.body;
    await AuditLog.create({ 
      action, 
      details: typeof details === 'object' ? JSON.stringify(details) : details, 
      userId, 
      username, 
      hotelId 
    });
    res.status(201).json({ message: 'Logged' });
  } catch (error) {
    console.error("Audit Error:", error);
    res.status(500).json({ error: error.message }); // No bloqueamos el flujo principal
  }
};

// Leer logs (Para el Gerente)
const getLogs = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ message: "Falta hotelId" });

    const logs = await AuditLog.findAll({ 
      where: { hotelId },
      order: [['timestamp', 'DESC']],
      limit: 100 // Solo los últimos 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { logEvent, getLogs };