const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAPA_TIPOS_FRIENDLY = {
  camara: ['camara', 'videovigilancia', 'vigilancia'],
  escritorio: ['escritorio', 'computadora', 'pc', 'desktop'],
  laptop: ['laptop', 'portatil', 'notebook'],
  servidor: ['servidor', 'server'],
  teclado: ['teclado', 'keyboard'],
  mouse: ['mouse', 'raton'],
  monitor: ['monitor', 'pantalla'],
  impresora: ['impresora', 'printer'],
  plotter: ['plotter'],
  access_point: ['access point', 'accesspoint', 'ap'],
  antena_wifi: ['antena wifi', 'adaptador wifi'],
  cargador: ['cargador', 'eliminador'],
  cable: ['cable'],
  router: ['router'],
  switch: ['switch'],
  firewall: ['firewall', 'fortigate'],
  antena: ['antena microonda', 'antena'],
  internet: ['internet', 'modem'],
  dvr: ['dvr', 'nvr'],
  celular: ['celular', 'smartphone'],
  telefono: ['telefono'],
  radio: ['radio'],
  aire: ['aire acondicionado', 'clima'],
  no_break: ['no break', 'nobreak', 'ups'],
  regulador: ['regulador'],
  lectora_tags: ['lectora de tags', 'lectora tags'],
  controladora: ['controladora'],
  terminal_multibiometrica: ['terminal multibiometrica', 'biometrico', 'biometrica'],
  ram: ['memoria ram', 'ram'],
  almacenamiento: ['disco duro', 'ssd', 'hdd', 'almacenamiento'],
  cabezal: ['cabezal']
};

function normalizarTermino(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function generarCamposOrParaTermino(t, tiposDetectados = []) {
  const orFields = [
    { tipo: { contains: t } },
    { numeroInventario: { contains: t } },
    { numeroSerie: { contains: t } },
    { marca: { contains: t } },
    { modelo: { contains: t } },
    { responsable: { contains: t } },
    { cargoResponsable: { contains: t } },
    { areaUbicacion: { contains: t } },
    { direccion: { contains: t } },
    { procedencia: { contains: t } },
    { estatus: { contains: t } },

    // Especificaciones técnicas de escritorio y equipos en JSON detalles
    { detalles: { path: '$.procesador', string_contains: t } },
    { detalles: { path: '$.ram', string_contains: t } },
    { detalles: { path: '$.almacenamiento', string_contains: t } },
    { detalles: { path: '$.tipoAlmacenamiento', string_contains: t } },
    { detalles: { path: '$.sistemaOperativo', string_contains: t } },
    { detalles: { path: '$.tarjetaGrafica', string_contains: t } },
    { detalles: { path: '$.red', string_contains: t } },
    { detalles: { path: '$.mac', string_contains: t } },
    { detalles: { path: '$.ipPredeterminada', string_contains: t } },
    { detalles: { path: '$.nombre', string_contains: t } },
    { detalles: { path: '$.especificarTipo', string_contains: t } },
    { detalles: { path: '$.marcaMonitor', string_contains: t } },
    { detalles: { path: '$.modeloMonitor', string_contains: t } },
    { detalles: { path: '$.numeroSerieMonitor', string_contains: t } },
    { detalles: { path: '$.numeroInventarioMonitor', string_contains: t } },
    { detalles: { path: '$.marcaTeclado', string_contains: t } },
    { detalles: { path: '$.modeloTeclado', string_contains: t } },
    { detalles: { path: '$.numeroSerieTeclado', string_contains: t } },
    { detalles: { path: '$.marcaMouse', string_contains: t } },
    { detalles: { path: '$.modeloMouse', string_contains: t } },
    { detalles: { path: '$.numeroSerieMouse', string_contains: t } },
    { detalles: { path: '$.marcaRegulador', string_contains: t } },
    { detalles: { path: '$.modeloRegulador', string_contains: t } },
    { detalles: { path: '$.numeroSerieRegulador', string_contains: t } },
    { detalles: { path: '$.megapixeles', string_contains: t } },
    { detalles: { path: '$.serie', string_contains: t } },
    { detalles: { path: '$.discoDuro', string_contains: t } }
  ];

  if (tiposDetectados && tiposDetectados.length > 0) {
    tiposDetectados.forEach(tipo => {
      orFields.push({ tipo: { equals: tipo } });
    });
  }

  return orFields;
}

function construirCondicionesBusqueda(search) {
  if (!search || !search.trim()) return [];

  const raw = search.trim();
  const rawNorm = normalizarTermino(raw);
  const conectores = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'con', 'para', 'y', 'o', 'un', 'una']);

  const palabras = rawNorm
    .replace(/[^a-z0-9\s\-_]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 0 && !conectores.has(p));

  // Detectar tipos de equipo friendly asociados a la búsqueda completa o palabras
  const tiposDetectados = new Set();
  for (const [tipoKey, sinonimos] of Object.entries(MAPA_TIPOS_FRIENDLY)) {
    if (sinonimos.some(s => rawNorm.includes(s) || palabras.includes(s))) {
      tiposDetectados.add(tipoKey);
    }
  }

  const terminos = new Set([raw, rawNorm]);
  const compacto = raw.replace(/\s+/g, '');
  if (compacto) terminos.add(compacto);
  const conEspacio = raw.replace(/(\d+)(gb|tb|mb|ghz|mhz)/gi, '$1 $2');
  if (conEspacio) terminos.add(conEspacio);

  palabras.forEach(p => {
    if (p.length >= 2) terminos.add(p);
  });
  tiposDetectados.forEach(t => terminos.add(t));

  // Si son múltiples palabras (ej. "camara epcom", "teclado logitech", "dell optiplex 7090")
  if (palabras.length > 1) {
    const andGroup = palabras.map(palabra => {
      const tiposDePalabra = [];
      for (const [tipoKey, sinonimos] of Object.entries(MAPA_TIPOS_FRIENDLY)) {
        if (sinonimos.includes(palabra)) tiposDePalabra.push(tipoKey);
      }
      return { OR: generarCamposOrParaTermino(palabra, tiposDePalabra) };
    });

    const directOrs = Array.from(terminos).flatMap(t => generarCamposOrParaTermino(t, Array.from(tiposDetectados)));
    return [{ AND: andGroup }, ...directOrs];
  }

  // Una sola palabra o término directo
  const orConditions = [];
  for (const term of terminos) {
    orConditions.push(...generarCamposOrParaTermino(term, Array.from(tiposDetectados)));
  }
  return orConditions;
}

