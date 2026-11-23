const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  const token = (header && header.startsWith('Bearer ')) ? header.split(' ')[1] : req.query.token;

  if (!token) {
    return fail(res, 'Token no proporcionado', 401);
  }

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

module.exports = authAdmin;
