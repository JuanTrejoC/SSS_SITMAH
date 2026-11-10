const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listarCatalogo, obtenerEquiposPorResponsable, crearCruceroRapido } = require('../controllers/catalogoController');
const authAdminOrInfra = require('../middleware/authAdminOrInfra');

const router = express.Router();

router.get('/equipos-responsable', asyncHandler(obtenerEquiposPorResponsable));
router.get('/:tipo', asyncHandler(listarCatalogo));
router.post('/cruceros', authAdminOrInfra, asyncHandler(crearCruceroRapido));

module.exports = router;