// Obtener todos los equipos con paginación y búsqueda
const obtenerEquipos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const tipo = req.query.tipo || '';
    const estatus = req.query.estatus || '';
    const estatusNot = req.query.estatusNot || '';
    
    const skip = (page - 1) * limit;

    const where = {};
    
    if (estatus) {
      where.estatus = estatus;
    } else if (estatusNot) {
      where.estatus = { not: estatusNot };
    }
    
    if (search) {
      where.OR = construirCondicionesBusqueda(search);
    }
    
    if (tipo === 'herramientas') {
      where.tipo = { in: ['herramienta_tec', 'herramienta_infra'] };
    } else if (tipo === 'tecnologico') {
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra', 'refaccion'] };
    } else if (tipo) {
      where.tipo = tipo;
    } else {
      where.tipo = { notIn: ['herramienta_tec', 'herramienta_infra', 'refaccion'] };
    }


    const [equipos, total] = await Promise.all([
      prisma.equipoTecnologico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          equipoPrincipal: {
            select: {
              id: true,
              tipo: true,
              marca: true,
              modelo: true,
              numeroInventario: true,
              numeroSerie: true
            }
          },
          componentes: true
        }
      }),
      prisma.equipoTecnologico.count({ where })
    ]);

    res.json({
      ok: true,
      data: equipos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};

// Crear un nuevo equipo
const crearEquipo = async (req, res) => {
  try {
    const {
      tipo,
      numeroInventario,
      numeroSerie,
      marca,
      modelo,
      responsable,
      cargoResponsable,
      areaUbicacion,
      direccion,
      procedencia,
      estatus,
      detalles
    } = req.body;

    if (!tipo) {
      return res.status(400).json({ ok: false, error: 'El tipo de equipo es obligatorio.' });
    }

    // Validación de duplicados únicamente en número de inventario (ignora marcadores genéricos)
    const ignorarUnicos = ['S/N', 'INF-S/N', 'S/S', 'N/A', 'SIN NUMERO', 'SIN SERIE', 'S/M', 'SN'];
    const invTrim = (numeroInventario || '').trim().toUpperCase();

    if (numeroInventario && !ignorarUnicos.includes(invTrim)) {
      const existe = await prisma.equipoTecnologico.findFirst({
        where: { numeroInventario: numeroInventario.trim() }
      });

      if (existe) {
        return res.status(400).json({ ok: false, error: `El número de inventario "${numeroInventario}" ya está registrado en otro equipo.` });
      }
    }

    const cantidadNum = Math.max(1, parseInt(req.body.cantidad || detalles?.cantidad, 10) || 1);

    if (cantidadNum > 1) {
      const equiposCreados = [];
      const detallesIndividual = { ...(detalles || {}), cantidad: 1 };

      for (let i = 0; i < cantidadNum; i++) {
        let invParaEste = numeroInventario || null;
        if (invParaEste && !ignorarUnicos.includes(invTrim)) {
          invParaEste = i === 0 ? invParaEste : `${invParaEste}-${i + 1}`;
        }

        const eq = await prisma.equipoTecnologico.create({
          data: {
            tipo,
            numeroInventario: invParaEste,
            numeroSerie: numeroSerie || null,
            marca: marca || null,
            modelo: modelo || null,
            responsable: responsable || null,
            cargoResponsable: cargoResponsable || null,
            areaUbicacion: areaUbicacion || null,
            direccion: direccion || null,
            procedencia: procedencia || null,
            estatus: estatus || 'Activo',
            detalles: detallesIndividual
          }
        });
        equiposCreados.push(eq);
      }

      return res.status(201).json({
        ok: true,
        data: equiposCreados[0],
        totalCreados: equiposCreados.length,
        message: `Se crearon ${equiposCreados.length} unidades individuales correctamente.`
      });
    }

    const nuevoEquipo = await prisma.equipoTecnologico.create({
      data: {
        tipo,
        numeroInventario: numeroInventario || null,
        numeroSerie: numeroSerie || null,
        marca: marca || null,
        modelo: modelo || null,
        responsable: responsable || null,
        cargoResponsable: cargoResponsable || null,
        areaUbicacion: areaUbicacion || null,
        direccion: direccion || null,
        procedencia: procedencia || null,
        estatus: estatus || 'Activo',
        detalles: { ...(detalles || {}), cantidad: 1 }
      }
    });

    let detallesLimpios = await procesarPerifericosDeDetalles(
      detalles || {},
      nuevoEquipo.id,
      responsable,
      cargoResponsable,
      areaUbicacion,
      direccion,
      procedencia
    );

    if (JSON.stringify(detalles || {}) !== JSON.stringify(detallesLimpios)) {
      const eqActualizado = await prisma.equipoTecnologico.update({
        where: { id: nuevoEquipo.id },
        data: { detalles: detallesLimpios }
      });
      return res.status(201).json({ ok: true, data: eqActualizado });
    }

    res.status(201).json({ ok: true, data: nuevoEquipo });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};

// Actualizar un equipo existente
const actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      numeroInventario,
      numeroSerie,
      marca,
      modelo,
      responsable,
      cargoResponsable,
      areaUbicacion,
      direccion,
      procedencia,
      estatus,
      detalles,
      equipoPrincipalId
    } = req.body;

    // Verificar si el equipo existe
    const equipoExistente = await prisma.equipoTecnologico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!equipoExistente) {
      return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    }

    // Validación de duplicados, excluyendo el equipo actual (únicamente número de inventario)
    const ignorarUnicos = ['S/N', 'INF-S/N', 'S/S', 'N/A', 'SIN NUMERO', 'SIN SERIE', 'S/M', 'SN'];
    const invTrim = (numeroInventario || '').trim().toUpperCase();

    if (numeroInventario && !ignorarUnicos.includes(invTrim)) {
      const existe = await prisma.equipoTecnologico.findFirst({
        where: {
          id: { not: parseInt(id) },
          numeroInventario: numeroInventario.trim()
        }
      });

      if (existe) {
        return res.status(400).json({ ok: false, error: `El número de inventario "${numeroInventario}" ya está registrado en otro equipo.` });
      }
    }

    const datosActualizar = {
      tipo,
      numeroInventario: numeroInventario || null,
      numeroSerie: numeroSerie || null,
      marca: marca || null,
      modelo: modelo || null,
      responsable: responsable || null,
      cargoResponsable: cargoResponsable || null,
      areaUbicacion: areaUbicacion || null,
      direccion: direccion || null,
      procedencia: procedencia || null,
      estatus: estatus || 'Activo',
      detalles: detalles || {}
    };

    if (equipoPrincipalId !== undefined) {
      datosActualizar.equipoPrincipalId = equipoPrincipalId ? parseInt(equipoPrincipalId) : null;
    }

    if (req.body.desvincularComponentes) {
      await prisma.equipoTecnologico.updateMany({
        where: { equipoPrincipalId: parseInt(id) },
        data: { equipoPrincipalId: null }
      });
    }

    const equipoActualizado = await prisma.equipoTecnologico.update({
      where: { id: parseInt(id) },
      data: datosActualizar,
      include: {
        equipoPrincipal: {
          select: {
            id: true,
            tipo: true,
            marca: true,
            modelo: true,
            numeroInventario: true,
            numeroSerie: true
          }
        },
        componentes: true
      }
    });

    let detallesLimpios = await procesarPerifericosDeDetalles(
      detalles || {},
      equipoActualizado.id,
      responsable,
      cargoResponsable,
      areaUbicacion,
      direccion,
      procedencia
    );

    if (JSON.stringify(detalles || {}) !== JSON.stringify(detallesLimpios)) {
      const eqAc2 = await prisma.equipoTecnologico.update({
        where: { id: equipoActualizado.id },
        data: { detalles: detallesLimpios },
        include: {
          equipoPrincipal: {
            select: {
              id: true,
              tipo: true,
              marca: true,
              modelo: true,
              numeroInventario: true,
              numeroSerie: true
            }
          },
          componentes: true
        }
      });
      return res.json({ ok: true, data: eqAc2 });
    }

    res.json({ ok: true, data: equipoActualizado });
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};

