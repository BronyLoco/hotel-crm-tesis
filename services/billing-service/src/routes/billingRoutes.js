const express = require('express');
const router = express.Router();
const {
    createFolio, 
    addCharge, 
    getFolioDetails, 
    payFolio, 
    getDailyRevenue 
} = require('../controllers/billingController');

router.post('/', createFolio); // Crear folio
router.post('/:folioId/charges', addCharge); // Agregar cargo
router.get('/reservation/:reservationId', getFolioDetails); // Ver cuenta
router.post('/:folioId/pay', payFolio); // Pagar cuenta
router.get('/reports/revenue', getDailyRevenue); // Reporte de ingresos
module.exports = router;