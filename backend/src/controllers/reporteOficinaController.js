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
  numero_serie: z.string().optional(),
  categoria_id: z.coerce.number().int().positive(),
  prioridad: z.enum(['baja', 'media', 'alta']),
  descripcion: z.string().optional(),
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
  area: true,
  sede: true,
  categoria: true,
  cargo: true,
  atendidoPor: { select: { id: true, nombre: true, username: true } },
  evidencias: true,
  piezasAsignadas: { include: { componente: true } },
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
      numeroSerie: data.numero_serie,
      categoriaId: data.categoria_id,
      prioridad: data.prioridad,
      descripcion: data.descripcion,
    },
  });

  const files = req.files
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : (req.file ? [req.file] : []);

  for (const file of files) {
    await prisma.evidencia.create({
      data: {
        reporteOficinaId: reporte.id,
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

  const categoria = await prisma.categoria.findUnique({
    where: { id: data.categoria_id },
    select: { nombre: true },
  });
  const categoriaNombre = categoria ? categoria.nombre : 'General';

  const datosReporteCorreo = {
    folio,
    fecha: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    tipo: 'oficina',
    solicitante: data.solicitante,
    email: data.email,
    categoria: categoriaNombre,
    prioridad: data.prioridad,
    descripcion: data.descripcion,
    correos: correosAdmin.map((c) => c.correo),
  };

  enviarConfirmacionReporte(datosReporteCorreo).catch((err) => {
    console.error('Error al enviar correo al solicitante en segundo plano:', err.message);
  });
  enviarNotificacionAdmins(datosReporteCorreo).catch((err) => {
    console.error('Error al enviar correos admin en segundo plano:', err.message);
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

  ok(res, { total, abiertos, enProceso, resueltos });
}

async function listar(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = applyKeywordOficina(where, keyword);
  const ordenParam = req.query.orden === 'asc' ? 'asc' : 'desc';

  const [total, reportes] = await Promise.all([
    prisma.reporteOficina.count({ where: whereFinal }),
    prisma.reporteOficina.findMany({
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

  const actual = await prisma.reporteOficina.findUnique({
    where: { id },
    include: { evidencias: true },
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
        reporteOficinaId: id,
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

  const reporte = await prisma.reporteOficina.update({
    where: { id },
    data,
    include: includeDetalle,
  });

  if (actual.estado !== estado) {
    await registrarHistorial({
      usuarioId: req.usuario.id,
      tipoReporte: 'oficina',
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

const asignarPiezaSchema = z.object({
  componente_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive(),
});

async function asignarPieza(req, res) {
  const reporteId = Number(req.params.id);
  const parsed = asignarPiezaSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const { componente_id, cantidad } = parsed.data;

  // Verificar que el reporte existe
  const reporte = await prisma.reporteOficina.findUnique({ where: { id: reporteId } });
  if (!reporte) return fail(res, 'Reporte no encontrado', 404);

  // Verificar que el componente existe y tiene stock
  const componente = await prisma.existenciaComponente.findUnique({ where: { id: componente_id } });
  if (!componente) return fail(res, 'Componente no encontrado', 404);

  if (componente.cantidad < cantidad) {
    return fail(res, `Stock insuficiente. Disponible: ${componente.cantidad}, Solicitado: ${cantidad}`);
  }

  // Transacción para descontar stock y asignar pieza
  const result = await prisma.$transaction(async (tx) => {
    // Descontar stock
    await tx.existenciaComponente.update({
      where: { id: componente_id },
      data: { cantidad: { decrement: cantidad } }
    });

    // Crear asignación
    return tx.reporteOficinaPieza.create({
      data: {
        reporteOficinaId: reporteId,
        componenteId: componente_id,
        cantidad,
      },
      include: {
        componente: true
      }
    });
  });

  ok(res, result, 201);
}

async function desasignarPieza(req, res) {
  const piezaId = Number(req.params.piezaId);

  const asignacion = await prisma.reporteOficinaPieza.findUnique({
    where: { id: piezaId }
  });
  if (!asignacion) return fail(res, 'Asignación no encontrada', 404);

  // Transacción para restaurar stock y eliminar asignación
  await prisma.$transaction(async (tx) => {
    // Restaurar stock
    await tx.existenciaComponente.update({
      where: { id: asignacion.componenteId },
      data: { cantidad: { increment: asignacion.cantidad } }
    });

    // Eliminar asignación
    await tx.reporteOficinaPieza.delete({
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