// Eliminar un equipo
const eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipoExistente = await prisma.equipoTecnologico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!equipoExistente) {
      return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    }

    // Desvincular periféricos asociados para que no queden bloqueados por llave foránea ni huérfanos
    await prisma.equipoTecnologico.updateMany({
      where: { equipoPrincipalId: parseInt(id) },
      data: { equipoPrincipalId: null }
    });

    await prisma.equipoTecnologico.delete({
      where: { id: parseInt(id) }
    });

    res.json({ ok: true, message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({
        ok: false,
        error: 'No se puede eliminar el equipo porque tiene registros asociados (resguardos, componentes o reportes).'
      });
    }
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};

async function procesarPerifericosDeDetalles(detalles, equipoPrincipalId, responsable, cargoResponsable, areaUbicacion, direccion, procedencia) {
  if (!detalles || typeof detalles !== 'object') return detalles;

  const nuevosDetalles = { ...detalles };
  const perifericosAcrear = [];

  const componentesExistentes = equipoPrincipalId
    ? await prisma.equipoTecnologico.findMany({
        where: { equipoPrincipalId: parseInt(equipoPrincipalId) }
      })
    : [];

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
    const tieneProp = detalles[`tiene${sufijo}`];
    const marca = detalles[`marca${sufijo}`];
    const modelo = detalles[`modelo${sufijo}`];
    const serie = detalles[`serie${sufijo}`];
    let inventario = detalles[`numeroInventario${sufijo}`] ? String(detalles[`numeroInventario${sufijo}`]) : null;

    const existente = componentesExistentes.find(c => (c.tipo || '').toLowerCase() === tipo.toLowerCase());

    if (tieneProp === false) {
      // Si el usuario desmarcó el checkbox explícitamente, desvincular el periférico existente
      if (existente) {
        await prisma.equipoTecnologico.update({
          where: { id: existente.id },
          data: { equipoPrincipalId: null }
        });
      }
    } else if (tieneProp === true || marca || modelo || serie || inventario) {
      if (existente) {
        // Actualizar el periférico existente sin duplicar
        let finalInventario = inventario && inventario.trim() !== '' ? inventario.trim() : existente.numeroInventario;
        if (finalInventario && finalInventario !== existente.numeroInventario) {
          const existeOtro = await prisma.equipoTecnologico.findFirst({
            where: { numeroInventario: finalInventario, id: { not: existente.id } }
          });
          if (existeOtro) finalInventario = `${finalInventario}-1`;
        }

        await prisma.equipoTecnologico.update({
          where: { id: existente.id },
          data: {
            marca: marca !== undefined ? (marca && marca.trim() !== '' ? String(marca) : null) : existente.marca,
            modelo: modelo !== undefined ? (modelo && modelo.trim() !== '' ? String(modelo) : null) : existente.modelo,
            numeroSerie: serie !== undefined ? (serie && serie.trim() !== '' ? String(serie) : null) : existente.numeroSerie,
            numeroInventario: finalInventario || null,
            responsable: responsable || null,
            cargoResponsable: cargoResponsable || null,
            areaUbicacion: areaUbicacion || null,
            direccion: direccion || null,
            procedencia: procedencia || null,
          }
        });
      } else if (marca || modelo || serie || inventario) {
        // Verificar si el periférico ya existe en BD por número de inventario o número de serie
        let coincidenciaEnBd = null;
        if (inventario && inventario.trim() !== '') {
          coincidenciaEnBd = await prisma.equipoTecnologico.findFirst({
            where: {
              numeroInventario: inventario.trim(),
              id: { not: parseInt(equipoPrincipalId) }
            }
          });
        }
        if (!coincidenciaEnBd && serie && serie.trim() !== '') {
          const ignorarSeries = ['S/N', 'SIN SERIE', 'S/S', 'N/A', 'SN', 'SIN NUMERO'];
          if (!ignorarSeries.includes(serie.trim().toUpperCase())) {
            coincidenciaEnBd = await prisma.equipoTecnologico.findFirst({
              where: {
                numeroSerie: serie.trim(),
                id: { not: parseInt(equipoPrincipalId) }
              }
            });
          }
        }

        if (coincidenciaEnBd) {
          // Si ya existe en inventario, lo vinculamos al equipo principal en lugar de duplicarlo
          await prisma.equipoTecnologico.update({
            where: { id: coincidenciaEnBd.id },
            data: {
              equipoPrincipalId: parseInt(equipoPrincipalId),
              marca: marca && marca.trim() !== '' ? String(marca) : coincidenciaEnBd.marca,
              modelo: modelo && modelo.trim() !== '' ? String(modelo) : coincidenciaEnBd.modelo,
              responsable: responsable || coincidenciaEnBd.responsable,
              cargoResponsable: cargoResponsable || coincidenciaEnBd.cargoResponsable,
              areaUbicacion: areaUbicacion || coincidenciaEnBd.areaUbicacion,
              direccion: direccion || coincidenciaEnBd.direccion,
              procedencia: procedencia || coincidenciaEnBd.procedencia,
              estatus: 'Activo'
            }
          });
        } else {
          // Si no existía y tiene datos, crear nuevo
          perifericosAcrear.push({ tipo, marca, modelo, serie, inventario });
        }
      }
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
  const monitoresExistentes = componentesExistentes.filter(c => (c.tipo || '').toLowerCase() === 'monitor');

  if (detalles.tieneMonitores === false) {
    for (const m of monitoresExistentes) {
      await prisma.equipoTecnologico.update({
        where: { id: m.id },
        data: { equipoPrincipalId: null }
      });
    }
  } else if (Array.isArray(detalles.monitores)) {
    for (let i = 0; i < detalles.monitores.length; i++) {
      const monitor = detalles.monitores[i];
      if (monitor.marca || monitor.modelo || monitor.serie || monitor.numeroInventario) {
        const existente = (monitor.id && monitoresExistentes.find(m => m.id === monitor.id)) || monitoresExistentes[i];
        if (existente) {
          await prisma.equipoTecnologico.update({
            where: { id: existente.id },
            data: {
              marca: monitor.marca?.trim() || null,
              modelo: monitor.modelo?.trim() || null,
              numeroSerie: monitor.serie?.trim() || null,
              numeroInventario: monitor.numeroInventario?.trim() || null,
              responsable: responsable || null,
              cargoResponsable: cargoResponsable || null,
              areaUbicacion: areaUbicacion || null,
              direccion: direccion || null,
              procedencia: procedencia || null,
            }
          });
        } else {
          // Verificar si el monitor ya existe en inventario por inventario o serie
          let coincidenciaEnBd = null;
          const invMon = monitor.numeroInventario ? String(monitor.numeroInventario).trim() : null;
          const serMon = monitor.serie ? String(monitor.serie).trim() : null;
          if (invMon) {
            coincidenciaEnBd = await prisma.equipoTecnologico.findFirst({
              where: {
                numeroInventario: invMon,
                id: { not: parseInt(equipoPrincipalId) }
              }
            });
          }
          if (!coincidenciaEnBd && serMon) {
            const ignorarSeries = ['S/N', 'SIN SERIE', 'S/S', 'N/A', 'SN', 'SIN NUMERO'];
            if (!ignorarSeries.includes(serMon.toUpperCase())) {
              coincidenciaEnBd = await prisma.equipoTecnologico.findFirst({
                where: {
                  numeroSerie: serMon,
                  id: { not: parseInt(equipoPrincipalId) }
                }
              });
            }
          }

          if (coincidenciaEnBd) {
            // Vincular el monitor existente al equipo principal
            await prisma.equipoTecnologico.update({
              where: { id: coincidenciaEnBd.id },
              data: {
                equipoPrincipalId: parseInt(equipoPrincipalId),
                marca: monitor.marca?.trim() || coincidenciaEnBd.marca,
                modelo: monitor.modelo?.trim() || coincidenciaEnBd.modelo,
                responsable: responsable || coincidenciaEnBd.responsable,
                cargoResponsable: cargoResponsable || coincidenciaEnBd.cargoResponsable,
                areaUbicacion: areaUbicacion || coincidenciaEnBd.areaUbicacion,
                direccion: direccion || coincidenciaEnBd.direccion,
                procedencia: procedencia || coincidenciaEnBd.procedencia,
                estatus: 'Activo'
              }
            });
          } else {
            perifericosAcrear.push({
              tipo: 'Monitor',
              marca: monitor.marca,
              modelo: monitor.modelo,
              serie: monitor.serie,
              inventario: invMon
            });
          }
        }
      }
    }

    if (monitoresExistentes.length > detalles.monitores.length) {
      for (let i = detalles.monitores.length; i < monitoresExistentes.length; i++) {
        await prisma.equipoTecnologico.update({
          where: { id: monitoresExistentes[i].id },
          data: { equipoPrincipalId: null }
        });
      }
    }
  }

  delete nuevosDetalles.monitores;
  delete nuevosDetalles.tieneMonitores;
  delete nuevosDetalles.cantidadMonitores;
  delete nuevosDetalles.marcaMonitores;
  delete nuevosDetalles.modeloMonitores;
  delete nuevosDetalles.serieMonitores;
  delete nuevosDetalles.numeroInventarioMonitores;

  // 3. Crear en BD
  for (const p of perifericosAcrear) {
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
        equipoPrincipalId: parseInt(equipoPrincipalId),
        detalles: {}
      }
    });
  }

  return nuevosDetalles;
}

