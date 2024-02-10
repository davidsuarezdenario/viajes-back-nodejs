const express = require('express');
const router = express.Router();
const travelDenarioController = require('../controllers/travelDenario');
const auth = require('../middleware/jwt');

router.post('/search_airport', travelDenarioController.search);
router.post('/booking', travelDenarioController.booking);
router.post('/booking_one', travelDenarioController.bookingStep1);

module.exports = router;