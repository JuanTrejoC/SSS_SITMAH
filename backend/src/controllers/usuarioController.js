const { z } = require('zod');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

const usuarioSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(50),
  email: z.string().email('El formato del correo electrónico no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  rol: z.enum(['admin', 'infraestructura', 'administrador']).optional(),
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
  if (!parsed.success) {
    const errorMsg = parsed.error.issues?.[0]?.message || 'Datos de usuario inválidos';
    return fail(res, errorMsg, 400);
  }

  const { username, email, password, nombre, rol } = parsed.data;
  if (!password || password.length < 8) {
    return fail(res, 'La contraseña es obligatoria y debe tener al menos 8 caracteres', 400);
  }

  // Verificar si el correo o username ya existen
  const emailNormalizado = email.trim().toLowerCase();
  const usernameNormalizado = username.trim();

  const existeEmail = await prisma.usuario.findFirst({
    where: { email: { equals: emailNormalizado, mode: 'insensitive' } }
  });
  if (existeEmail) {
    return fail(res, 'El correo electrónico ya se encuentra registrado por otro usuario', 400);
  }

  const existeUsername = await prisma.usuario.findFirst({
    where: { username: { equals: usernameNormalizado, mode: 'insensitive' } }
  });
  if (existeUsername) {
    return fail(res, 'El nombre de usuario (login) ya está en uso', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const rolAsignado = rol === 'administrador' ? 'admin' : (rol || 'admin');

  try {
    const usuario = await prisma.usuario.create({
      data: {
        username: usernameNormalizado,
        email: emailNormalizado,
        passwordHash,
        nombre: nombre.trim(),
        rol: rolAsignado
      },
    });

    ok(res, sinPassword(usuario), 201);
  } catch (err) {
    if (err.code === 'P2002') {
      const target = err.meta?.target || [];
      if (target.includes('email') || String(err).includes('email')) {
        return fail(res, 'El correo electrónico ya se encuentra registrado', 400);
      }
      if (target.includes('username') || String(err).includes('username')) {
        return fail(res, 'El nombre de usuario (login) ya está en uso', 400);
      }
      return fail(res, 'El usuario o correo electrónico ya se encuentra registrado', 400);
    }
    throw err;
  }
}

async function actualizar(req, res) {
  const id = Number(req.params.id);
  const parsed = usuarioSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues?.[0]?.message || 'Datos de usuario inválidos';
    return fail(res, errorMsg, 400);
  }

  const data = { ...parsed.data };
  if (data.password !== undefined && data.password !== '') {
    if (data.password.length < 8) {
      return fail(res, 'La nueva contraseña debe tener al menos 8 caracteres', 400);
    }
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  } else {
    delete data.password;
  }

  if (data.email) {
    data.email = data.email.trim().toLowerCase();
    const existeEmail = await prisma.usuario.findFirst({
      where: {
        email: { equals: data.email, mode: 'insensitive' },
        NOT: { id }
      }
    });
    if (existeEmail) {
      return fail(res, 'El correo electrónico ya se encuentra registrado por otro usuario', 400);
    }
  }

  if (data.username) {
    data.username = data.username.trim();
    const existeUsername = await prisma.usuario.findFirst({
      where: {
        username: { equals: data.username, mode: 'insensitive' },
        NOT: { id }
      }
    });
    if (existeUsername) {
      return fail(res, 'El nombre de usuario (login) ya está en uso', 400);
    }
  }

  if (data.rol) {
    data.rol = data.rol === 'administrador' ? 'admin' : data.rol;
  }

  try {
    const usuario = await prisma.usuario.update({ where: { id }, data });
    ok(res, sinPassword(usuario));
  } catch (err) {
    if (err.code === 'P2002') {
      return fail(res, 'El usuario o correo ya se encuentra registrado por otro usuario', 400);
    }
    throw err;
  }
}

async function eliminar(req, res) {
  const id = Number(req.params.id);
  const total = await prisma.usuario.count();
  if (total <= 1) return fail(res, 'No se puede eliminar el último administrador', 400);

  await prisma.usuario.delete({ where: { id } });
  ok(res, { message: 'Usuario eliminado' });
}

module.exports = { listar, crear, actualizar, eliminar };
