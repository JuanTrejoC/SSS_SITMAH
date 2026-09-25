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
const { exportarReportesInfraestructura } = require('../services/excelService');

const crearSchema = z.object({
  solicitante: z.string().min(1),
  area_id: z.coerce.number().int().positive(),
  cargo: z.string().optional(),
  email: z.string().email(),
  telefono: z.string().optional(),
  sede_id: z.coerce.number().int().positive(),
  equipo: z.string().optional(),
  numero_serie: z.string().optional(),
  categoria_id: z.coerce.number().int().positive().optional(),
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

const filtroSoloInfra = {
  OR: [
    { folio: { startsWith: 'RI' } },
    { categoria: { nombre: { contains: 'Infraestructura' } } }
  ]
};

async function obtenerCategoriaInfraId(categoriaIdPropuesto) {
  if (categoriaIdPropuesto) {
    const catExiste = await prisma.categoria.findUnique({ where: { id: Number(categoriaIdPropuesto) } });
    if (catExiste) return catExiste.id;
  }
  let catInfra = await prisma.categoria.findFirst({
    where: { nombre: { contains: 'Infraestructura' } }
  });
  if (!catInfra) {
    catInfra = await prisma.categoria.create({
      data: { nombre: 'Infraestructura' }
    });
  }
  return catInfra.id;
}

async function crear(req, res) {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const data = parsed.data;
  const folio = await generarFolio('infraestructura');
  const categoriaId = await obtenerCategoriaInfraId(data.categoria_id);

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
      equipo: data.equipo || 'Infraestructura General',
      numeroSerie: data.numero_serie,
      categoriaId: categoriaId,
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
    where: { id: categoriaId },
    select: { nombre: true },
  });
  const categoriaNombre = categoria ? categoria.nombre : 'Infraestructura';

  const datosReporteCorreo = {
    folio,
    fecha: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    tipo: 'infraestructura',
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
    prisma.reporteOficina.count({ where: filtroSoloInfra }),
    prisma.reporteOficina.count({ where: { ...filtroSoloInfra, estado: 'abierto' } }),
    prisma.reporteOficina.count({ where: { ...filtroSoloInfra, estado: 'en_proceso' } }),
    prisma.reporteOficina.count({ where: { ...filtroSoloInfra, estado: 'resuelto' } }),
  ]);

  ok(res, { total, abiertos, enProceso, resueltos });
}

async function listar(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = {
    ...applyKeywordOficina(where, keyword),
    ...filtroSoloInfra
  };
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
  const reporte = await prisma.reporteOficina.findFirst({
    where: { id, ...filtroSoloInfra },
    include: includeDetalle,
  });
  if (!reporte) return fail(res, 'Reporte de infraestructura no encontrado', 404);

  const historial = await obtenerHistorial('oficina', id);
  ok(res, { ...reporte, historial });
}

async function cambiarEstado(req, res) {
  const id = Number(req.params.id);
  const parsed = estadoSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const actual = await prisma.reporteOficina.findFirst({
    where: { id, ...filtroSoloInfra },
    include: { evidencias: true },
  });
  if (!actual) return fail(res, 'Reporte de infraestructura no encontrado', 404);

  const { estado, comentario, tecnico_atendio, firma_satisfaccion, diagnostico_solucion, fecha_resolucion } = parsed.data;

  const files = req.files
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : (req.file ? [req.file] : []);

  if (estado === 'resuelto') {
    const tieneEvidenciaPrevia = actual.evidencias && actual.evidencias.length > 0;
    const tieneNuevaEvidencia = files.length > 0;
    if (!tieneEvidenciaPrevia && !tieneNuevaEvidencia) {
      return fail(res, 'Para cerrar el reporte es obligatorio adjuntar al menos una evidencia fotográfica', 400);
    }
  }

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
  const reporte = await prisma.reporteOficina.findFirst({
    where: { id, ...filtroSoloInfra }
  });
  if (!reporte) return fail(res, 'Reporte de infraestructura no encontrado', 404);

  await prisma.reporteOficina.delete({ where: { id } });
  ok(res, { message: 'Reporte eliminado' });
}

async function exportar(req, res) {
  const { keyword, where } = buildReporteFilters(req.query);
  const whereFinal = {
    ...applyKeywordOficina(where, keyword),
    ...filtroSoloInfra
  };
  const incluirImagenes = req.query.incluirImagenes === 'true';
  const ordenParam = req.query.orden === 'asc' ? 'asc' : 'desc';

  const reportes = await prisma.reporteOficina.findMany({
    where: whereFinal,
    include: { area: true, sede: true, categoria: true, cargo: true, atendidoPor: true, evidencias: true },
    orderBy: { id: ordenParam },
  });

  const buffer = await exportarReportesInfraestructura(reportes, incluirImagenes);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=reportes-infraestructura.xlsx');
  res.send(buffer);
}

