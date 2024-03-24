const express = require('express');
const router = express.Router();
const denarioController = require('../controllers/denario');
const auth = require('../middleware/jwt');

/* router.post('/credit_limit', denarioController.credit_limit); */

module.exports = router;