const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');
const { obtener } = require('../controllers/evidenciaController');

const router = express.Router();

// Middleware flexible: acepta token por header Authorization O por query param ?token=
// Esto permite que <img src="...?token=xxx"> funcione en el navegador
function authEvidencia(req, res, next) {
  let token = null;

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) return fail(res, 'Token no proporcionado', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return fail(res, 'Token inválido o expirado', 401);
  }
}

router.get('/:id', authEvidencia, asyncHandler(obtener));

module.exports = router;
