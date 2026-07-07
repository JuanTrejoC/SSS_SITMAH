const { z } = require('zod');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');
const { generarFolio } = require('../services/folioService');
const { registrarHistorial, obtenerHistorial } = require('../services/historialService');
const {
  enviarConfirmacionReporte,
  enviarNotificacionAdmins,
} = require('../services/mailService');
const {
  buildReporteFilters,
  applyKeywordOficina,
  parsePagination,
} = require('../utils/filters');
const { exportarReportesOficina } = require('../services/excelService');

const crearSchema = z.object({
  solicitante: z.string().min(1),
  area_id: z.coerce.number().int().positive(),
  cargo: z.string().optional(),
  email: z.string().email(),
  telefono: z.string().optional(),
  sede_id: z.coerce.number().int().positive(),
  equipo: z.string().optional(),
  categoria_id: z.coerce.number().int().positive(),
  prioridad: z.enum(['baja', 'media', 'alta']),
  descripcion: z.string().optional(),
});

const estadoSchema = z.object({
  estado: z.enum(['abierto', 'en_proceso', 'resuelto']),
  comentario: z.string().optional(),
});

const includeDetalle = {
  area: true,
  sede: true,
  categoria: true,
  atendidoPor: { select: { id: true, nombre: true, username: true } },
  evidencias: true,
};

async function crear(req, res) {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const data = parsed.data;
  const folio = await generarFolio('oficina');

  let cargoId = null;
  if (data.cargo) {
    let cargoObj = await prisma.cargo.findFirst({
      where: { nombre: data.cargo }
    });
    if (!cargoObj) {
      cargoObj = await prisma.cargo.create({
        data: { nombre: data.cargo }
      });
    }
    cargoId = cargoObj.id;
  }

  const reporte = await prisma.reporteOficina.create({
    data: {
      folio,
      solicitante: data.solicitante,
      areaId: data.area_id,
      cargoId: cargoId,
      email: data.email,
      telefono: data.telefono,
      sedeId: data.sede_id,
      equipo: data.equipo,
      categoriaId: data.categoria_id,
      prioridad: data.prioridad,
      descripcion: data.descripcion,
    },
  });

  if (req.file) {
    await prisma.evidencia.create({
      data: {
        reporteOficinaId: reporte.id,
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

  const categoria = await prisma.categoria.findUnique({
    where: { id: data.categoria_id },
    select: { nombre: true }
  });
  const categoriaNombre = categoria ? categoria.nombre : 'General';

  // Enviar correos en segundo plano para no demorar la respuesta del servidor
  Promise.all([
    enviarConfirmacionReporte({ email: data.email, folio, tipo: 'oficina' }),
    enviarNotificacionAdmins({
      folio,
      fecha: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
      tipo: 'oficina',
      prioridad: data.prioridad,
      falla: categoriaNombre,
      descripcion: data.descripcion,
      solicitante: data.solicitante,
      correos: correosAdmin.map((c) => c.correo),
    })
  ]).catch((err) => {
    console.error('Error al enviar correos en segundo plano:', err.message);
  });

  ok(res, reporte, 201);
}

async function resumen(req, res) {
  const [total, abiertos, enProceso, resueltos] = await Promise.all([
    prisma.reporteOficina.count(),
    prisma.reporteOficina.count({ where: { estado: 'abierto' } }),
    prisma.reporteOficina.count({ where: { estado: 'en_proceso' } }),
    prisma.reporteOficina.count({ where: { estado: 'resuelto' } }),
  ]);

  ok(res, { total, abiertos, en_proceso: enProceso, resueltos });
}

async function listar(req, res) {
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = applyKeywordOficina(where, keyword);
  const { page, limit, skip } = parsePagination(req.query);

  const ordenParam = req.query.orden === 'asc' ? 'asc' : 'desc';

  const [items, total] = await Promise.all([
    prisma.reporteOficina.findMany({
      where: whereFinal,
      include: {
        area: true,
        sede: true,
        categoria: true,
        evidencias: true,
      },
      orderBy: { id: ordenParam },
      skip,
      take: limit,
    }),
    prisma.reporteOficina.count({ where: whereFinal }),
  ]);

  ok(res, { items, total, page, limit });
}

async function obtener(req, res) {
  const id = Number(req.params.id);
  const reporte = await prisma.reporteOficina.findUnique({
    where: { id },
    include: includeDetalle,
  });

  if (!reporte) return fail(res, 'Reporte no encontrado', 404);

  const historial = await obtenerHistorial('oficina', id);
  ok(res, { ...reporte, historial });
}

async function cambiarEstado(req, res) {
  const id = Number(req.params.id);
  const parsed = estadoSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const actual = await prisma.reporteOficina.findUnique({ where: { id } });
  if (!actual) return fail(res, 'Reporte no encontrado', 404);

  const { estado, comentario } = parsed.data;
  const data = {
    estado,
    atendidoPorId: req.usuario.id,
  };

  if (estado === 'resuelto') {
    data.fechaResolucion = new Date();
  }

  const reporte = await prisma.reporteOficina.update({ where: { id }, data });

  if (actual.estado !== estado) {
    await registrarHistorial({
      usuarioId: req.usuario.id,
      tipoReporte: 'oficina',
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
  await prisma.reporteOficina.delete({ where: { id } });
  ok(res, { message: 'Reporte eliminado' });
}

async function exportar(req, res) {
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = applyKeywordOficina(where, keyword);
  const incluirImagenes = req.query.incluirImagenes === 'true';
  const ordenParam = req.query.orden === 'asc' ? 'asc' : 'desc';

  const reportes = await prisma.reporteOficina.findMany({
    where: whereFinal,
    include: { area: true, sede: true, categoria: true, evidencias: true },
    orderBy: { id: ordenParam },
  });

  const buffer = await exportarReportesOficina(reportes, incluirImagenes);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=reportes-oficina.xlsx');
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
