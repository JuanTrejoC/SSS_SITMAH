const { z } = require('zod');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');
const { parsePagination } = require('../utils/filters');
const { exportarInventarioExistencias } = require('../services/excelService');

// Schema validation for technological equipment
const equipoTecnologicoSchema = z.object({
  tipo: z.string().min(1),
  numeroInventario: z.string().nullable().optional(),
  numeroSerie: z.string().nullable().optional(),
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  responsable: z.string().nullable().optional(),
  cargoResponsable: z.string().nullable().optional(),
  areaUbicacion: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  procedencia: z.string().nullable().optional(),
  estatus: z.string().nullable().optional(),
  detalles: z.any().optional(),
});

// Schema validation for traffic light controller
const controladorSemaforoSchema = z.object({
  modelo: z.string().min(1),
  cruceroId: z.coerce.number().int().positive(),
  semaforos3Luces: z.coerce.number().int().nonnegative().default(0),
  semaforos4Luces: z.coerce.number().int().nonnegative().default(0),
  totalLedsVerdes: z.coerce.number().int().nonnegative().default(0),
  totalLedsRojos: z.coerce.number().int().nonnegative().default(0),
  totalLedsAmarillos: z.coerce.number().int().nonnegative().default(0),
  pasoPeatonal: z.boolean().default(false),
  audible: z.boolean().default(false),
  pantallaLed: z.boolean().default(false),
  tarjetaRelevadora: z.boolean().default(false),
  fuentePoder: z.boolean().default(false),
  cpu: z.boolean().default(false),
  switch: z.boolean().default(false),
  fibraOptica: z.boolean().default(false),
  gps: z.boolean().default(false),
  botonera: z.boolean().default(false),
});

// Schema for adding stock existencias
const ingresoExistenciaSchema = z.object({
  nombre: z.string().min(1),
  categoria: z.string().min(1),
  cantidad: z.coerce.number().int().positive(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  numeroInventario: z.string().optional(),
  tipoInventario: z.string().optional(),
});

// Schema for updating stock directly
const ajusteExistenciaSchema = z.object({
  nombre: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
  cantidad: z.coerce.number().int().nonnegative().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  numeroInventario: z.string().optional(),
  tipoInventario: z.string().optional(),
});

// ==========================================
// 1. CONTROLADORES DE EQUIPO TECNOLÓGICO
// ==========================================

async function listarEquipoTecnologico(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { tipo, area, search } = req.query;

  const where = {};
  if (req.usuario && req.usuario.rol === 'infraestructura') {
    where.tipo = 'herramienta_infra';
  } else {
    if (tipo === 'herramientas') {
      where.tipo = { in: ['herramienta_tec', 'herramienta_infra'] };
    } else if (tipo === 'tecnologico') {
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra'] };
    } else if (tipo) {
      where.tipo = tipo;
    } else {
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra'] };
    }
  }
  if (area) where.areaUbicacion = { contains: area };

  if (search) {
    where.OR = [
      { tipo: { contains: search } },
      { numeroInventario: { contains: search } },
      { numeroSerie: { contains: search } },
      { marca: { contains: search } },
      { modelo: { contains: search } },
      { responsable: { contains: search } },
      { cargoResponsable: { contains: search } },
      { areaUbicacion: { contains: search } },
      { direccion: { contains: search } },
      { procedencia: { contains: search } },
      { estatus: { contains: search } },
    ];
  }

  require('fs').writeFileSync('where_debug.json', JSON.stringify({ query: req.query, where }, null, 2));

  const [items, total] = await Promise.all([
    prisma.equipoTecnologico.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
    }),
    prisma.equipoTecnologico.count({ where }),
  ]);

  ok(res, { items, total, page, limit });
}

