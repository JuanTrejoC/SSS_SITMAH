const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function authAdminOrInfra(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 'Token no proporcionado', 401);
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== 'admin' && decoded.rol !== 'administrador' && decoded.rol !== 'infraestructura') {
        return fail(res, 'No autorizado para esta acción', 403);
    }
    req.usuario = decoded;
    next();
  } catch {
    return fail(res, 'Token inválido o expirado', 401);
  }
}

module.exports = authAdminOrInfra;
