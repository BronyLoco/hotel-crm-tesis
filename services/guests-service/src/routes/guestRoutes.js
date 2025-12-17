const express = require('express');
const router = express.Router();
const { createGuest, getGuests } = require('../controllers/guestController');

// Definir rutas
// GET /api/guests
router.get('/', getGuests);

// POST /api/guests
router.post('/', createGuest);

module.exports = router;