async function crearEquipoTecnologico(req, res) {
  const parsed = equipoTecnologicoSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const data = parsed.data;
  if (req.usuario && req.usuario.rol === 'infraestructura' && data.tipo !== 'herramienta_infra') {
    return fail(res, 'No autorizado para crear este tipo de equipo', 403);
  }

  // Validate unique inventory number if provided
  if (data.numeroInventario) {
    const existe = await prisma.equipoTecnologico.findUnique({
      where: { numeroInventario: data.numeroInventario },
    });
    if (existe) {
      return fail(res, `El número de inventario '${data.numeroInventario}' ya existe`);
    }
  }

  const equipo = await prisma.equipoTecnologico.create({
    data: {
      tipo: data.tipo,
      numeroInventario: data.numeroInventario || null,
      numeroSerie: data.numeroSerie || null,
      marca: data.marca || null,
      modelo: data.modelo || null,
      responsable: data.responsable || null,
      cargoResponsable: data.cargoResponsable || null,
      areaUbicacion: data.areaUbicacion || null,
      procedencia: data.procedencia || null,
      estatus: data.estatus || 'Activo',
      detalles: data.detalles || {},
    },
  });

  ok(res, equipo, 201);
}

async function obtenerEquipoTecnologico(req, res) {
  const id = Number(req.params.id);
  const equipo = await prisma.equipoTecnologico.findUnique({ where: { id } });
  if (!equipo) return fail(res, 'Equipo tecnológico no encontrado', 404);
  if (req.usuario && req.usuario.rol === 'infraestructura' && equipo.tipo !== 'herramienta_infra') {
    return fail(res, 'No autorizado para ver este equipo', 403);
  }
  ok(res, equipo);
}

async function actualizarEquipoTecnologico(req, res) {
  const id = Number(req.params.id);
  const parsed = equipoTecnologicoSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const data = parsed.data;

  const actual = await prisma.equipoTecnologico.findUnique({ where: { id } });
  if (!actual) return fail(res, 'Equipo tecnológico no encontrado', 404);
  if (req.usuario && req.usuario.rol === 'infraestructura' && (actual.tipo !== 'herramienta_infra' || data.tipo !== 'herramienta_infra')) {
    return fail(res, 'No autorizado para modificar este equipo', 403);
  }

  // Validate unique inventory number if it changed
  if (data.numeroInventario && data.numeroInventario !== actual.numeroInventario) {
    const existe = await prisma.equipoTecnologico.findUnique({
      where: { numeroInventario: data.numeroInventario },
    });
    if (existe) {
      return fail(res, `El número de inventario '${data.numeroInventario}' ya está asignado a otro equipo`);
    }
  }

  const equipo = await prisma.equipoTecnologico.update({
    where: { id },
    data: {
      tipo: data.tipo,
      numeroInventario: data.numeroInventario || null,
      numeroSerie: data.numeroSerie || null,
      marca: data.marca || null,
      modelo: data.modelo || null,
      responsable: data.responsable || null,
      cargoResponsable: data.cargoResponsable || null,
      areaUbicacion: data.areaUbicacion || null,
      procedencia: data.procedencia || null,
      estatus: data.estatus || 'Activo',
      detalles: data.detalles || {},
    },
  });

  ok(res, equipo);
}

async function eliminarEquipoTecnologico(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.equipoTecnologico.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Equipo tecnológico no encontrado', 404);
  if (req.usuario && req.usuario.rol === 'infraestructura' && existe.tipo !== 'herramienta_infra') {
    return fail(res, 'No autorizado para eliminar este equipo', 403);
  }

  await prisma.equipoTecnologico.delete({ where: { id } });
  ok(res, { message: 'Equipo tecnológico eliminado correctamente' });
}

// ==========================================
// 2. CONTROLADORES SEMAFÓRICOS INSTALADOS
// ==========================================

async function listarControladoresSemaforo(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { search } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { modelo: { contains: search } },
      { crucero: { nombre: { contains: search } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.controladorSemaforo.findMany({
      where,
      include: {
        crucero: true,
      },
      skip,
      take: limit,
      orderBy: { id: 'desc' },
    }),
    prisma.controladorSemaforo.count({ where }),
  ]);

  ok(res, { items, total, page, limit });
}

