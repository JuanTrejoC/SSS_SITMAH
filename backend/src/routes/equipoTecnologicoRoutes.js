const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoTecnologicoController');
const authAdmin = require('../middleware/authAdmin');

// Proteger todas las rutas
router.use(authAdmin);

// Rutas CRUD
router.get('/', equipoController.obtenerEquipos);
router.post('/', equipoController.crearEquipo);
router.put('/:id', equipoController.actualizarEquipo);
router.delete('/:id', equipoController.eliminarEquipo);

module.exports = router;
