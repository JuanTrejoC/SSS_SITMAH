const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los equipos con paginación y búsqueda
const obtenerEquipos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const tipo = req.query.tipo || '';
    
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { marca: { contains: search } },
        { modelo: { contains: search } },
        { numeroInventario: { contains: search } },
        { numeroSerie: { contains: search } },
        { responsable: { contains: search } },
      ];
    }
    
    if (tipo) {
      where.tipo = tipo;
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
      detalles
    } = req.body;

    if (!tipo) {
      return res.status(400).json({ ok: false, error: 'El tipo de equipo es obligatorio.' });
    }

    // Validación de duplicados
    const condicionesBusqueda = [];
    if (numeroInventario) {
      condicionesBusqueda.push({ numeroInventario });
    }
    if (numeroSerie) {
      condicionesBusqueda.push({ numeroSerie });
    }

    if (condicionesBusqueda.length > 0) {
      const existe = await prisma.equipoTecnologico.findFirst({
        where: { OR: condicionesBusqueda }
      });

      if (existe) {
        if (existe.numeroInventario === numeroInventario && numeroInventario) {
          return res.status(400).json({ ok: false, error: `El número de inventario ${numeroInventario} ya está registrado en otro equipo.` });
        }
        if (existe.numeroSerie === numeroSerie && numeroSerie) {
          return res.status(400).json({ ok: false, error: `El número de serie ${numeroSerie} ya está registrado en otro equipo.` });
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
        detalles: detalles || {}
      }
    });

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
      detalles
    } = req.body;

    // Verificar si el equipo existe
    const equipoExistente = await prisma.equipoTecnologico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!equipoExistente) {
      return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    }

    // Validación de duplicados, excluyendo el equipo actual
    const condicionesBusqueda = [];
    if (numeroInventario) {
      condicionesBusqueda.push({ numeroInventario });
    }
    if (numeroSerie) {
      condicionesBusqueda.push({ numeroSerie });
    }

    if (condicionesBusqueda.length > 0) {
      const existe = await prisma.equipoTecnologico.findFirst({
        where: {
          id: { not: parseInt(id) },
          OR: condicionesBusqueda
        }
      });

      if (existe) {
        if (existe.numeroInventario === numeroInventario && numeroInventario) {
          return res.status(400).json({ ok: false, error: `El número de inventario ${numeroInventario} ya está registrado en otro equipo.` });
        }
        if (existe.numeroSerie === numeroSerie && numeroSerie) {
          return res.status(400).json({ ok: false, error: `El número de serie ${numeroSerie} ya está registrado en otro equipo.` });
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
        detalles: detalles || {}
      }
    });

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

module.exports = {
  obtenerEquipos,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo
};
