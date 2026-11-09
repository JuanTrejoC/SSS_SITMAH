const { z } = require('zod');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');
const { parsePagination } = require('../utils/filters');
const { exportarInventarioExistencias, exportarInventarioMobiliario, exportarHerramientasExcel } = require('../services/excelService');

function construirCondicionesBusquedaEquipo(search) {
  if (!search || !search.trim()) return [];
  const raw = search.trim();
  const rawNorm = (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const conectores = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'con', 'para', 'y', 'o', 'un', 'una']);
  const palabras = rawNorm
    .replace(/[^a-z0-9\s\-_]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 0 && !conectores.has(p));

  const compacto = raw.replace(/\s+/g, '');
  const conEspacio = raw.replace(/(\d+)(gb|tb|mb|ghz|mhz)/gi, '$1 $2');

  const camposParaTermino = (term) => [
    { tipo: { contains: term } },
    { numeroInventario: { contains: term } },
    { numeroSerie: { contains: term } },
    { marca: { contains: term } },
    { modelo: { contains: term } },
    { responsable: { contains: term } },
    { cargoResponsable: { contains: term } },
    { areaUbicacion: { contains: term } },
    { direccion: { contains: term } },
    { procedencia: { contains: term } },
    { estatus: { contains: term } },
    { detalles: { path: '$.procesador', string_contains: term } },
    { detalles: { path: '$.ram', string_contains: term } },
    { detalles: { path: '$.almacenamiento', string_contains: term } },
    { detalles: { path: '$.tipoAlmacenamiento', string_contains: term } },
    { detalles: { path: '$.sistemaOperativo', string_contains: term } },
    { detalles: { path: '$.tarjetaGrafica', string_contains: term } },
    { detalles: { path: '$.red', string_contains: term } },
    { detalles: { path: '$.mac', string_contains: term } },
    { detalles: { path: '$.ipPredeterminada', string_contains: term } },
    { detalles: { path: '$.nombre', string_contains: term } },
    { detalles: { path: '$.especificarTipo', string_contains: term } },
    { detalles: { path: '$.marcaTeclado', string_contains: term } },
    { detalles: { path: '$.modeloTeclado', string_contains: term } },
    { detalles: { path: '$.marcaMouse', string_contains: term } },
    { detalles: { path: '$.modeloMouse', string_contains: term } },
    { detalles: { path: '$.marcaRegulador', string_contains: term } },
    { detalles: { path: '$.modeloRegulador', string_contains: term } },
    { detalles: { path: '$.megapixeles', string_contains: term } }
  ];

  if (palabras.length > 1) {
    const andGroup = palabras.map(p => ({ OR: camposParaTermino(p) }));
    const phraseConditions = [];
    if (raw) phraseConditions.push(...camposParaTermino(raw));
    if (rawNorm && rawNorm !== raw) phraseConditions.push(...camposParaTermino(rawNorm));
    if (compacto && compacto !== rawNorm && compacto !== raw) phraseConditions.push(...camposParaTermino(compacto));

    return [
      { AND: andGroup },
      ...phraseConditions
    ];
  }

  const terms = new Set([raw, rawNorm]);
  if (compacto) terms.add(compacto);
  if (conEspacio) terms.add(conEspacio);

  const orConditions = [];
  for (const term of terms) {
    orConditions.push(...camposParaTermino(term));
  }
  return orConditions;
}

