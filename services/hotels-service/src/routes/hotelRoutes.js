const express = require('express');
const router = express.Router();
const {
    createHotel, 
    getMyHotels,
    addStaff,
    getStaff,
    getTenantStaff
} = require('../controllers/hotelController');

router.post('/', createHotel);
router.get('/', getMyHotels);
router.post('/staff', addStaff);
router.get('/staff', getStaff);
router.get('/staff/tenant', getTenantStaff);

module.exports = router;