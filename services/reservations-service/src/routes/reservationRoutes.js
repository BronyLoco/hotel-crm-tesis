const express = require('express');
const router = express.Router();
// IMPORTANTE: Asegúrate de que 'checkIn' está importado aquí abajo
const { createReservation, getReservations, checkIn } = require('../controllers/reservationController');

router.post('/', createReservation);
router.get('/', getReservations);

// ESTA ES LA LÍNEA QUE TE FALTA O NO SE GUARDÓ:
router.post('/:reservationId/checkin', checkIn);

module.exports = router;