// Schema validation for mobiliario
const mobiliarioSchema = z.object({
  numeroInventario: z.string().min(1, "El número de inventario es requerido"),
  bien: z.string().min(1, "El bien es requerido"),
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  numeroSerie: z.string().nullable().optional(),
  descripcion: z.string().min(1, "La descripción es requerida"),
  direccion: z.string().min(1, "La dirección es requerida"),
  subdireccion: z.string().nullable().optional().default(''),
  area: z.string().nullable().optional().default(''),
  cargo: z.string().nullable().optional().default(''),
  nombreResguardante: z.string().min(1, "El nombre del resguardante es requerido"),
});

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
  totalFlechasVerdes: z.coerce.number().int().nonnegative().default(0),
  totalFlechasRojas: z.coerce.number().int().nonnegative().default(0),
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
  // Inspección Exterior / Cimentación y Base
  cimientoCompleto: z.string().nullable().optional(),
  cimientoCuantosDados: z.string().nullable().optional(),
  tapaCableado: z.string().nullable().optional(),
  tornilleriaBaseCompleta: z.string().nullable().optional(),
  tornilleriaCuantosTornillos: z.string().nullable().optional(),
  observacionesExterior: z.string().nullable().optional(),
  // Electrónica Interna - Módulo GPS
  gpsModelo: z.string().nullable().optional(),
  gpsComponenteFisico: z.string().nullable().optional(),
  gpsAntenaExterior: z.string().nullable().optional(),
  // Configuración de CPU, Red y Gabinete
  numeroGabinete: z.string().nullable().optional(),
  versionFirmware: z.string().nullable().optional(),
  ipLocal: z.string().nullable().optional(),
  ipSystem: z.string().nullable().optional(),
  mascaraRed: z.string().nullable().optional(),
  gateway: z.string().nullable().optional(),
  cicloCompleto: z.string().nullable().optional(),
  respaldoProgramacionUsb: z.string().nullable().optional(),
  // Electrónica Interna - Conflictos y Relevadores
  tarjetaConflictosMarca: z.string().nullable().optional(),
  tarjetaConflictosModelo: z.string().nullable().optional(),
  tarjetaConflictosEstado: z.string().nullable().optional(),
  tarjetaRelevadoresMarca: z.string().nullable().optional(),
  tarjetaRelevadoresModelo: z.string().nullable().optional(),
  tarjetaRelevadoresCantidad: z.string().nullable().optional(),
  // Sección C: Red, Conectividad y Energía
  switchFibraMarca: z.string().nullable().optional(),
  switchFibraModelo: z.string().nullable().optional(),
  switchFibraPuertosTotal: z.string().nullable().optional(),
  switchFibraPuertosUso: z.string().nullable().optional(),
  switchFibraFuentePoder: z.string().nullable().optional(),
  receptorFibraDispositivo: z.string().nullable().optional(),
  receptorFibraCable: z.string().nullable().optional(),
  conexionesTarjetaMadre: z.string().nullable().optional(),
  fuentePoderSupresorPicos: z.string().nullable().optional(),
  // Sección D: Postes (SEMEX)
  posteModeloTipo: z.string().nullable().optional(),
  posteTapaRegistro: z.string().nullable().optional(),
  posteObservaciones: z.string().nullable().optional(),
  postesDetalle: z.any().optional(),
  // Cabezales Vehiculares
  tipoCabezal: z.string().nullable().optional(),
  cabezalModelo: z.string().nullable().optional(),
  pantallaPiezas: z.coerce.number().int().nonnegative().optional(),
  pantallaEstado: z.string().nullable().optional(),
  cabezalesDetalle: z.any().optional(),
  // Semáforos Peatonales
  peatonalModelo: z.string().nullable().optional(),
  peatonalModuloEstado: z.string().nullable().optional(),
  peatonalObservaciones: z.string().nullable().optional(),
  audibleModelo: z.string().nullable().optional(),
  audibleModuloEstado: z.string().nullable().optional(),
  audibleObservaciones: z.string().nullable().optional(),
  // Cámaras Videodetectoras
  camaraModelo: z.string().nullable().optional(),
  camaraCantidad: z.string().nullable().optional(),
  camaraObservaciones: z.string().nullable().optional(),
  // Registros de Piso
  registrosPisoTapas: z.string().nullable().optional(),
  registrosPisoDanados: z.coerce.number().int().nonnegative().optional(),
  registrosPisoCoordenadas: z.any().optional(),
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
    where.OR = construirCondicionesBusquedaEquipo(search);
  }

  const [items, total] = await Promise.all([
    prisma.equipoTecnologico.findMany({
      where,
      include: { componentes: true },
      skip,
      take: limit,
      orderBy: { id: 'desc' },
    }),
    prisma.equipoTecnologico.count({ where }),
  ]);

  ok(res, { items, total, page, limit });
}

