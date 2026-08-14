const express = require('express');
const router = express.Router();
const controller = require('../controllers/resguardoController');
const authAdmin = require('../middleware/authAdmin');

router.use(authAdmin);

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);

module.exports = router;
