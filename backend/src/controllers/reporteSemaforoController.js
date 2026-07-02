const { z } = require('zod');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');
const { generarFolio } = require('../services/folioService');
const { registrarHistorial, obtenerHistorial } = require('../services/historialService');
const { enviarNotificacionAdmins } = require('../services/mailService');
const {
  buildReporteFilters,
  applyKeywordSemaforo,
  parsePagination,
} = require('../utils/filters');
const { exportarReportesSemaforo } = require('../services/excelService');

const crearSchema = z.object({
  jefe_turno: z.string().min(1),
  estacion_id: z.coerce.number().int().positive(),
  crucero_id: z.coerce.number().int().positive(),
  tipo_falla_id: z.coerce.number().int().positive(),
  hora_dano: z.string().min(1),
  descripcion: z.string().optional(),
});

const estadoSchema = z.object({
  estado: z.enum(['abierto', 'en_proceso', 'resuelto']),
  comentario: z.string().optional(),
});

const includeDetalle = {
  estacion: true,
  crucero: true,
  tipoFalla: true,
  atendidoPor: { select: { id: true, nombre: true, username: true } },
  evidencias: true,
};

async function crear(req, res) {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const data = parsed.data;
  const folio = await generarFolio('semaforo');

  const reporte = await prisma.reporteSemaforo.create({
    data: {
      folio,
      jefeTurno: data.jefe_turno,
      estacionId: data.estacion_id,
      cruceroId: data.crucero_id,
      tipoFallaId: data.tipo_falla_id,
      horaDano: new Date(data.hora_dano),
      descripcion: data.descripcion,
      prioridad: 'alta',
    },
  });

  if (req.file) {
    await prisma.evidencia.create({
      data: {
        reporteSemaforoId: reporte.id,
        filename: req.file.originalname,
        filepath: req.file.filename,
        mimetype: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });
  }

  const correosAdmin = await prisma.correoNotificacion.findMany({
    where: { activo: true },
    select: { correo: true },
  });

  const tipoFalla = await prisma.tipoFalla.findUnique({
    where: { id: data.tipo_falla_id },
    select: { nombre: true }
  });
  const fallaNombre = tipoFalla ? tipoFalla.nombre : 'Falla en semáforo';

  // Enviar correos en segundo plano para no demorar la respuesta del servidor
  enviarNotificacionAdmins({
    folio,
    fecha: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    tipo: 'semaforo',
    prioridad: 'alta',
    falla: fallaNombre,
    descripcion: data.descripcion,
    solicitante: data.jefe_turno,
    correos: correosAdmin.map((c) => c.correo),
  }).catch((err) => {
    console.error('Error al enviar correos en segundo plano:', err.message);
  });

  ok(res, reporte, 201);
}

async function resumen(req, res) {
  const [total, abiertos, enProceso, resueltos] = await Promise.all([
    prisma.reporteSemaforo.count(),
    prisma.reporteSemaforo.count({ where: { estado: 'abierto' } }),
    prisma.reporteSemaforo.count({ where: { estado: 'en_proceso' } }),
    prisma.reporteSemaforo.count({ where: { estado: 'resuelto' } }),
  ]);

  ok(res, { total, abiertos, en_proceso: enProceso, resueltos });
}

async function listar(req, res) {
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = applyKeywordSemaforo(where, keyword);
  const { page, limit, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    prisma.reporteSemaforo.findMany({
      where: whereFinal,
      include: {
        estacion: true,
        crucero: true,
        tipoFalla: true,
        evidencias: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.reporteSemaforo.count({ where: whereFinal }),
  ]);

  ok(res, { items, total, page, limit });
}

async function obtener(req, res) {
  const id = Number(req.params.id);
  const reporte = await prisma.reporteSemaforo.findUnique({
    where: { id },
    include: includeDetalle,
  });

  if (!reporte) return fail(res, 'Reporte no encontrado', 404);

  const historial = await obtenerHistorial('semaforo', id);
  ok(res, { ...reporte, historial });
}

async function cambiarEstado(req, res) {
  const id = Number(req.params.id);
  const parsed = estadoSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const actual = await prisma.reporteSemaforo.findUnique({ where: { id } });
  if (!actual) return fail(res, 'Reporte no encontrado', 404);

  const { estado, comentario } = parsed.data;
  const data = {
    estado,
    atendidoPorId: req.usuario.id,
  };

  if (estado === 'resuelto') {
    data.fechaResolucion = new Date();
  }

  const reporte = await prisma.reporteSemaforo.update({ where: { id }, data });

  if (actual.estado !== estado) {
    await registrarHistorial({
      usuarioId: req.usuario.id,
      tipoReporte: 'semaforo',
      reporteId: id,
      estadoAnterior: actual.estado,
      estadoNuevo: estado,
      comentario,
    });
  }

  ok(res, reporte);
}

async function eliminar(req, res) {
  const id = Number(req.params.id);
  await prisma.reporteSemaforo.delete({ where: { id } });
  ok(res, { message: 'Reporte eliminado' });
}

async function exportar(req, res) {
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = applyKeywordSemaforo(where, keyword);

  const reportes = await prisma.reporteSemaforo.findMany({
    where: whereFinal,
    include: { estacion: true, crucero: true, tipoFalla: true, evidencias: true },
    orderBy: { createdAt: 'desc' },
  });

  const buffer = await exportarReportesSemaforo(reportes);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=reportes-semaforo.xlsx');
  res.send(buffer);
}

module.exports = {
  crear,
  resumen,
  listar,
  obtener,
  cambiarEstado,
  eliminar,
  exportar,
};
