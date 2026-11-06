const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { login, renovar } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimit');
const authAdminOrInfra = require('../middleware/authAdminOrInfra');

const router = express.Router();

router.post('/login', loginLimiter, asyncHandler(login));
router.post('/renovar', authAdminOrInfra, asyncHandler(renovar));

module.exports = router;
