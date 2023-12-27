const express = require('express');
const router = express.Router();
const greetingController = require('../controllers/greeting');
const auth = require('../middleware/jwt');

router.route('/')
    .get(auth,greetingController.greeting)
    .post(auth,greetingController.greeting);

module.exports = router;