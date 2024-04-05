const express = require('express');
const router = express.Router();
const denarioController = require('../controllers/denario');
const auth = require('../middleware/jwt');

router.post('/simulate_credit', denarioController.simulateCredit);
router.post('/save_credit', denarioController.saveCredit);
router.post('/end_payment', denarioController.endPayment);
router.post('/ask_code_phone', denarioController.askCodePhone);
router.post('/ask_code_email', denarioController.askCodeEmail);
router.post('/validate_code_phone', denarioController.validateCodePhone);
router.post('/validate_code_email', denarioController.validateCodeEmail);
/* router.post('/credit_limit', denarioController.credit_limit); */

module.exports = router;