const express = require('express');
const router = express.Router();
const travelController = require('../controllers/travel');
const auth = require('../middleware/jwt');

/* KIWI */
router.post('/search_airport', travelController.search_text);
router.post('/search_location', travelController.search_location);
router.post('/search_subentity', travelController.search_subentity);
router.post('/search_topdestinations', travelController.search_topdestinations);
router.post('/booking', travelController.booking);
router.post('/booking_one', travelController.bookingStep1);
router.post('/booking_two', travelController.bookingStep2);
router.post('/booking_three', travelController.bookingStep3);

/* WANDERLUST */
router.post('/save_booking', travelController.saveBookingId);

module.exports = router;