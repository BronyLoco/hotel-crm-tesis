const express = require('express');
const router = express.Router();
// IMPORTANTE: Asegúrate de que 'checkIn' está importado aquí abajo
const { createReservation, getReservations, checkIn, checkOut } = require('../controllers/reservationController');

router.post('/', createReservation);
router.get('/', getReservations);
router.post('/:reservationId/checkin', checkIn);
router.post('/:reservationId/checkout', checkOut);

module.exports = router;