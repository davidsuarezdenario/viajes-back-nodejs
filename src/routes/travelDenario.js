const express = require('express');
const router = express.Router();
const travelDenarioController = require('../controllers/travelDenario');
const auth = require('../middleware/jwt');

router.post('/search_airport',auth, travelDenarioController.search);
router.post('/booking',auth, travelDenarioController.booking);
router.post('/booking_one',auth, travelDenarioController.bookingStep1);

module.exports = router;