// Desglosar un lote agrupado (con cantidad > 1 en detalles) en unidades individuales independientes
const desglosarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await prisma.equipoTecnologico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!equipo) {
      return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    }

    const cantidadActual = Math.max(1, parseInt(equipo.detalles?.cantidad, 10) || 1);
    if (cantidadActual <= 1) {
      return res.status(400).json({ ok: false, error: 'Este registro ya es una unidad individual independiente.' });
    }

    // 1. Actualizar el registro original a cantidad: 1
    const detallesActualizados = { ...(equipo.detalles || {}), cantidad: 1 };
    await prisma.equipoTecnologico.update({
      where: { id: equipo.id },
      data: { detalles: detallesActualizados }
    });

    // 2. Crear las (cantidadActual - 1) unidades restantes individuales
    const faltantes = cantidadActual - 1;
    const ignorarUnicos = ['S/N', 'INF-S/N', 'S/S', 'N/A', 'SIN NUMERO', 'SIN SERIE', 'S/M', 'SN'];
    const invTrim = (equipo.numeroInventario || '').trim().toUpperCase();

    for (let i = 0; i < faltantes; i++) {
      let invParaEste = equipo.numeroInventario || null;
      if (invParaEste && !ignorarUnicos.includes(invTrim)) {
        invParaEste = `${invParaEste}-${i + 2}`;
      }

      await prisma.equipoTecnologico.create({
        data: {
          tipo: equipo.tipo,
          numeroInventario: invParaEste,
          numeroSerie: equipo.numeroSerie,
          marca: equipo.marca,
          modelo: equipo.modelo,
          responsable: equipo.responsable,
          cargoResponsable: equipo.cargoResponsable,
          areaUbicacion: equipo.areaUbicacion,
          direccion: equipo.direccion,
          procedencia: equipo.procedencia,
          estatus: equipo.estatus,
          detalles: detallesActualizados
        }
      });
    }

    res.json({
      ok: true,
      message: `Se desglosó el lote en ${cantidadActual} unidades individuales independientes.`
    });
  } catch (error) {
    console.error('Error al desglosar equipo:', error);
    res.status(500).json({ ok: false, error: 'Error interno al desglosar equipo' });
  }
};

module.exports = {
  obtenerEquipos,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo,
  desglosarEquipo
};
