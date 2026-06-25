const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message);
  }

  const { username, password } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { username } });
  if (!usuario) {
    return fail(res, 'Usuario o contraseña incorrectos', 401);
  }

  const valido = await bcrypt.compare(password, usuario.passwordHash);
  if (!valido) {
    return fail(res, 'Usuario o contraseña incorrectos', 401);
  }

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  ok(res, {
    token,
    usuario: {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  });
}

module.exports = { login };
