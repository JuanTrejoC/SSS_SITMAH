const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const upload = require('../middleware/upload');
const { reporteLimiter } = require('../middleware/rateLimit');
const reporteOficina = require('../controllers/reporteOficinaController');
const reporteSemaforo = require('../controllers/reporteSemaforoController');

const router = express.Router();

router.post(
  '/oficina',
  reporteLimiter,
  upload.single('evidencia'),
  asyncHandler(reporteOficina.crear)
);

router.post(
  '/semaforo',
  reporteLimiter,
  upload.single('evidencia'),
  asyncHandler(reporteSemaforo.crear)
);

module.exports = router;
