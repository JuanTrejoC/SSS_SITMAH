const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authAdmin = require('../middleware/authAdmin');
const authAdminOrInfra = require('../middleware/authAdminOrInfra');
const adminCatalogo = require('../controllers/adminCatalogoController');
const usuario = require('../controllers/usuarioController');
const reporteOficina = require('../controllers/reporteOficinaController');
const reporteInfraestructura = require('../controllers/reporteInfraestructuraController');
const reporteSemaforo = require('../controllers/reporteSemaforoController');
const estadisticas = require('../controllers/estadisticasController');
const notificacion = require('../controllers/notificacionController');
const busqueda = require('../controllers/busquedaController');

const router = express.Router();
const upload = require('../middleware/upload');

// =========================================================================
// RUTAS ACCESIBLES POR ADMIN E INFRAESTRUCTURA (authAdminOrInfra)
// =========================================================================

// Búsqueda global (Spotlight)
router.get('/busqueda-global', authAdminOrInfra, asyncHandler(busqueda.buscar));

// Notificaciones
router.get('/notificaciones', authAdminOrInfra, asyncHandler(notificacion.obtenerNotificaciones));

// Reportes de Infraestructura
router.get('/reportes/infraestructura/resumen', authAdminOrInfra, asyncHandler(reporteInfraestructura.resumen));
router.get('/reportes/infraestructura/export', authAdminOrInfra, asyncHandler(reporteInfraestructura.exportar));
router.get('/reportes/infraestructura', authAdminOrInfra, asyncHandler(reporteInfraestructura.listar));
router.get('/reportes/infraestructura/:id', authAdminOrInfra, asyncHandler(reporteInfraestructura.obtener));
router.patch('/reportes/infraestructura/:id/estado', authAdminOrInfra, upload.array('evidencia', 10), asyncHandler(reporteInfraestructura.cambiarEstado));
router.delete('/reportes/infraestructura/:id', authAdminOrInfra, asyncHandler(reporteInfraestructura.eliminar));
router.post('/reportes/infraestructura/:id/piezas', authAdminOrInfra, asyncHandler(reporteInfraestructura.asignarPieza));
router.patch('/reportes/infraestructura/:id/piezas/:piezaId/estado-reemplazo', authAdminOrInfra, asyncHandler(reporteInfraestructura.actualizarEstadoPiezaReemplazada));
router.delete('/reportes/infraestructura/:id/piezas/:piezaId', authAdminOrInfra, asyncHandler(reporteInfraestructura.desasignarPieza));

// =========================================================================
// RUTAS EXCLUSIVAS DE ADMINISTRADOR GENERAL (authAdmin)
// =========================================================================
router.use(authAdmin);

// Catálogos
router.get('/catalogos/:tipo', asyncHandler(adminCatalogo.listar));
router.post('/catalogos/:tipo', asyncHandler(adminCatalogo.crear));
router.put('/catalogos/:tipo/:id', asyncHandler(adminCatalogo.actualizar));
router.delete('/catalogos/:tipo/:id', asyncHandler(adminCatalogo.eliminar));

// Correos de notificación
router.get('/correos', asyncHandler(adminCatalogo.listarCorreos));
router.post('/correos', asyncHandler(adminCatalogo.crearCorreo));
router.put('/correos/:id', asyncHandler(adminCatalogo.actualizarCorreo));
router.delete('/correos/:id', asyncHandler(adminCatalogo.eliminarCorreo));

// Asignaciones Estación ↔ Crucero
router.get('/estaciones-cruceros', asyncHandler(adminCatalogo.listarEstacionesConCruceros));
router.post('/estaciones/:id/cruceros', asyncHandler(adminCatalogo.asignarCrucero));
router.delete('/estaciones/:estacionId/cruceros/:cruceroId', asyncHandler(adminCatalogo.desasignarCrucero));

// Gestión de Usuarios
router.get('/usuarios', asyncHandler(usuario.listar));
router.post('/usuarios', asyncHandler(usuario.crear));
router.put('/usuarios/:id', asyncHandler(usuario.actualizar));
router.delete('/usuarios/:id', asyncHandler(usuario.eliminar));

// Reportes de Oficina
router.get('/reportes/oficina/resumen', asyncHandler(reporteOficina.resumen));
router.get('/reportes/oficina/export', asyncHandler(reporteOficina.exportar));
router.get('/reportes/oficina', asyncHandler(reporteOficina.listar));
router.get('/reportes/oficina/:id', asyncHandler(reporteOficina.obtener));
router.patch('/reportes/oficina/:id/estado', upload.array('evidencia', 10), asyncHandler(reporteOficina.cambiarEstado));
router.patch('/reportes/oficina/:id/modificar-resuelto', upload.array('evidencia', 10), asyncHandler(reporteOficina.modificarResuelto));
router.delete('/reportes/oficina/:id', asyncHandler(reporteOficina.eliminar));
router.post('/reportes/oficina/:id/piezas', asyncHandler(reporteOficina.asignarPieza));
router.patch('/reportes/oficina/:id/piezas/:piezaId/estado-reemplazo', asyncHandler(reporteOficina.actualizarEstadoPiezaReemplazada));
router.delete('/reportes/oficina/:id/piezas/:piezaId', asyncHandler(reporteOficina.desasignarPieza));

// Reportes de Semáforos
router.get('/reportes/semaforo/resumen', asyncHandler(reporteSemaforo.resumen));
router.get('/reportes/semaforo/export', asyncHandler(reporteSemaforo.exportar));
router.get('/reportes/semaforo', asyncHandler(reporteSemaforo.listar));
router.get('/reportes/semaforo/:id', asyncHandler(reporteSemaforo.obtener));
router.patch('/reportes/semaforo/:id/estado', upload.array('evidencia', 10), asyncHandler(reporteSemaforo.cambiarEstado));
router.patch('/reportes/semaforo/:id/modificar-resuelto', upload.array('evidencia', 10), asyncHandler(reporteSemaforo.modificarResuelto));
router.delete('/reportes/semaforo/:id', asyncHandler(reporteSemaforo.eliminar));
router.post('/reportes/semaforo/:id/piezas', asyncHandler(reporteSemaforo.asignarPieza));
router.patch('/reportes/semaforo/:id/piezas/:piezaId/estado-reemplazo', asyncHandler(reporteSemaforo.actualizarEstadoPiezaReemplazada));
router.delete('/reportes/semaforo/:id/piezas/:piezaId', asyncHandler(reporteSemaforo.desasignarPieza));

// Estadísticas
router.get('/estadisticas', asyncHandler(estadisticas.listar));

module.exports = router;
