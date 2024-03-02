const express = require('express');
const router = express.Router();
const methodsDenarioController = require('../controllers/methodsDenario');
const auth = require('../middleware/jwt');

router.post('/get_cupo', methodsDenarioController.get_cupo);

module.exports = router;