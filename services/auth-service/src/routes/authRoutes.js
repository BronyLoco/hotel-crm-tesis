const express = require('express');
const router = express.Router();
const { register, login, findUser, getUsersBatch } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/find', findUser);
router.post('/batch', getUsersBatch);

module.exports = router;