const express = require('express');
const router = express.Router();
const { createHotel, getMyHotels } = require('../controllers/hotelController');

router.post('/', createHotel);
router.get('/', getMyHotels);

module.exports = router;