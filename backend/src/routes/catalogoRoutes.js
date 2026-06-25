const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listarCatalogo } = require('../controllers/catalogoController');

const router = express.Router();

router.get('/:tipo', asyncHandler(listarCatalogo));

module.exports = router;
