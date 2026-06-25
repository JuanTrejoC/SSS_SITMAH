const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authAdmin = require('../middleware/authAdmin');
const { login } = require('../controllers/authController');

const router = express.Router();

router.post('/login', asyncHandler(login));

module.exports = router;
