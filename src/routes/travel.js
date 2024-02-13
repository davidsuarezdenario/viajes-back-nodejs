const express = require('express');
const router = express.Router();
const travelController = require('../controllers/travel');
const auth = require('../middleware/jwt');

router.post('/search_airport', auth, travelController.search_text);
router.post('/search_location', auth, travelController.search_location);
router.post('/booking', auth, travelController.booking);
router.post('/booking_one', auth, travelController.bookingStep1);

module.exports = router;