async function procesarPerifericosDeDetalles(detalles, equipoPrincipalId, responsable, cargoResponsable, areaUbicacion, direccion, procedencia) {
  const fs = require('fs');
  const logFile = 'debug_perifericos.log';
  fs.appendFileSync(logFile, `\n\n[${new Date().toISOString()}] Procesando periféricos para PC ID: ${equipoPrincipalId}\n`);
  fs.appendFileSync(logFile, `Detalles originales: ${JSON.stringify(detalles)}\n`);

  if (!detalles || typeof detalles !== 'object') {
    fs.appendFileSync(logFile, `Detalles no es un objeto válido. Tipo: ${typeof detalles}\n`);
    return detalles;
  }

  const nuevosDetalles = { ...detalles };
  const perifericosAcrear = [];

  // 1. Procesar periféricos planos (Teclado, Mouse, Cargador, Diadema, Candado, Regulador, No break, Antena)
  const mapeoPlanos = [
    { tipo: 'Teclado', sufijo: 'Teclado' },
    { tipo: 'Mouse', sufijo: 'Mouse' },
    { tipo: 'Cargador', sufijo: 'Cargador' },
    { tipo: 'Diadema', sufijo: 'Diadema' },
    { tipo: 'Candado', sufijo: 'Candado' },
    { tipo: 'Regulador', sufijo: 'Regulador' },
    { tipo: 'No break', sufijo: 'Nobreak' },
    { tipo: 'Antena Wi-Fi', sufijo: 'Antena' }
  ];

  for (const p of mapeoPlanos) {
    const { tipo, sufijo } = p;
    const marca = detalles[`marca${sufijo}`];
    const modelo = detalles[`modelo${sufijo}`];
    const serie = detalles[`serie${sufijo}`];
    let inventario = detalles[`numeroInventario${sufijo}`] ? String(detalles[`numeroInventario${sufijo}`]) : null;

    if (marca || modelo || serie || inventario) {
      perifericosAcrear.push({ tipo, marca, modelo, serie, inventario });
      fs.appendFileSync(logFile, `Encontrado periférico plano: ${tipo} - ${marca} - ${inventario}\n`);
    }

    // Limpiar JSON
    delete nuevosDetalles[`marca${sufijo}`];
    delete nuevosDetalles[`modelo${sufijo}`];
    delete nuevosDetalles[`serie${sufijo}`];
    delete nuevosDetalles[`numeroInventario${sufijo}`];
    delete nuevosDetalles[`tiene${sufijo}`];
    delete nuevosDetalles[`cantidad${sufijo}`];
  }

  // 2. Procesar arreglos de periféricos (como monitores)
  if (Array.isArray(detalles.monitores)) {
    fs.appendFileSync(logFile, `Encontrado arreglo de monitores: ${detalles.monitores.length} monitores\n`);
    for (const monitor of detalles.monitores) {
      if (monitor.marca || monitor.modelo || monitor.serie || monitor.numeroInventario) {
        perifericosAcrear.push({
          tipo: 'Monitor',
          marca: monitor.marca,
          modelo: monitor.modelo,
          serie: monitor.serie,
          inventario: monitor.numeroInventario ? String(monitor.numeroInventario) : null
        });
      }
    }
    delete nuevosDetalles.monitores;
    delete nuevosDetalles.tieneMonitores;
    delete nuevosDetalles.cantidadMonitores;
    delete nuevosDetalles.marcaMonitores;
    delete nuevosDetalles.modeloMonitores;
    delete nuevosDetalles.serieMonitores;
    delete nuevosDetalles.numeroInventarioMonitores;
  }

  fs.appendFileSync(logFile, `Periféricos a crear (${perifericosAcrear.length}): ${JSON.stringify(perifericosAcrear)}\n`);

  // 3. Crear en BD
  for (const p of perifericosAcrear) {
    try {
      let finalInventario = p.inventario && p.inventario.trim() !== '' ? p.inventario.trim() : null;
      if (finalInventario) {
        let count = 0;
        let newInventario = finalInventario;
        while (true) {
          const existe = await prisma.equipoTecnologico.findUnique({
            where: { numeroInventario: newInventario }
          });
          if (!existe) break;
          count++;
          newInventario = `${finalInventario}-${count}`;
        }
        finalInventario = newInventario;
      }

      fs.appendFileSync(logFile, `Creando en BD: ${p.tipo} con inventario ${finalInventario}\n`);
      await prisma.equipoTecnologico.create({
        data: {
          tipo: p.tipo,
          marca: p.marca && p.marca.trim() !== '' ? String(p.marca) : null,
          modelo: p.modelo && p.modelo.trim() !== '' ? String(p.modelo) : null,
          numeroSerie: p.serie && p.serie.trim() !== '' ? String(p.serie) : null,
          numeroInventario: finalInventario,
          responsable: responsable || null,
          cargoResponsable: cargoResponsable || null,
          areaUbicacion: areaUbicacion || null,
          direccion: direccion || null,
          procedencia: procedencia || null,
          estatus: 'Activo',
          equipoPrincipalId,
          detalles: {}
        }
      });
      fs.appendFileSync(logFile, `Creado exitosamente: ${p.tipo}\n`);
    } catch (error) {
      fs.appendFileSync(logFile, `ERROR al crear ${p.tipo}: ${error.message}\n`);
      throw error; // Re-throw to ensure we know it failed
    }
  }

  fs.appendFileSync(logFile, `Detalles limpios devueltos: ${JSON.stringify(nuevosDetalles)}\n`);
  return nuevosDetalles;
}

