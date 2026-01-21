const express = require('express');
const router = express.Router();
const { 
    seedPlans, 
    getPlans, 
    registerManager, 
    processPayment, 
    getTenantByUser
} = require('../controllers/saasController');

router.post('/seed', seedPlans);
router.get('/plans', getPlans);
router.post('/register', registerManager);
router.post('/pay', processPayment);
router.get('/user/:userId', getTenantByUser);

module.exports = router;