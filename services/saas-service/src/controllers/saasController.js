const axios = require('axios');
const Tenant = require('../models/Tenant');
const Plan = require('../models/Plan');

// 1. Inicializar Planes (Seed interno)
const seedPlans = async (req, res) => {
  try {
    await Plan.findOrCreate({ where: { name: 'Emprendedor' }, defaults: { price: 29.00, maxHotels: 1 } });
    await Plan.findOrCreate({ where: { name: 'Cadena Hotelera' }, defaults: { price: 99.00, maxHotels: 5 } });
    res.json({ message: 'Planes SaaS creados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Obtener Planes (Para mostrarlos en la web)
const getPlans = async (req, res) => {
  const plans = await Plan.findAll();
  res.json(plans);
};

// 3. Registrar Nuevo Gerente (Register flow)
const registerManager = async (req, res) => {
  try {
    const { username, password, fullName, companyName, planId } = req.body;

    // A. Validar Plan
    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan no válido' });

    // B. Crear Usuario en Auth-Service (Comunicación entre microservicios)
    let authResponse;
    try {
      authResponse = await axios.post(`${process.env.AUTH_SERVICE_URL}/register`, {
        username,
        password,
        fullName,
        role: 'MANAGER' // Forzamos el rol de Gerente
      });
    } catch (authError) {
      // DEBUG: Imprimir error completo en la consola del backend para que lo veas con 'docker logs'
      console.error("ERROR AUTH:", authError.response?.data || authError.message);

      return res.status(400).json({ 
        message: 'Error registrando usuario en Auth Service', 
        details: authError.response?.data?.message || authError.message // <--- ESTO ES LO QUE LEEMOS EN FRONTEND
      });
    }

    const newUserId = authResponse.data.user.id;

    // C. Crear Tenant Localmente
    const newTenant = await Tenant.create({
      companyName,
      ownerUserId: newUserId,
      planId: plan.id,
      status: 'PENDING_PAYMENT' // Nace debiendo dinero
    });

    res.status(201).json({
      message: 'Cuenta creada. Por favor realice el pago para activar.',
      tenant: newTenant,
      user: authResponse.data.user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Procesar Pago de Suscripción (MOCK)
const processPayment = async (req, res) => {
  try {

     // --- DEBUG LOG ---
    console.log("💰 PETICIÓN DE PAGO RECIBIDA");
    console.log("Body:", req.body);


    const { tenantId, cardNumber } = req.body;

    // Simular tiempo de espera de un banco (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validación Ficticia:
    // Si la tarjeta empieza con '4', es Visa y pasa.
    // Si empieza con '5', es MasterCard y falla (sin fondos).
    if (!cardNumber.startsWith('4')) {
      return res.status(402).json({ message: 'Pago rechazado: Fondos insuficientes o tarjeta inválida.' });
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Empresa no encontrada' });

    // ACTIVAR CUENTA
    tenant.status = 'ACTIVE';
    tenant.subscriptionId = 'SUB-' + Math.floor(Math.random() * 1000000); // ID falso de Stripe
    await tenant.save();

    res.json({ message: 'Pago exitoso. Su cuenta ha sido activada.', tenant });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTenantByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔎 [SAAS] Buscando Tenant para el User ID: ${userId}`);

    const tenant = await Tenant.findOne({ where: { ownerUserId: userId } });
    
    if (!tenant) {
      console.warn(`⚠️ [SAAS] No se encontró Tenant para User ID: ${userId}`);
      return res.status(404).json({ message: 'Usuario no tiene empresa asignada' });
    }
    
    console.log(`✅ [SAAS] Tenant encontrado:`, tenant.toJSON());
    res.json(tenant);

  } catch (error) {
    // ESTO ES LO QUE NECESITAMOS VER:
    console.error("🔴 [SAAS] ERROR CRITICO EN getTenantByUser:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

module.exports = { 
  seedPlans, 
  getPlans, 
  registerManager, 
  processPayment,
  getTenantByUser
};