const asignarPiezaSchema = z.object({
  componente_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive().max(1, 'Solo se puede asignar 1 pieza por solicitud').optional().default(1),
  estado_pieza_reemplazada: z.enum(['reparacion', 'danada']).optional().default('reparacion'),
});

const actualizarEstadoPiezaSchema = z.object({
  estado_pieza_reemplazada: z.enum(['reparacion', 'danada']),
});

async function asignarPieza(req, res) {
  const reporteId = Number(req.params.id);
  const parsed = asignarPiezaSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const { componente_id, estado_pieza_reemplazada } = parsed.data;
  const cantidad = 1;

  const reporte = await prisma.reporteOficina.findFirst({
    where: { id: reporteId, ...filtroSoloInfra }
  });
  if (!reporte) return fail(res, 'Reporte no encontrado', 404);

  const yaAsignada = await prisma.reporteOficinaPieza.findFirst({
    where: {
      reporteOficinaId: reporteId,
      componenteId: componente_id
    }
  });
  if (yaAsignada) {
    return fail(res, 'Esta pieza o componente ya fue asignado a este reporte.', 400);
  }

  const componente = await prisma.existenciaComponente.findUnique({ where: { id: componente_id } });
  if (!componente) return fail(res, 'Componente no encontrado', 404);

  if (componente.cantidad < cantidad) {
    return fail(res, `Stock insuficiente. Disponible: ${componente.cantidad}, Solicitado: ${cantidad}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.existenciaComponente.update({
      where: { id: componente_id },
      data: { cantidad: { decrement: cantidad } }
    });

    const estadoFisicoVieja = estado_pieza_reemplazada === 'danada' ? 'Dañado' : 'Por Reparar';

    const piezaViejaExistencia = await tx.existenciaComponente.create({
      data: {
        nombre: `${componente.nombre} (Pieza Reemplazada)`,
        categoria: componente.categoria || 'herramienta',
        cantidad: 1,
        estadoFisico: estadoFisicoVieja,
        marca: componente.marca || null,
        modelo: componente.modelo || null,
        numeroInventario: componente.numeroInventario ? `${componente.numeroInventario}-RET` : null,
        tipoInventario: 'infraestructura',
      }
    });

    return tx.reporteOficinaPieza.create({
      data: {
        reporteOficinaId: reporteId,
        componenteId: componente_id,
        cantidad,
        estadoPiezaReemplazada: estado_pieza_reemplazada || 'reparacion',
        piezaReemplazadaExistenciaId: piezaViejaExistencia.id,
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

  await prisma.$transaction(async (tx) => {
    await tx.existenciaComponente.update({
      where: { id: asignacion.componenteId },
      data: { cantidad: { increment: asignacion.cantidad } }
    });

    if (asignacion.piezaReemplazadaExistenciaId) {
      await tx.existenciaComponente.deleteMany({
        where: { id: asignacion.piezaReemplazadaExistenciaId }
      });
    }

    await tx.reporteOficinaPieza.delete({
      where: { id: piezaId }
    });
  });

  ok(res, { message: 'Pieza desasignada y stock restaurado' });
}

async function actualizarEstadoPiezaReemplazada(req, res) {
  const piezaId = Number(req.params.piezaId);
  const parsed = actualizarEstadoPiezaSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const asignacion = await prisma.reporteOficinaPieza.findUnique({
    where: { id: piezaId }
  });
  if (!asignacion) return fail(res, 'Asignación no encontrada', 404);

  const estadoFisicoNuevo = parsed.data.estado_pieza_reemplazada === 'danada' ? 'Dañado' : 'Por Reparar';

  const actualizada = await prisma.reporteOficinaPieza.update({
    where: { id: piezaId },
    data: {
      estadoPiezaReemplazada: parsed.data.estado_pieza_reemplazada
    },
    include: {
      componente: true
    }
  });

  if (asignacion.piezaReemplazadaExistenciaId) {
    await prisma.existenciaComponente.updateMany({
      where: { id: asignacion.piezaReemplazadaExistenciaId },
      data: { estadoFisico: estadoFisicoNuevo }
    });
  }

  ok(res, actualizada);
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
  actualizarEstadoPiezaReemplazada,
};
