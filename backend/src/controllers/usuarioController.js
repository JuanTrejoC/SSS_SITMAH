const { z } = require('zod');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

const usuarioSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  nombre: z.string().min(1).max(100),
});

function sinPassword(usuario) {
  const { passwordHash, ...resto } = usuario;
  return resto;
}

async function listar(req, res) {
  const usuarios = await prisma.usuario.findMany({ orderBy: { id: 'asc' } });
  ok(res, usuarios.map(sinPassword));
}

async function crear(req, res) {
  const parsed = usuarioSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const { username, email, password, nombre } = parsed.data;
  if (!password) return fail(res, 'La contraseña es requerida al crear usuario');

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.usuario.create({
    data: { username, email, passwordHash, nombre, rol: 'admin' },
  });

  ok(res, sinPassword(usuario), 201);
}

async function actualizar(req, res) {
  const id = Number(req.params.id);
  const parsed = usuarioSchema.partial().safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const data = { ...parsed.data };
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  const usuario = await prisma.usuario.update({ where: { id }, data });
  ok(res, sinPassword(usuario));
}

async function eliminar(req, res) {
  const id = Number(req.params.id);
  const total = await prisma.usuario.count();
  if (total <= 1) return fail(res, 'No se puede eliminar el último administrador', 400);

  await prisma.usuario.delete({ where: { id } });
  ok(res, { message: 'Usuario eliminado' });
}

module.exports = { listar, crear, actualizar, eliminar };
