const express = require('express');
const router = express.Router();
const { register, login, me, refresh, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');
const { registerValidator, loginValidator } = require('../validators/authValidators');

router.post('/register', authLimiter, registerValidator, validateRequest, register);
router.post('/login', authLimiter, loginValidator, validateRequest, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', auth, me);

module.exports = router;
