const express = require('express');
const router = express.Router();
const amadeusController = require('../controllers/amadeus');
const auth = require('../middleware/jwt');

/* AMADEUS */
router.get('/iata_codes', amadeusController.iataCodes);
router.post('/booking', amadeusController.booking1);
router.post('/booking_2', amadeusController.booking2);

router.post('/xml2json', amadeusController.xml2jsonReq);
router.post('/json2xml', amadeusController.json2xmlReq);
/* router.post('/xml', amadeusController.testXML);
router.post('/header', amadeusController.header); */
/* router.post('/search_location', travelController.searchLocation);
router.post('/search_subentity', travelController.searchSubentity);
router.post('/search_topdestinations', travelController.searchTopdestinations);
router.post('/booking_one', travelController.bookingStep1);
router.post('/booking_two', travelController.bookingStep2);
router.post('/booking_three', travelController.bookingStep3); */

module.exports = router;