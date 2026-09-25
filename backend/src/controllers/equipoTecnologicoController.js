const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        orderBy: { createdAt: 'desc' }
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

    // Validación de duplicados (ignorando marcadores genéricos como S/N, INF-S/N, etc.)
    const ignorarUnicos = ['S/N', 'INF-S/N', 'S/S', 'N/A', 'SIN NUMERO', 'SIN SERIE', 'S/M', 'SN'];
    const condicionesBusqueda = [];
    const invTrim = (numeroInventario || '').trim().toUpperCase();
    const serieTrim = (numeroSerie || '').trim().toUpperCase();

    if (numeroInventario && !ignorarUnicos.includes(invTrim)) {
      condicionesBusqueda.push({ numeroInventario: numeroInventario.trim() });
    }
    if (numeroSerie && !ignorarUnicos.includes(serieTrim)) {
      condicionesBusqueda.push({ numeroSerie: numeroSerie.trim() });
    }

    if (condicionesBusqueda.length > 0) {
      const existe = await prisma.equipoTecnologico.findFirst({
        where: { OR: condicionesBusqueda }
      });

      if (existe) {
        if (existe.numeroInventario && existe.numeroInventario.toLowerCase() === numeroInventario.trim().toLowerCase()) {
          return res.status(400).json({ ok: false, error: `El número de inventario "${numeroInventario}" ya está registrado en otro equipo.` });
        }
        if (existe.numeroSerie && existe.numeroSerie.toLowerCase() === numeroSerie.trim().toLowerCase()) {
          return res.status(400).json({ ok: false, error: `El número de serie "${numeroSerie}" ya está registrado en otro equipo.` });
        }
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

    // Validación de duplicados, excluyendo el equipo actual (ignorando marcadores genéricos como S/N, INF-S/N, etc.)
    const ignorarUnicos = ['S/N', 'INF-S/N', 'S/S', 'N/A', 'SIN NUMERO', 'SIN SERIE', 'S/M', 'SN'];
    const condicionesBusqueda = [];
    const invTrim = (numeroInventario || '').trim().toUpperCase();
    const serieTrim = (numeroSerie || '').trim().toUpperCase();

    if (numeroInventario && !ignorarUnicos.includes(invTrim)) {
      condicionesBusqueda.push({ numeroInventario: numeroInventario.trim() });
    }
    if (numeroSerie && !ignorarUnicos.includes(serieTrim)) {
      condicionesBusqueda.push({ numeroSerie: numeroSerie.trim() });
    }

    if (condicionesBusqueda.length > 0) {
      const existe = await prisma.equipoTecnologico.findFirst({
        where: {
          id: { not: parseInt(id) },
          OR: condicionesBusqueda
        }
      });

      if (existe) {
        if (existe.numeroInventario && existe.numeroInventario.toLowerCase() === numeroInventario.trim().toLowerCase()) {
          return res.status(400).json({ ok: false, error: `El número de inventario "${numeroInventario}" ya está registrado en otro equipo.` });
        }
        if (existe.numeroSerie && existe.numeroSerie.toLowerCase() === numeroSerie.trim().toLowerCase()) {
          return res.status(400).json({ ok: false, error: `El número de serie "${numeroSerie}" ya está registrado en otro equipo.` });
        }
      }
    }

    const equipoActualizado = await prisma.equipoTecnologico.update({
      where: { id: parseInt(id) },
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
        data: { detalles: detallesLimpios }
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
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};

async function procesarPerifericosDeDetalles(detalles, equipoPrincipalId, responsable, cargoResponsable, areaUbicacion, direccion, procedencia) {
  if (!detalles || typeof detalles !== 'object') return detalles;

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
        equipoPrincipalId,
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