async function crearControladorSemaforo(req, res) {
  const body = { ...req.body };
  // Convert boolean strings to actual booleans (from FormData)
  const booleanFields = ['pasoPeatonal', 'audible', 'pantallaLed', 'tarjetaRelevadora', 'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera'];
  booleanFields.forEach(key => {
    if (body[key] === 'true') body[key] = true;
    if (body[key] === 'false') body[key] = false;
  });

  const parsed = controladorSemaforoSchema.safeParse(body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const dataToSave = { ...parsed.data };
  if (req.file) {
    // Relative path to be stored in the database
    dataToSave.archivoProgramacion = `uploads/${req.file.filename}`;
  }

  const controlador = await prisma.controladorSemaforo.create({
    data: dataToSave,
  });

  ok(res, controlador, 201);
}

async function obtenerControladorSemaforo(req, res) {
  const id = Number(req.params.id);
  const controlador = await prisma.controladorSemaforo.findUnique({
    where: { id },
    include: { crucero: true }
  });
  if (!controlador) return fail(res, 'Controlador semafórico no encontrado', 404);
  ok(res, controlador);
}

async function actualizarControladorSemaforo(req, res) {
  const id = Number(req.params.id);
  
  const body = { ...req.body };
  // Convert boolean strings to actual booleans (from FormData)
  const booleanFields = ['pasoPeatonal', 'audible', 'pantallaLed', 'tarjetaRelevadora', 'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera'];
  booleanFields.forEach(key => {
    if (body[key] === 'true') body[key] = true;
    if (body[key] === 'false') body[key] = false;
  });

  const parsed = controladorSemaforoSchema.safeParse(body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  const dataToUpdate = { ...parsed.data };
  if (req.file) {
    dataToUpdate.archivoProgramacion = `uploads/${req.file.filename}`;
  } else if (body.removerArchivo === 'true') {
    dataToUpdate.archivoProgramacion = null;
  }

  const controlador = await prisma.controladorSemaforo.update({
    where: { id },
    data: dataToUpdate,
  });

  ok(res, controlador);
}

async function eliminarControladorSemaforo(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  await prisma.controladorSemaforo.delete({ where: { id } });
  ok(res, { message: 'Controlador semafórico eliminado correctamente' });
}

async function descargarProgramacion(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe || !existe.archivoProgramacion) {
    return fail(res, 'Archivo no encontrado', 404);
  }

  const path = require('path');
  const filePath = path.resolve(__dirname, '../../', existe.archivoProgramacion);
  res.download(filePath, existe.archivoProgramacion.split('/').pop(), (err) => {
    if (err) {
      console.error('Error enviando archivo:', err);
      res.status(500).send('Error al descargar el archivo.');
    }
  });
}

// ==========================================
// 3. EXISTENCIAS / STOCK DE REFACCIONES
// ==========================================

async function listarExistencias(req, res) {
  const { categoria, tipoInventario } = req.query;
  const where = {};
  if (categoria) where.categoria = categoria;
  if (tipoInventario) where.tipoInventario = tipoInventario;

  const existencias = await prisma.existenciaComponente.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });

  ok(res, existencias);
}

async function ingresarExistencia(req, res) {
  const parsed = ingresoExistenciaSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const { nombre, categoria, cantidad, marca, modelo, numeroSerie, numeroInventario, tipoInventario } = parsed.data;

  const componente = await prisma.existenciaComponente.create({
    data: {
      nombre,
      categoria,
      cantidad,
      marca: marca || null,
      modelo: modelo || null,
      numeroSerie: numeroSerie || null,
      numeroInventario: numeroInventario || null,
      tipoInventario: tipoInventario || 'semaforos',
    },
  });

  ok(res, componente);
}

async function actualizarExistencia(req, res) {
  const id = Number(req.params.id);
  const parsed = ajusteExistenciaSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0].message);

  const existe = await prisma.existenciaComponente.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Componente no encontrado', 404);

  const componente = await prisma.existenciaComponente.update({
    where: { id },
    data: parsed.data,
  });

  ok(res, componente);
}

async function eliminarExistencia(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.existenciaComponente.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Componente no encontrado', 404);

  // Verify it is not linked to any report assignments
  const asignado = await prisma.reporteSemaforoPieza.findFirst({
    where: { componenteId: id }
  });
  if (asignado) {
    return fail(res, 'No se puede eliminar porque este componente ya fue asignado a reportes de semáforos.');
  }

  await prisma.existenciaComponente.delete({ where: { id } });
  ok(res, { message: 'Componente eliminado correctamente' });
}

