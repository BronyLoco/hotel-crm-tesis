const express = require('express');
const router = express.Router();
const { logEvent, getLogs } = require('../controllers/auditController');

router.post('/', logEvent);
router.get('/', getLogs);

module.exports = router;