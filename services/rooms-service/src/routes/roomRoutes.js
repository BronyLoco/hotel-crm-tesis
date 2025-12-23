const express = require('express');
const router = express.Router();
const { seedDatabase, getRooms, updateRoomStatus } = require('../controllers/roomController');

router.post('/seed', seedDatabase); // Ruta para llenar datos
router.get('/', getRooms);          // Ruta para ver datos
router.patch('/:number/status', updateRoomStatus); // Actualizar estado de una habitación
module.exports = router;