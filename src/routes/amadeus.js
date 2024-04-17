const express = require('express');
const router = express.Router();
const amadeusController = require('../controllers/amadeus');
const auth = require('../middleware/jwt');

/* AMADEUS */
router.post('/search_airport', amadeusController.searchText);
/* router.post('/search_location', travelController.searchLocation);
router.post('/search_subentity', travelController.searchSubentity);
router.post('/search_topdestinations', travelController.searchTopdestinations);
router.post('/booking', travelController.booking);
router.post('/booking_one', travelController.bookingStep1);
router.post('/booking_two', travelController.bookingStep2);
router.post('/booking_three', travelController.bookingStep3); */

/* WANDERLUST */
router.post('/save_booking', amadeusController.saveBookingId);
router.post('/get_booking', amadeusController.getBookingId);

module.exports = router;