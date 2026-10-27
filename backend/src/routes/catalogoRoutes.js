const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listarCatalogo, obtenerEquiposPorResponsable } = require('../controllers/catalogoController');

const router = express.Router();

router.get('/equipos-responsable', asyncHandler(obtenerEquiposPorResponsable));
router.get('/:tipo', asyncHandler(listarCatalogo));

module.exports = router;
