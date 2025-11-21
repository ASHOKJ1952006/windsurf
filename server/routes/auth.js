const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, getMe, bootstrapAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
// Development helper to create first admin if none exists
router.post('/bootstrap-admin', bootstrapAdmin);

module.exports = router;
