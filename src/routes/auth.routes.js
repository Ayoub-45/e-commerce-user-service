const express = require('express');
const router = express.Router();
const { register, login, refreshToken,verifyEmail, requestPasswordReset, resetPassword} = require('../controllers/authController');
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/verify-email',verifyEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
