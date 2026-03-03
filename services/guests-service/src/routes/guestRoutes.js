const express = require('express');
const router = express.Router();
const { createGuest, getGuests, deleteGuest, updateGuest } = require('../controllers/guestController');
const { createEvent, getEvents, updateEvent, toggleEventStatus } = require('../controllers/groupController');

// Definir rutas
//GUESTS
router.get('/', getGuests);
router.post('/', createGuest);
router.delete('/:id', deleteGuest);
router.put('/:id', updateGuest);

//EVENTS
router.post('/groups', createEvent);
router.patch('/groups/:id/status', toggleEventStatus);
router.get('/groups', getEvents);
router.patch('/groups/:id', updateEvent);

module.exports = router;