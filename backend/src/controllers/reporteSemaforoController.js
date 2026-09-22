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
  origen: z.string().optional().nullable(),
  estacion_id: z.coerce.number().int().positive().optional().nullable(),
  crucero_id: z.coerce.number().int().positive(),
  tipo_falla_id: z.coerce.number().int().positive(),
  hora_dano: z.string().min(1),
  descripcion: z.string().max(250).optional().nullable(),
});

const estadoSchema = z.object({
  estado: z.enum(['abierto', 'en_proceso', 'resuelto']),
  comentario: z.string().optional(),
  tecnico_atendio: z.string().optional().nullable(),
  firma_satisfaccion: z.string().optional().nullable(),
  diagnostico_solucion: z.string().optional().nullable(),
  fecha_resolucion: z.string().optional().nullable(),
});

const includeDetalle = {
  estacion: true,
  crucero: true,
  tipoFalla: true,
  atendidoPor: { select: { id: true, nombre: true, username: true } },
  evidencias: true,
  piezasAsignadas: {
    include: {
      componente: true,
    },
  },
};

async function crear(req, res) {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const data = parsed.data;
  const folio = await generarFolio('semaforo');

  let resolvedEstacionId = data.estacion_id || null;
  if (!resolvedEstacionId && data.crucero_id) {
    const ec = await prisma.estacionCrucero.findFirst({
      where: { cruceroId: data.crucero_id },
    });
    if (ec) resolvedEstacionId = ec.estacionId;
  }

  const reporte = await prisma.reporteSemaforo.create({
    data: {
      folio,
      jefeTurno: data.jefe_turno,
      origen: data.origen || null,
      estacionId: resolvedEstacionId,
      cruceroId: data.crucero_id,
      tipoFallaId: data.tipo_falla_id,
      horaDano: new Date(data.hora_dano),
      descripcion: data.descripcion || null,
      prioridad: 'alta',
    },
  });

  const files = req.files
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : (req.file ? [req.file] : []);

  for (const file of files) {
    await prisma.evidencia.create({
      data: {
        reporteSemaforoId: reporte.id,
        filename: file.originalname,
        filepath: file.filename,
        mimetype: file.mimetype,
        sizeBytes: file.size,
        tipo: 'inicial',
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

  const [porCrucero, porFalla] = await Promise.all([
    prisma.reporteSemaforo.groupBy({
      by: ['cruceroId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.reporteSemaforo.groupBy({
      by: ['tipoFallaId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  ok(res, {
    total,
    abiertos,
    enProceso,
    resueltos,
    topCruceros: porCrucero,
    topFallas: porFalla,
  });
}

async function listar(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = applyKeywordSemaforo(where, keyword);
  const ordenParam = req.query.orden === 'asc' ? 'asc' : 'desc';

  const [total, reportes] = await Promise.all([
    prisma.reporteSemaforo.count({ where: whereFinal }),
    prisma.reporteSemaforo.findMany({
      where: whereFinal,
      include: includeDetalle,
      skip,
      take: limit,
      orderBy: { id: ordenParam },
    }),
  ]);

  ok(res, {
    items: reportes,
    reportes,
    total,
    page,
    limit,
    paginacion: {
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    },
  });
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

  const actual = await prisma.reporteSemaforo.findUnique({
    where: { id },
    include: { evidencias: true }
  });
  if (!actual) return fail(res, 'Reporte no encontrado', 404);

  const { estado, comentario, tecnico_atendio, firma_satisfaccion, diagnostico_solucion, fecha_resolucion } = parsed.data;

  const files = req.files
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : (req.file ? [req.file] : []);

  // Si se intenta cerrar como resuelto, verificar que exista al menos una evidencia fotográfica
  if (estado === 'resuelto') {
    const tieneEvidenciaPrevia = actual.evidencias && actual.evidencias.length > 0;
    const tieneNuevaEvidencia = files.length > 0;
    if (!tieneEvidenciaPrevia && !tieneNuevaEvidencia) {
      return fail(res, 'Para cerrar el reporte es obligatorio adjuntar al menos una evidencia fotográfica', 400);
    }
  }

  // Si se subieron nuevos archivos de evidencia al resolver
  for (const file of files) {
    await prisma.evidencia.create({
      data: {
        reporteSemaforoId: id,
        filename: file.originalname,
        filepath: file.filename,
        mimetype: file.mimetype,
        sizeBytes: file.size,
        tipo: 'solucion',
      },
    });
  }

  const data = {
    estado,
    atendidoPorId: req.usuario.id,
  };

  if (tecnico_atendio !== undefined) data.tecnicoAtendio = tecnico_atendio;
  if (firma_satisfaccion !== undefined) data.firmaSatisfaccion = firma_satisfaccion;
  if (diagnostico_solucion !== undefined) data.diagnosticoSolucion = diagnostico_solucion;
  if (estado === 'resuelto') {
    data.fechaResolucion = fecha_resolucion ? new Date(fecha_resolucion) : new Date();
  }

  const reporte = await prisma.reporteSemaforo.update({
    where: { id },
    data,
    include: includeDetalle
  });

  if (actual.estado !== estado) {
    await registrarHistorial({
      usuarioId: req.usuario.id,
      tipoReporte: 'semaforo',
      reporteId: id,
      estadoAnterior: actual.estado,
      estadoNuevo: estado,
      comentario: comentario || diagnostico_solucion || 'Estado actualizado',
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
  const incluirImagenes = req.query.incluirImagenes === 'true';
  const ordenParam = req.query.orden === 'asc' ? 'asc' : 'desc';

  const reportes = await prisma.reporteSemaforo.findMany({
    where: whereFinal,
    include: { estacion: true, crucero: true, tipoFalla: true, evidencias: true },
    orderBy: { id: ordenParam },
  });

  const buffer = await exportarReportesSemaforo(reportes, incluirImagenes);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=reportes-semaforo.xlsx');
  res.send(buffer);
}

const asignarPiezaSchema = z.object({
  componente_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive(),
});

async function asignarPieza(req, res) {
  const reporteId = Number(req.params.id);
  const parsed = asignarPiezaSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const { componente_id, cantidad } = parsed.data;

  // Verify report exists
  const reporte = await prisma.reporteSemaforo.findUnique({ where: { id: reporteId } });
  if (!reporte) return fail(res, 'Reporte no encontrado', 404);

  // Verify component stock
  const componente = await prisma.existenciaComponente.findUnique({ where: { id: componente_id } });
  if (!componente) return fail(res, 'Componente no encontrado', 404);

  if (componente.cantidad < cantidad) {
    return fail(res, `Stock insuficiente. Disponible: ${componente.cantidad}, Solicitado: ${cantidad}`);
  }

  // Transaction to deduct stock and assign piece
  const result = await prisma.$transaction(async (tx) => {
    // Decrement stock
    await tx.existenciaComponente.update({
      where: { id: componente_id },
      data: {
        cantidad: { decrement: cantidad }
      }
    });

    // Create assignment
    return tx.reporteSemaforoPieza.create({
      data: {
        reporteSemaforoId: reporteId,
        componenteId: componente_id,
        cantidad,
      },
      include: {
        componente: true
      }
    });
  });

  ok(res, result, 210); // Custom code or just 201
}

async function desasignarPieza(req, res) {
  const piezaId = Number(req.params.piezaId);

  const asignacion = await prisma.reporteSemaforoPieza.findUnique({
    where: { id: piezaId }
  });
  if (!asignacion) return fail(res, 'Asignación no encontrada', 404);

  // Transaction to restore stock and delete assignment
  await prisma.$transaction(async (tx) => {
    // Restore stock
    await tx.existenciaComponente.update({
      where: { id: asignacion.componenteId },
      data: {
        cantidad: { increment: asignacion.cantidad }
      }
    });

    // Delete assignment
    await tx.reporteSemaforoPieza.delete({
      where: { id: piezaId }
    });
  });

  ok(res, { message: 'Pieza desasignada y stock restaurado' });
}

module.exports = {
  crear,
  resumen,
  listar,
  obtener,
  cambiarEstado,
  eliminar,
  exportar,
  asignarPieza,
  desasignarPieza,
};