async function obtenerHistorialExistencia(req, res) {
  const id = Number(req.params.id);

  const componente = await prisma.existenciaComponente.findUnique({ where: { id } });
  if (!componente) return fail(res, 'Componente no encontrado', 404);

  const historial = await prisma.reporteSemaforoPieza.findMany({
    where: { componenteId: id },
    include: {
      reporteSemaforo: {
        include: {
          estacion: true,
          crucero: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const historialMapeado = historial.map(h => ({
    id: h.id,
    cantidad: h.cantidad,
    fecha: h.createdAt,
    reporte: {
      id: h.reporteSemaforo.id,
      folio: h.reporteSemaforo.folio,
      estacion: h.reporteSemaforo.estacion?.nombre,
      crucero: h.reporteSemaforo.crucero?.nombre
    }
  }));

  ok(res, historialMapeado);
}

async function exportarExistenciasExcel(req, res) {
  const { categoria, tipoInventario, search, mes, includeImages, order } = req.query;
  const where = {};
  if (categoria) where.categoria = categoria;
  if (tipoInventario) where.tipoInventario = tipoInventario;
  if (search) {
    where.OR = [
      { nombre: { contains: search } },
      { marca: { contains: search } },
      { modelo: { contains: search } },
      { numeroSerie: { contains: search } },
      { numeroInventario: { contains: search } },
    ];
  }
  // Filter by month (format YYYY-MM)
  if (mes) {
    const [year, month] = mes.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.createdAt = { gte: start, lt: end };
  }

  const existencias = await prisma.existenciaComponente.findMany({
    where,
    orderBy: { id: order === 'desc' ? 'desc' : 'asc' },
  });

  // Note: existencias won't have tipo and areaUbicacion mapped properly in excelService but keeping it functional
  const buffer = await exportarInventarioExistencias(existencias, includeImages === 'true');

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="inventario_existencias.xlsx"');
  res.send(buffer);
}

async function exportarEquipoTecnologicoExcel(req, res) {
  const { tipo, search, area, mes, includeImages, order } = req.query;
  const where = {};
  
  if (req.usuario && req.usuario.rol === 'infraestructura') {
    where.tipo = 'herramienta_infra';
  } else {
    if (tipo === 'herramientas') {
      where.tipo = { in: ['herramienta_tec', 'herramienta_infra'] };
    } else if (tipo === 'tecnologico') {
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra'] };
    } else if (tipo) {
      where.tipo = tipo;
    } else {
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra'] };
    }
  }
  if (area) where.areaUbicacion = { contains: area };

  if (search) {
    where.OR = [
      { numeroInventario: { contains: search } },
      { numeroSerie: { contains: search } },
      { marca: { contains: search } },
      { modelo: { contains: search } },
      { responsable: { contains: search } },
      { areaUbicacion: { contains: search } },
      { direccion: { contains: search } },
    ];
  }
  
  if (mes) {
    const [year, month] = mes.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.createdAt = { gte: start, lt: end };
  }

  const equipos = await prisma.equipoTecnologico.findMany({
    where,
    orderBy: { id: order === 'desc' ? 'desc' : 'asc' },
  });

  const buffer = await exportarInventarioExistencias(equipos, includeImages === 'true');

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="inventario_herramientas.xlsx"');
  res.send(buffer);
}

module.exports = {
  listarEquipoTecnologico,
  crearEquipoTecnologico,
  obtenerEquipoTecnologico,
  actualizarEquipoTecnologico,
  eliminarEquipoTecnologico,

  listarControladoresSemaforo,
  crearControladorSemaforo,
  obtenerControladorSemaforo,
  actualizarControladorSemaforo,
  eliminarControladorSemaforo,
  descargarProgramacion,

  listarExistencias,
  ingresarExistencia,
  actualizarExistencia,
  eliminarExistencia,
  obtenerHistorialExistencia,
  exportarExistenciasExcel,
  exportarEquipoTecnologicoExcel,
};