async function crearEquipoTecnologico(req, res) {
  const parsed = equipoTecnologicoSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error);

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

  let equipo = await prisma.equipoTecnologico.create({
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

  const detallesLimpios = await procesarPerifericosDeDetalles(
    data.detalles,
    equipo.id,
    data.responsable,
    data.cargoResponsable,
    data.areaUbicacion,
    data.direccion,
    data.procedencia
  );

  if (JSON.stringify(data.detalles || {}) !== JSON.stringify(detallesLimpios)) {
    equipo = await prisma.equipoTecnologico.update({
      where: { id: equipo.id },
      data: { detalles: detallesLimpios },
      include: { componentes: true }
    });
  }

  ok(res, equipo, 201);
}

async function reemplazarPeriferico(req, res) {
  const { equipoPrincipalId, perifericoViejoId, perifericoNuevoId, nuevoEstadoViejo } = req.body;
  if (!equipoPrincipalId || !perifericoViejoId || !perifericoNuevoId || !nuevoEstadoViejo) {
    return fail(res, 'Faltan parámetros requeridos', 400);
  }

  // Verificar que el equipo principal existe
  const principal = await prisma.equipoTecnologico.findUnique({ where: { id: Number(equipoPrincipalId) } });
  if (!principal) return fail(res, 'Equipo principal no encontrado', 404);

  // Verificar periférico nuevo
  const nuevo = await prisma.equipoTecnologico.findUnique({ where: { id: Number(perifericoNuevoId) } });
  if (!nuevo) return fail(res, 'Periférico nuevo no encontrado', 404);
  if (nuevo.estatus !== 'Stock') return fail(res, 'El periférico nuevo debe estar en Stock', 400);

  // Verificar periférico viejo
  const viejo = await prisma.equipoTecnologico.findUnique({ where: { id: Number(perifericoViejoId) } });
  if (!viejo) return fail(res, 'Periférico viejo no encontrado', 404);
  if (viejo.equipoPrincipalId !== principal.id) return fail(res, 'El periférico viejo no está asignado a este equipo principal', 400);

  // Ejecutar transacción
  const result = await prisma.$transaction([
    prisma.equipoTecnologico.update({
      where: { id: viejo.id },
      data: {
        equipoPrincipalId: null,
        estatus: nuevoEstadoViejo // Baja o Mantenimiento
      }
    }),
    prisma.equipoTecnologico.update({
      where: { id: nuevo.id },
      data: {
        equipoPrincipalId: principal.id,
        estatus: 'Activo'
      }
    })
  ]);

  ok(res, { message: 'Periférico reemplazado correctamente', result });
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
  if (!parsed.success) return fail(res, parsed.error);

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

  let equipo = await prisma.equipoTecnologico.update({
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

  const detallesLimpios = await procesarPerifericosDeDetalles(
    data.detalles,
    equipo.id,
    data.responsable,
    data.cargoResponsable,
    data.areaUbicacion,
    data.direccion,
    data.procedencia
  );

  if (JSON.stringify(data.detalles || {}) !== JSON.stringify(detallesLimpios)) {
    equipo = await prisma.equipoTecnologico.update({
      where: { id: equipo.id },
      data: { detalles: detallesLimpios },
      include: { componentes: true }
    });
  }

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

  if (typeof body.cabezalesDetalle === 'string') {
    try {
      body.cabezalesDetalle = JSON.parse(body.cabezalesDetalle);
    } catch (e) {
      body.cabezalesDetalle = null;
    }
  }

  if (typeof body.postesDetalle === 'string') {
    try {
      body.postesDetalle = JSON.parse(body.postesDetalle);
    } catch (e) {
      body.postesDetalle = null;
    }
  }

  if (typeof body.registrosPisoCoordenadas === 'string') {
    try {
      body.registrosPisoCoordenadas = JSON.parse(body.registrosPisoCoordenadas);
    } catch (e) {
      body.registrosPisoCoordenadas = null;
    }
  }

  const parsed = controladorSemaforoSchema.safeParse(body);
  if (!parsed.success) return fail(res, parsed.error);

  const dataToSave = { ...parsed.data };
  if (dataToSave.peatonalModelo || dataToSave.peatonalModuloEstado) {
    dataToSave.pasoPeatonal = true;
  }
  if (dataToSave.audibleModelo || dataToSave.audibleModuloEstado) {
    dataToSave.audible = true;
  }
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

  if (typeof body.cabezalesDetalle === 'string') {
    try {
      body.cabezalesDetalle = JSON.parse(body.cabezalesDetalle);
    } catch (e) {
      body.cabezalesDetalle = null;
    }
  }

  if (typeof body.postesDetalle === 'string') {
    try {
      body.postesDetalle = JSON.parse(body.postesDetalle);
    } catch (e) {
      body.postesDetalle = null;
    }
  }

  if (typeof body.registrosPisoCoordenadas === 'string') {
    try {
      body.registrosPisoCoordenadas = JSON.parse(body.registrosPisoCoordenadas);
    } catch (e) {
      body.registrosPisoCoordenadas = null;
    }
  }

  const parsed = controladorSemaforoSchema.safeParse(body);
  if (!parsed.success) return fail(res, parsed.error);

  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  const dataToUpdate = { ...parsed.data };
  if (dataToUpdate.peatonalModelo || dataToUpdate.peatonalModuloEstado) {
    dataToUpdate.pasoPeatonal = true;
  }
  if (dataToUpdate.audibleModelo || dataToUpdate.audibleModuloEstado) {
    dataToUpdate.audible = true;
  }
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

// =========================================================================
// FUNCIONES MODULARES PARA TRABAJO CONCURRENTE EN CRUCEROS (SECCIONES)
// =========================================================================

const normalizarNombreModeloPosteBackend = (mod) => {
  if (!mod) return '';
  const str = String(mod).trim();
  if (str.toLowerCase().includes('pedestal') || str.toLowerCase().includes('mp-01') || str.toLowerCase() === 'poste peatonal' || str.toLowerCase() === 'peatonal') {
    return 'MP-01';
  }
  return str;
};

const recalcularTotalesDesdePostesBackend = (postesRaw) => {
  let listaPostes = [];
  if (typeof postesRaw === 'string') {
    try { listaPostes = JSON.parse(postesRaw); } catch (e) { listaPostes = []; }
  } else if (Array.isArray(postesRaw)) {
    listaPostes = postesRaw;
  }

  let semaforos3 = 0;
  let semaforos4 = 0;
  let totalVerdes = 0;
  let totalFlechasVerdes = 0;
  let totalRojos = 0;
  let totalFlechasRojas = 0;
  let totalAmarillos = 0;

  listaPostes.forEach(p => {
    if (p.tipoPoste !== 'peatonal' && (p.tipoCabezal || 'LED') === 'LED') {
      const grupos = Array.isArray(p.cabezalesGrupos) ? p.cabezalesGrupos : [];
      grupos.forEach(grupo => {
        const num = grupo.numLeds !== undefined ? Number(grupo.numLeds) : 4;
        if (num === 3) semaforos3 += 1;
        else if (num === 4) semaforos4 += 1;

        const leds = (grupo.leds || []).slice(0, num);
        leds.forEach(led => {
          const c = (led.color || '').toLowerCase();
          if (c === 'verde') totalVerdes += 1;
          else if (c === 'flecha verde') totalFlechasVerdes += 1;
          else if (c === 'rojo') totalRojos += 1;
          else if (c === 'flecha roja') totalFlechasRojas += 1;
          else if (c === 'amarillo') totalAmarillos += 1;
        });
      });
    }
  });

  const tienePantalla = listaPostes.some(p => p.tipoPoste !== 'peatonal' && p.tipoCabezal === 'Pantalla');
  const totalPantallaPiezas = listaPostes.reduce((acc, p) => (p.tipoPoste !== 'peatonal' && p.tipoCabezal === 'Pantalla') ? acc + (Number(p.pantallaPiezas) || 0) : acc, 0);

  const pantallasPostes = listaPostes
    .filter(p => p.tipoPoste !== 'peatonal' && p.tipoCabezal === 'Pantalla')
    .flatMap(p => Array.isArray(p.pantallasLista) && p.pantallasLista.length > 0 ? p.pantallasLista : [{ estado: p.pantallaEstado || 'Funciona' }]);

  let estadoPantallasConsolidado = 'Funciona';
  if (pantallasPostes.length > 0) {
    const hayFalla = pantallasPostes.some(x => x.estado === 'No funciona');
    const todasFallan = pantallasPostes.every(x => x.estado === 'No funciona');
    estadoPantallasConsolidado = todasFallan ? 'No funciona' : (hayFalla ? 'Parcial' : 'Funciona');
  }

  const peatonalesLuminosos = (p) => {
    if (!p.tienePeatonal) return [];
    if (Array.isArray(p.peatonalesLista) && p.peatonalesLista.length > 0) {
      return p.peatonalesLista.filter(pt => pt.modelo && !pt.modelo.toLowerCase().includes('sin cabezal'));
    }
    if (p.peatonalModelo && !p.peatonalModelo.toLowerCase().includes('sin cabezal')) {
      return [{ modelo: p.peatonalModelo }];
    }
    return [];
  };

  const tienePasoPeatonal = listaPostes.some(p => p.tienePeatonal && peatonalesLuminosos(p).length > 0);
  const totalPeatonales = listaPostes.reduce((acc, p) => p.tienePeatonal ? acc + peatonalesLuminosos(p).length : acc, 0);

  const totalAudibles = listaPostes.reduce((acc, p) => {
    if (p.tienePeatonal && Array.isArray(p.peatonalesLista) && p.peatonalesLista.length > 0) {
      const count = p.peatonalesLista.filter(pt => pt.tieneAudible).length;
      if (count > 0) return acc + count;
    }
    return p.tieneAudible ? acc + (p.audiblesLista?.length || 1) : acc;
  }, 0);
  const tieneAudible = totalAudibles > 0 || listaPostes.some(p => p.tieneAudible && ((p.audiblesLista && p.audiblesLista.length > 0) || p.audibleModelo));

  const tieneCamara = listaPostes.some(p => p.tieneCamara);
  const totalCamaras = listaPostes.reduce((acc, p) => p.tieneCamara ? acc + (parseInt(p.camaraCantidad, 10) || 0) : acc, 0);

  const modelosPostes = [...new Set(listaPostes.map(p => normalizarNombreModeloPosteBackend(p.modeloPoste)).filter(Boolean))].join(', ');
  const primerPoste = listaPostes[0] || {};
  const primerPosteModelo = normalizarNombreModeloPosteBackend(primerPoste.modeloPoste);
  const primerPeatonal = listaPostes.find(p => p.tienePeatonal && peatonalesLuminosos(p).length > 0)?.peatonalesLista?.[0];
  const primerAudible = listaPostes.flatMap(p => (p.tienePeatonal ? (p.peatonalesLista || []) : [])).find(pt => pt.tieneAudible)
    || listaPostes.find(p => p.tieneAudible && p.audiblesLista?.[0])?.audiblesLista?.[0];

  return {
    semaforos3Luces: semaforos3,
    semaforos4Luces: semaforos4,
    totalLedsVerdes: totalVerdes,
    totalFlechasVerdes: totalFlechasVerdes,
    totalLedsRojos: totalRojos,
    totalFlechasRojas: totalFlechasRojas,
    totalLedsAmarillos: totalAmarillos,
    pantallaLed: tienePantalla,
    pantallaPiezas: totalPantallaPiezas,
    pantallaEstado: estadoPantallasConsolidado,
    pasoPeatonal: tienePasoPeatonal,
    audible: tieneAudible,
    posteModeloTipo: modelosPostes || primerPosteModelo || null,
    posteTapaRegistro: primerPoste.tapaRegistro || 'Buena',
    posteObservaciones: listaPostes.map((p, i) => {
      const ubi = p.ubicacionPoste ? ` (${p.ubicacionPoste})` : '';
      return p.observaciones ? `Poste ${i + 1}${ubi}: ${p.observaciones}` : '';
    }).filter(Boolean).join(' | ') || null,
    peatonalModelo: primerPeatonal?.modelo || listaPostes.find(p => p.tienePeatonal && p.peatonalModelo)?.peatonalModelo || null,
    peatonalModuloEstado: primerPeatonal?.estado || listaPostes.find(p => p.tienePeatonal && p.peatonalModuloEstado)?.peatonalModuloEstado || null,
    audibleModelo: primerAudible?.audibleModelo || primerAudible?.modelo || listaPostes.find(p => p.tieneAudible && p.audibleModelo)?.audibleModelo || null,
    audibleModuloEstado: primerAudible?.audibleEstado || primerAudible?.estado || listaPostes.find(p => p.tieneAudible && p.audibleModuloEstado)?.audibleModuloEstado || null,
    camaraModelo: listaPostes.find(p => p.tieneCamara && p.camaraModelo)?.camaraModelo || null,
    camaraCantidad: totalCamaras > 0 ? String(totalCamaras) : (listaPostes.find(p => p.tieneCamara && p.camaraCantidad)?.camaraCantidad || null)
  };
};

async function actualizarGabineteControlador(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  const body = { ...req.body };
  const booleanFields = ['tarjetaRelevadora', 'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera'];
  booleanFields.forEach(key => {
    if (body[key] === 'true') body[key] = true;
    if (body[key] === 'false') body[key] = false;
  });

  const gabineteData = {};
  const allowedFields = [
    'modelo', 'cruceroId',
    'tarjetaConflictosMarca', 'tarjetaConflictosModelo', 'tarjetaConflictosEstado',
    'tarjetaRelevadoresMarca', 'tarjetaRelevadoresModelo', 'tarjetaRelevadoresCantidad',
    'tarjetaRelevadora', 'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera',
    'cimientoCompleto', 'cimientoCuantosDados', 'tapaCableado', 'tornilleriaBaseCompleta', 'tornilleriaCuantosTornillos',
    'observacionesExterior', 'gpsModelo', 'gpsComponenteFisico', 'gpsAntenaExterior',
    'numeroGabinete', 'versionFirmware', 'ipLocal', 'ipSystem', 'mascaraRed', 'gateway',
    'cicloCompleto', 'respaldoProgramacionUsb',
    'switchFibraMarca', 'switchFibraModelo', 'switchFibraPuertosTotal', 'switchFibraPuertosUso', 'switchFibraFuentePoder',
    'receptorFibraDispositivo', 'receptorFibraCable', 'conexionesTarjetaMadre', 'fuentePoderSupresorPicos'
  ];

  allowedFields.forEach(campo => {
    if (body[campo] !== undefined) {
      if (campo === 'cruceroId') {
        gabineteData[campo] = Number(body[campo]);
      } else {
        gabineteData[campo] = body[campo];
      }
    }
  });

  if (req.file) {
    gabineteData.archivoProgramacion = `uploads/${req.file.filename}`;
  } else if (body.removerArchivo === 'true') {
    gabineteData.archivoProgramacion = null;
  }

  const controlador = await prisma.controladorSemaforo.update({
    where: { id },
    data: gabineteData,
    include: { crucero: true }
  });

  ok(res, { controlador, mensaje: 'Datos del gabinete guardados exitosamente.' });
}

async function obtenerPostesControlador(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  let list = [];
  if (typeof existe.postesDetalle === 'string') {
    try { list = JSON.parse(existe.postesDetalle); } catch (e) { list = []; }
  } else if (Array.isArray(existe.postesDetalle)) {
    list = existe.postesDetalle;
  }

  ok(res, { postes: list, id: existe.id, modelo: existe.modelo });
}

async function agregarPosteControlador(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  let list = [];
  if (typeof existe.postesDetalle === 'string') {
    try { list = JSON.parse(existe.postesDetalle); } catch (e) { list = []; }
  } else if (Array.isArray(existe.postesDetalle)) {
    list = [...existe.postesDetalle];
  }

  const rawPoste = req.body.poste || req.body;
  if (!rawPoste || typeof rawPoste !== 'object') {
    return fail(res, 'Los datos del poste son requeridos', 400);
  }

  const sigId = list.length > 0 ? Math.max(...list.map(p => Number(p.id) || 0)) + 1 : 1;
  const nuevoPoste = {
    ...rawPoste,
    id: rawPoste.id || sigId
  };

  list.push(nuevoPoste);

  const totales = recalcularTotalesDesdePostesBackend(list);

  const controlador = await prisma.controladorSemaforo.update({
    where: { id },
    data: {
      postesDetalle: list,
      ...totales
    },
    include: { crucero: true }
  });

  ok(res, { poste: nuevoPoste, postes: list, controlador, mensaje: 'Poste agregado exitosamente al crucero.' }, 201);
}

async function actualizarPosteControlador(req, res) {
  const id = Number(req.params.id);
  const posteId = Number(req.params.posteId);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  let list = [];
  if (typeof existe.postesDetalle === 'string') {
    try { list = JSON.parse(existe.postesDetalle); } catch (e) { list = []; }
  } else if (Array.isArray(existe.postesDetalle)) {
    list = [...existe.postesDetalle];
  }

  const rawPoste = req.body.poste || req.body;
  const index = list.findIndex(p => Number(p.id) === posteId);
  if (index === -1) {
    return fail(res, 'Poste no encontrado en este controlador', 404);
  }

  list[index] = {
    ...list[index],
    ...rawPoste,
    id: posteId
  };

  const totales = recalcularTotalesDesdePostesBackend(list);

  const controlador = await prisma.controladorSemaforo.update({
    where: { id },
    data: {
      postesDetalle: list,
      ...totales
    },
    include: { crucero: true }
  });

  ok(res, { poste: list[index], postes: list, controlador, mensaje: 'Poste actualizado exitosamente.' });
}

async function eliminarPosteControlador(req, res) {
  const id = Number(req.params.id);
  const posteId = Number(req.params.posteId);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  let list = [];
  if (typeof existe.postesDetalle === 'string') {
    try { list = JSON.parse(existe.postesDetalle); } catch (e) { list = []; }
  } else if (Array.isArray(existe.postesDetalle)) {
    list = [...existe.postesDetalle];
  }

  const filtrados = list.filter(p => Number(p.id) !== posteId);
  const totales = recalcularTotalesDesdePostesBackend(filtrados);

  const controlador = await prisma.controladorSemaforo.update({
    where: { id },
    data: {
      postesDetalle: filtrados,
      ...totales
    },
    include: { crucero: true }
  });

  ok(res, { postes: filtrados, controlador, mensaje: 'Poste eliminado exitosamente.' });
}

async function actualizarRegistrosPisoControlador(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.controladorSemaforo.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Controlador semafórico no encontrado', 404);

  const { registrosPisoTapas, registrosPisoDanados, registrosPisoCoordenadas } = req.body;
  let parsedCoords = registrosPisoCoordenadas;
  if (typeof registrosPisoCoordenadas === 'string') {
    try { parsedCoords = JSON.parse(registrosPisoCoordenadas); } catch (e) { parsedCoords = null; }
  }

  const controlador = await prisma.controladorSemaforo.update({
    where: { id },
    data: {
      registrosPisoTapas: registrosPisoTapas !== undefined ? String(registrosPisoTapas) : existe.registrosPisoTapas,
      registrosPisoDanados: registrosPisoDanados !== undefined ? Number(registrosPisoDanados) : existe.registrosPisoDanados,
      registrosPisoCoordenadas: parsedCoords !== undefined ? parsedCoords : existe.registrosPisoCoordenadas
    },
    include: { crucero: true }
  });

  ok(res, { controlador, mensaje: 'Registros de piso guardados exitosamente.' });
}

// ==========================================
// 3. EXISTENCIAS / STOCK DE REFACCIONES
// ==========================================

async function listarExistencias(req, res) {
  const { categoria, tipoInventario, estadoFisico, soloBuenEstado } = req.query;
  const where = {};
  if (categoria) where.categoria = categoria;
  if (tipoInventario) where.tipoInventario = tipoInventario;
  if (estadoFisico) {
    where.estadoFisico = estadoFisico;
  } else if (soloBuenEstado === 'true') {
    where.AND = [
      {
        OR: [
          { estadoFisico: 'Buen Estado' },
          { estadoFisico: null },
        ]
      },
      {
        NOT: [
          { nombre: { contains: 'Reemplazada' } },
          { nombre: { contains: 'Retirada' } }
        ]
      }
    ];
  }

  const existencias = await prisma.existenciaComponente.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });

  const existenciaIds = existencias.map(e => e.id);
  const piezasReemplazadasSemaforo = await prisma.reporteSemaforoPieza.findMany({
    where: {
      piezaReemplazadaExistenciaId: { in: existenciaIds }
    },
    include: {
      reporteSemaforo: {
        include: {
          crucero: true,
          estacion: true
        }
      }
    }
  });

  const origenMap = {};
  piezasReemplazadasSemaforo.forEach(p => {
    if (p.piezaReemplazadaExistenciaId) {
      origenMap[p.piezaReemplazadaExistenciaId] = {
        folio: p.reporteSemaforo?.folio,
        crucero: p.reporteSemaforo?.crucero?.nombre,
        estacion: p.reporteSemaforo?.estacion?.nombre,
        fecha: p.createdAt,
        estadoPieza: p.estadoPiezaReemplazada
      };
    }
  });

  const existenciasConOrigen = existencias.map(e => ({
    ...e,
    origenCrucero: origenMap[e.id] || null
  }));

  ok(res, existenciasConOrigen);
}

async function ingresarExistencia(req, res) {
  const parsed = ingresoExistenciaSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error);

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
  if (!parsed.success) return fail(res, parsed.error);

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

  // 1. Piezas asignadas (salidas hacia reportes)
  const historialAsignado = await prisma.reporteSemaforoPieza.findMany({
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

  // 2. Piezas retiradas/dañadas (entradas desde reportes)
  const historialReemplazado = await prisma.reporteSemaforoPieza.findMany({
    where: { piezaReemplazadaExistenciaId: id },
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

  const historialMapeadoAsignado = historialAsignado.map(h => ({
    id: `asig-${h.id}`,
    tipoMovimiento: 'Asignación / Instalación',
    cantidad: h.cantidad,
    esSalida: true,
    fecha: h.createdAt,
    reporte: {
      id: h.reporteSemaforo?.id,
      folio: h.reporteSemaforo?.folio,
      estacion: h.reporteSemaforo?.estacion?.nombre,
      crucero: h.reporteSemaforo?.crucero?.nombre
    }
  }));

  const historialMapeadoReemplazado = historialReemplazado.map(h => ({
    id: `reemp-${h.id}`,
    tipoMovimiento: 'Retirada / Reemplazo en crucero',
    cantidad: h.cantidad,
    esSalida: false,
    fecha: h.createdAt,
    estadoPieza: h.estadoPiezaReemplazada,
    reporte: {
      id: h.reporteSemaforo?.id,
      folio: h.reporteSemaforo?.folio,
      estacion: h.reporteSemaforo?.estacion?.nombre,
      crucero: h.reporteSemaforo?.crucero?.nombre
    }
  }));

  const historialCompleto = [...historialMapeadoReemplazado, ...historialMapeadoAsignado].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  ok(res, historialCompleto);
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
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra', 'refaccion'] };
    } else if (tipo) {
      where.tipo = tipo;
    } else {
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra', 'refaccion'] };
    }
  }
  if (area) where.areaUbicacion = { contains: area };

  if (search) {
    where.OR = construirCondicionesBusquedaEquipo(search);
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

  const tipoFinal = where.tipo === 'herramienta_infra' ? 'herramienta_infra' : (where.tipo === 'herramienta_tec' ? 'herramienta_tec' : (tipo || 'tecnologico'));

  let buffer;
  if (tipoFinal === 'herramienta_infra' || tipoFinal === 'herramienta_tec') {
    buffer = await exportarHerramientasExcel(equipos, tipoFinal, includeImages === 'true');
  } else {
    buffer = await exportarInventarioExistencias(equipos, includeImages === 'true');
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="inventario_${tipoFinal}.xlsx"`);
  res.send(buffer);
}

// ==========================================
// 4. INVENTARIO DE MOBILIARIO
// ==========================================

async function listarMobiliario(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { search } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { numeroInventario: { contains: search } },
      { bien: { contains: search } },
      { descripcion: { contains: search } },
      { direccion: { contains: search } },
      { subdireccion: { contains: search } },
      { area: { contains: search } },
      { nombreResguardante: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.inventarioMobiliario.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
    }),
    prisma.inventarioMobiliario.count({ where }),
  ]);

  ok(res, { items, total, page, limit });
}

async function crearMobiliario(req, res) {
  const parsed = mobiliarioSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error);

  const data = parsed.data;

  const existe = await prisma.inventarioMobiliario.findUnique({
    where: { numeroInventario: data.numeroInventario },
  });
  if (existe) {
    return fail(res, `El número de inventario '${data.numeroInventario}' ya existe`);
  }

  const mobiliario = await prisma.inventarioMobiliario.create({
    data: {
      numeroInventario: data.numeroInventario,
      bien: data.bien,
      marca: data.marca || null,
      modelo: data.modelo || null,
      numeroSerie: data.numeroSerie || null,
      descripcion: data.descripcion,
      direccion: data.direccion,
      subdireccion: data.subdireccion || '',
      area: data.area || '',
      cargo: data.cargo || null,
      nombreResguardante: data.nombreResguardante,
    },
  });

  ok(res, mobiliario, 201);
}

async function obtenerMobiliario(req, res) {
  const id = Number(req.params.id);
  const mobiliario = await prisma.inventarioMobiliario.findUnique({ where: { id } });
  if (!mobiliario) return fail(res, 'Mobiliario no encontrado', 404);
  ok(res, mobiliario);
}

async function actualizarMobiliario(req, res) {
  const id = Number(req.params.id);
  const parsed = mobiliarioSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error);

  const data = parsed.data;

  const actual = await prisma.inventarioMobiliario.findUnique({ where: { id } });
  if (!actual) return fail(res, 'Mobiliario no encontrado', 404);

  if (data.numeroInventario !== actual.numeroInventario) {
    const existe = await prisma.inventarioMobiliario.findUnique({
      where: { numeroInventario: data.numeroInventario },
    });
    if (existe) {
      return fail(res, `El número de inventario '${data.numeroInventario}' ya está asignado`);
    }
  }

  const mobiliario = await prisma.inventarioMobiliario.update({
    where: { id },
    data: {
      numeroInventario: data.numeroInventario,
      bien: data.bien,
      marca: data.marca || null,
      modelo: data.modelo || null,
      numeroSerie: data.numeroSerie || null,
      descripcion: data.descripcion,
      direccion: data.direccion,
      subdireccion: data.subdireccion || '',
      area: data.area || '',
      cargo: data.cargo || null,
      nombreResguardante: data.nombreResguardante,
    },
  });

  ok(res, mobiliario);
}

async function eliminarMobiliario(req, res) {
  const id = Number(req.params.id);
  const existe = await prisma.inventarioMobiliario.findUnique({ where: { id } });
  if (!existe) return fail(res, 'Mobiliario no encontrado', 404);

  await prisma.inventarioMobiliario.delete({ where: { id } });
  ok(res, { message: 'Mobiliario eliminado correctamente' });
}

async function exportarMobiliarioExcel(req, res) {
  const { search, order } = req.query;
  const where = {};

  if (search) {
    where.OR = [
      { numeroInventario: { contains: search } },
      { bien: { contains: search } },
      { descripcion: { contains: search } },
      { direccion: { contains: search } },
      { subdireccion: { contains: search } },
      { area: { contains: search } },
      { nombreResguardante: { contains: search } },
    ];
  }

  const mobiliario = await prisma.inventarioMobiliario.findMany({
    where,
    orderBy: { id: order === 'desc' ? 'desc' : 'asc' },
  });

  const buffer = await exportarInventarioMobiliario(mobiliario);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="inventario_mobiliario.xlsx"');
  res.send(buffer);
}

module.exports = {
  listarEquipoTecnologico,
  crearEquipoTecnologico,
  reemplazarPeriferico,
  obtenerEquipoTecnologico,
  actualizarEquipoTecnologico,
  eliminarEquipoTecnologico,

  listarControladoresSemaforo,
  crearControladorSemaforo,
  obtenerControladorSemaforo,
  actualizarControladorSemaforo,
  eliminarControladorSemaforo,
  descargarProgramacion,
  actualizarGabineteControlador,
  obtenerPostesControlador,
  agregarPosteControlador,
  actualizarPosteControlador,
  eliminarPosteControlador,
  actualizarRegistrosPisoControlador,

  listarExistencias,
  ingresarExistencia,
  actualizarExistencia,
  eliminarExistencia,
  obtenerHistorialExistencia,
  exportarExistenciasExcel,
  exportarEquipoTecnologicoExcel,

  listarMobiliario,
  crearMobiliario,
  obtenerMobiliario,
  actualizarMobiliario,
  eliminarMobiliario,
  exportarMobiliarioExcel,
};
