const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { login } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', loginLimiter, asyncHandler(login));

module.exports = router;
