const { z } = require('zod');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

const modelos = {
  areas: { model: () => prisma.area, nombre: 'Área' },
  subdirecciones: { model: () => prisma.subdireccion, nombre: 'Subdirección' },
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

// ── Asignaciones Estación ↔ Crucero ──

async function listarEstacionesConCruceros(req, res) {
  const estaciones = await prisma.estacion.findMany({
    orderBy: { id: 'asc' },
    include: {
      cruceros: {
        include: { crucero: true }
      }
    }
  });
  ok(res, estaciones);
}

async function asignarCrucero(req, res) {
  const estacionId = Number(req.params.id);
  const { cruceroId } = req.body;
  if (!cruceroId) return fail(res, 'cruceroId es requerido');

  // Verificar que no exista ya
  const existente = await prisma.estacionCrucero.findUnique({
    where: { estacionId_cruceroId: { estacionId, cruceroId: Number(cruceroId) } }
  });
  if (existente) return fail(res, 'Este crucero ya está asignado a esta estación');

  const asignacion = await prisma.estacionCrucero.create({
    data: { estacionId, cruceroId: Number(cruceroId) },
    include: { crucero: true, estacion: true }
  });
  ok(res, asignacion, 201);
}

async function desasignarCrucero(req, res) {
  const estacionId = Number(req.params.estacionId);
  const cruceroId = Number(req.params.cruceroId);

  await prisma.estacionCrucero.delete({
    where: { estacionId_cruceroId: { estacionId, cruceroId } }
  });
  ok(res, { message: 'Asignación eliminada' });
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
  listarEstacionesConCruceros,
  asignarCrucero,
  desasignarCrucero,
};
