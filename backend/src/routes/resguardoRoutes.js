const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const controller = require('../controllers/resguardoController');
const authAdmin = require('../middleware/authAdmin');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const { fail } = require('../utils/response');

// Permite ver la imagen firmada con <img src="...?token=xxx"> (solo administradores)
function authAdminFlexible(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : req.query.token;
  if (!token) return fail(res, 'Token no proporcionado', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== 'admin' && decoded.rol !== 'administrador') {
      return fail(res, 'No autorizado para esta acción (se requieren permisos de administrador)', 403);
    }
    req.usuario = decoded;
    next();
  } catch {
    return fail(res, 'Token inválido o expirado', 401);
  }
}

router.get('/:id/firmado', authAdminFlexible, asyncHandler(controller.obtenerFirmado));

router.use(authAdmin);

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}.pdf`);
  },
});

const uploadPdf = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten documentos en formato PDF (.pdf)'));
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.post('/:id/firmado', uploadPdf.single('archivo'), controller.subirFirmado);
router.delete('/:id/firmado', controller.eliminarFirmado);

module.exports = router;
