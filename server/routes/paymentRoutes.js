const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/paymentController');

router.post('/payments/checkout', createCheckoutSession);

module.exports = router;
