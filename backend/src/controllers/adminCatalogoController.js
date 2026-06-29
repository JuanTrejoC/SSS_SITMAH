const { z } = require('zod');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

const modelos = {
  areas: { model: () => prisma.area, nombre: 'Área' },
  sedes: { model: () => prisma.sede, nombre: 'Sede' },
  categorias: { model: () => prisma.categoria, nombre: 'Categoría' },
  cargos: { model: () => prisma.cargo, nombre: 'Cargo' },
  estaciones: { model: () => prisma.estacion, nombre: 'Estación' },
  cruceros: { model: () => prisma.crucero, nombre: 'Crucero' },
  'tipos-falla': { model: () => prisma.tipoFalla, nombre: 'Tipo de falla' },
};

const correoSchema = z.object({
  nombre: z.string().min(1),
  correo: z.string().email(),
  activo: z.boolean().optional(),
});

const itemSchema = z.object({
  nombre: z.string().min(1).max(150),
  activo: z.boolean().optional(),
});

function getModel(tipo) {
  const config = modelos[tipo];
  if (!config) return null;
  return config;
}

async function listar(req, res) {
  const config = getModel(req.params.tipo);
  if (!config) return fail(res, 'Catálogo no encontrado', 404);

  const items = await config.model().findMany({ orderBy: { id: 'asc' } });
  ok(res, items);
}

async function crear(req, res) {
  const config = getModel(req.params.tipo);
  if (!config) return fail(res, 'Catálogo no encontrado', 404);

  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const item = await config.model().create({ data: parsed.data });
  ok(res, item, 201);
}

async function actualizar(req, res) {
  const config = getModel(req.params.tipo);
  if (!config) return fail(res, 'Catálogo no encontrado', 404);

  const id = Number(req.params.id);
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const item = await config.model().update({ where: { id }, data: parsed.data });
  ok(res, item);
}

async function eliminar(req, res) {
  const config = getModel(req.params.tipo);
  if (!config) return fail(res, 'Catálogo no encontrado', 404);

  const id = Number(req.params.id);
  const item = await config.model().update({ where: { id }, data: { activo: false } });
  ok(res, item);
}

async function listarCorreos(req, res) {
  const items = await prisma.correoNotificacion.findMany({ orderBy: { id: 'asc' } });
  ok(res, items);
}

async function crearCorreo(req, res) {
  const parsed = correoSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const item = await prisma.correoNotificacion.create({ data: parsed.data });
  ok(res, item, 201);
}

async function actualizarCorreo(req, res) {
  const id = Number(req.params.id);
  const parsed = correoSchema.partial().safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const item = await prisma.correoNotificacion.update({ where: { id }, data: parsed.data });
  ok(res, item);
}

async function eliminarCorreo(req, res) {
  const id = Number(req.params.id);
  const item = await prisma.correoNotificacion.update({ where: { id }, data: { activo: false } });
  ok(res, item);
}

module.exports = {
  listar,
  crear,
  actualizar,
  eliminar,
  listarCorreos,
  crearCorreo,
  actualizarCorreo,
  eliminarCorreo,
};
