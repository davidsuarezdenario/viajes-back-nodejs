const express = require('express'), router = express.Router(), amadeusController = require('../controllers/amadeus');
const auth = require('../middleware/jwt');

/* AMADEUS */
router.get('/iata_codes', amadeusController.iataCodes);
router.get('/array_iata', amadeusController.updateArrayIata);
router.post('/search_iata', amadeusController.searchArrayIata);
router.post('/fare_search', amadeusController.fare_search);
router.post('/air_sell', amadeusController.air_sell);
router.post('/pnr_ame', amadeusController.pnr_ame);
/* 
router.post('/informative_pricing_without_pnr', amadeusController.Fare_InformativePricingWithoutPNR);
router.post('/sell_from_recommendation', amadeusController.Air_SellFromRecommendation);
router.post('/add_multi_elements', amadeusController.PNR_AddMultiElements);
router.post('/create_form_of_payment', amadeusController.FOP_CreateFormOfPayment);
router.post('/price_pnr_with_booking_class', amadeusController.Fare_PricePNRWithBookingClass);
router.post('/create_tst_from_pricing', amadeusController.Ticket_CreateTSTFromPricing);
router.post('/sign_out', amadeusController.Security_SignOut);
router.post('/xml2json', amadeusController.xml2jsonReq);
router.post('/json2xml', amadeusController.json2xmlReq); 
*/

// router.post('/create-pnr', newController.newModel);
/* router.post('/xml', amadeusController.testXML);
router.post('/header', amadeusController.header); */
module.exports = router;