const express = require('express');
const router = express.Router();
const { register, login, findUser } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/find', findUser);

module.exports = router;