const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const auth = require('../middleware/jwt');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.route('/sesion').get(auth, authController.sesion);

module.exports = router;