const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function construirCondicionesBusqueda(search) {
  if (!search || !search.trim()) return [];
  const raw = search.trim();
  const terms = new Set([raw]);
  const compacto = raw.replace(/\s+/g, '');
  if (compacto) terms.add(compacto);
  const conEspacio = raw.replace(/(\d+)(gb|tb|mb|ghz|mhz)/gi, '$1 $2');
  if (conEspacio) terms.add(conEspacio);

  const orConditions = [];
  for (const term of terms) {
    orConditions.push(
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

      // Especificaciones técnicas de escritorio y equipos en JSON detalles
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
    );
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
        detalles: detalles || {}
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
        }
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
          }
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
        // Si no existía y tiene datos, crear nuevo
        perifericosAcrear.push({ tipo, marca, modelo, serie, inventario });
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
          perifericosAcrear.push({
            tipo: 'Monitor',
            marca: monitor.marca,
            modelo: monitor.modelo,
            serie: monitor.serie,
            inventario: monitor.numeroInventario ? String(monitor.numeroInventario) : null
          });
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

module.exports = {
  obtenerEquipos,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo
};
