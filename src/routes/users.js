const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const auth = require('../middleware/jwt');

router.route('/init-data').post(auth,usersController.initData);

module.exports = router;