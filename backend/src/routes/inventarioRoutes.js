const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authAdmin = require('../middleware/authAdmin');
const authAdminOrInfra = require('../middleware/authAdminOrInfra');
const inventario = require('../controllers/inventarioController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `programacion-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Technological Equipment Routes (Herramientas & Tecnologico)
router.get('/tecnologico', authAdminOrInfra, asyncHandler(inventario.listarEquipoTecnologico));
router.post('/tecnologico', authAdminOrInfra, asyncHandler(inventario.crearEquipoTecnologico));
router.get('/tecnologico/export', authAdminOrInfra, asyncHandler(inventario.exportarEquipoTecnologicoExcel));
router.get('/tecnologico/:id', authAdminOrInfra, asyncHandler(inventario.obtenerEquipoTecnologico));
router.put('/tecnologico/:id', authAdminOrInfra, asyncHandler(inventario.actualizarEquipoTecnologico));
router.delete('/tecnologico/:id', authAdminOrInfra, asyncHandler(inventario.eliminarEquipoTecnologico));

// Apply authAdmin middleware to all remaining inventory routes
router.use(authAdmin);

// Traffic Light Controllers Routes
router.get('/controladores', asyncHandler(inventario.listarControladoresSemaforo));
router.post('/controladores', upload.single('archivoProgramacion'), asyncHandler(inventario.crearControladorSemaforo));
router.get('/controladores/:id', asyncHandler(inventario.obtenerControladorSemaforo));
router.get('/controladores/:id/descargar-programacion', asyncHandler(inventario.descargarProgramacion));
router.put('/controladores/:id', upload.single('archivoProgramacion'), asyncHandler(inventario.actualizarControladorSemaforo));
router.delete('/controladores/:id', asyncHandler(inventario.eliminarControladorSemaforo));

// Existencias / Stock Routes
router.get('/existencias', asyncHandler(inventario.listarExistencias));
router.post('/existencias', asyncHandler(inventario.ingresarExistencia));
router.get('/existencias/:id/historial', asyncHandler(inventario.obtenerHistorialExistencia));
router.put('/existencias/:id', asyncHandler(inventario.actualizarExistencia));
router.get('/existencias/export', asyncHandler(inventario.exportarExistenciasExcel));

// Mobiliario Routes
router.get('/mobiliario', asyncHandler(inventario.listarMobiliario));
router.post('/mobiliario', asyncHandler(inventario.crearMobiliario));
router.get('/mobiliario/export', asyncHandler(inventario.exportarMobiliarioExcel));
router.get('/mobiliario/:id', asyncHandler(inventario.obtenerMobiliario));
router.put('/mobiliario/:id', asyncHandler(inventario.actualizarMobiliario));
router.delete('/mobiliario/:id', asyncHandler(inventario.eliminarMobiliario));

module.exports = router;
