const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authAdmin = require('../middleware/authAdmin');
const adminCatalogo = require('../controllers/adminCatalogoController');
const usuario = require('../controllers/usuarioController');
const reporteOficina = require('../controllers/reporteOficinaController');
const reporteSemaforo = require('../controllers/reporteSemaforoController');
const estadisticas = require('../controllers/estadisticasController');

const router = express.Router();

router.use(authAdmin);

router.get('/catalogos/:tipo', asyncHandler(adminCatalogo.listar));
router.post('/catalogos/:tipo', asyncHandler(adminCatalogo.crear));
router.put('/catalogos/:tipo/:id', asyncHandler(adminCatalogo.actualizar));
router.delete('/catalogos/:tipo/:id', asyncHandler(adminCatalogo.eliminar));

router.get('/correos', asyncHandler(adminCatalogo.listarCorreos));
router.post('/correos', asyncHandler(adminCatalogo.crearCorreo));
router.put('/correos/:id', asyncHandler(adminCatalogo.actualizarCorreo));
router.delete('/correos/:id', asyncHandler(adminCatalogo.eliminarCorreo));

// Asignaciones Estación ↔ Crucero
router.get('/estaciones-cruceros', asyncHandler(adminCatalogo.listarEstacionesConCruceros));
router.post('/estaciones/:id/cruceros', asyncHandler(adminCatalogo.asignarCrucero));
router.delete('/estaciones/:estacionId/cruceros/:cruceroId', asyncHandler(adminCatalogo.desasignarCrucero));

router.get('/usuarios', asyncHandler(usuario.listar));
router.post('/usuarios', asyncHandler(usuario.crear));
router.put('/usuarios/:id', asyncHandler(usuario.actualizar));
router.delete('/usuarios/:id', asyncHandler(usuario.eliminar));

router.get('/reportes/oficina/resumen', asyncHandler(reporteOficina.resumen));
router.get('/reportes/oficina/export', asyncHandler(reporteOficina.exportar));
router.get('/reportes/oficina', asyncHandler(reporteOficina.listar));
router.get('/reportes/oficina/:id', asyncHandler(reporteOficina.obtener));
router.patch('/reportes/oficina/:id/estado', asyncHandler(reporteOficina.cambiarEstado));
router.delete('/reportes/oficina/:id', asyncHandler(reporteOficina.eliminar));
router.post('/reportes/oficina/:id/equipos', asyncHandler(reporteOficina.asignarEquipo));
router.delete('/reportes/oficina/:id/equipos/:piezaId', asyncHandler(reporteOficina.desasignarEquipo));

router.get('/reportes/semaforo/resumen', asyncHandler(reporteSemaforo.resumen));
router.get('/reportes/semaforo/export', asyncHandler(reporteSemaforo.exportar));
router.get('/reportes/semaforo', asyncHandler(reporteSemaforo.listar));
router.get('/reportes/semaforo/:id', asyncHandler(reporteSemaforo.obtener));
router.patch('/reportes/semaforo/:id/estado', asyncHandler(reporteSemaforo.cambiarEstado));
router.delete('/reportes/semaforo/:id', asyncHandler(reporteSemaforo.eliminar));
router.post('/reportes/semaforo/:id/piezas', asyncHandler(reporteSemaforo.asignarPieza));
router.delete('/reportes/semaforo/:id/piezas/:piezaId', asyncHandler(reporteSemaforo.desasignarPieza));

router.get('/estadisticas', asyncHandler(estadisticas.listar));

module.exports = router;
