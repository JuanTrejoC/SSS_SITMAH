const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authAdmin = require('../middleware/authAdmin');
const authAdminOrInfra = require('../middleware/authAdminOrInfra');
const inventario = require('../controllers/inventarioController');

const router = express.Router();

// Technological Equipment Routes (Herramientas & Tecnologico)
router.get('/tecnologico', authAdminOrInfra, asyncHandler(inventario.listarEquipoTecnologico));
router.post('/tecnologico', authAdminOrInfra, asyncHandler(inventario.crearEquipoTecnologico));
router.get('/tecnologico/:id', authAdminOrInfra, asyncHandler(inventario.obtenerEquipoTecnologico));
router.put('/tecnologico/:id', authAdminOrInfra, asyncHandler(inventario.actualizarEquipoTecnologico));
router.delete('/tecnologico/:id', authAdminOrInfra, asyncHandler(inventario.eliminarEquipoTecnologico));

// Apply authAdmin middleware to all remaining inventory routes
router.use(authAdmin);

// Traffic Light Controllers Routes
router.get('/controladores', asyncHandler(inventario.listarControladoresSemaforo));
router.post('/controladores', asyncHandler(inventario.crearControladorSemaforo));
router.get('/controladores/:id', asyncHandler(inventario.obtenerControladorSemaforo));
router.put('/controladores/:id', asyncHandler(inventario.actualizarControladorSemaforo));
router.delete('/controladores/:id', asyncHandler(inventario.eliminarControladorSemaforo));

// Existencias / Stock Routes
router.get('/existencias', asyncHandler(inventario.listarExistencias));
router.post('/existencias', asyncHandler(inventario.ingresarExistencia));
router.get('/existencias/:id/historial', asyncHandler(inventario.obtenerHistorialExistencia));
router.put('/existencias/:id', asyncHandler(inventario.actualizarExistencia));
router.get('/existencias/export', asyncHandler(inventario.exportarExistenciasExcel));


module.exports = router;
