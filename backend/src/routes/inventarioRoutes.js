const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authAdmin = require('../middleware/authAdmin');
const inventario = require('../controllers/inventarioController');

const router = express.Router();

// Apply authAdmin middleware to all inventory routes
router.use(authAdmin);

// Technological Equipment Routes
router.get('/tecnologico', asyncHandler(inventario.listarEquipoTecnologico));
router.post('/tecnologico', asyncHandler(inventario.crearEquipoTecnologico));
router.get('/tecnologico/:id', asyncHandler(inventario.obtenerEquipoTecnologico));
router.put('/tecnologico/:id', asyncHandler(inventario.actualizarEquipoTecnologico));
router.delete('/tecnologico/:id', asyncHandler(inventario.eliminarEquipoTecnologico));

// Traffic Light Controllers Routes
router.get('/controladores', asyncHandler(inventario.listarControladoresSemaforo));
router.post('/controladores', asyncHandler(inventario.crearControladorSemaforo));
router.get('/controladores/:id', asyncHandler(inventario.obtenerControladorSemaforo));
router.put('/controladores/:id', asyncHandler(inventario.actualizarControladorSemaforo));
router.delete('/controladores/:id', asyncHandler(inventario.eliminarControladorSemaforo));

// Existencias / Stock Routes
router.get('/existencias', asyncHandler(inventario.listarExistencias));
router.post('/existencias', asyncHandler(inventario.ingresarExistencia));
router.put('/existencias/:id', asyncHandler(inventario.actualizarExistencia));
router.delete('/existencias/:id', asyncHandler(inventario.eliminarExistencia));

module.exports = router;
