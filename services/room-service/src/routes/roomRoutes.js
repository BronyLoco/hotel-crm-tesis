const express = require('express');
const router = express.Router();
const { seedDatabase, getRooms } = require('../controllers/roomController');

router.post('/seed', seedDatabase); // Ruta para llenar datos
router.get('/', getRooms);          // Ruta para ver datos

module.exports = router;