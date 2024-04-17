const express = require('express');
const router = express.Router();
const travelController = require('../controllers/travel');
const auth = require('../middleware/jwt');

/* KIWI */
/* router.post('/search_airport', travelController.searchText);
router.post('/search_location', travelController.searchLocation);
router.post('/search_subentity', travelController.searchSubentity);
router.post('/search_topdestinations', travelController.searchTopdestinations);
router.post('/booking', travelController.booking);
router.post('/booking_one', travelController.bookingStep1);
router.post('/booking_two', travelController.bookingStep2);
router.post('/booking_three', travelController.bookingStep3); */

/* WANDERLUST */
router.post('/save_booking', travelController.saveBookingId);
router.post('/get_booking', travelController.getBookingId);

module.exports = router;