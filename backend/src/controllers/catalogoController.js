const prisma = require('../config/db');
const { ok } = require('../utils/response');

// Función auxiliar para ordenar dejando "Otro" al final
function ordenarConOtroAlFinal(lista) {
  return lista.sort((a, b) => {
    const esOtroA = a.nombre.trim().toLowerCase().startsWith('otro');
    const esOtroB = b.nombre.trim().toLowerCase().startsWith('otro');

    if (esOtroA && !esOtroB) return 1;   // "Otro" va después
    if (!esOtroA && esOtroB) return -1;  // Cualquier otro va antes
    // El resto ordenado alfabéticamente
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  });
}

const catalogosPublicos = {
  areas: () => prisma.area.findMany({ 
    where: { activo: true }, 
    orderBy: { nombre: 'asc' }
  }),
  subdirecciones: () => prisma.subdireccion.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' }
  }),
  sedes: () => prisma.sede.findMany({ 
    where: { activo: true }, 
    orderBy: { nombre: 'asc' }
  }),
  // ✅ Categorías: ordenadas + "Otro" al final
  categorias: async () => {
    const lista = await prisma.categoria.findMany({ where: { activo: true } });
    return ordenarConOtroAlFinal(lista);
  },
  // ✅ Cargos: ordenados alfabéticamente
  cargos: () => prisma.cargo.findMany({ 
    where: { activo: true }, 
    orderBy: { nombre: 'asc' }
  }),
  // ✅ Estaciones: por ID, con cruceros asignados
  estaciones: () => prisma.estacion.findMany({ 
    where: { activo: true }, 
    orderBy: { id: 'asc' },
    include: {
      cruceros: {
        include: { crucero: true }
      }
    }
  }),
  // ✅ Cruceros: por ID tal cual tu lista
  cruceros: () => prisma.crucero.findMany({ 
    where: { activo: true }, 
    orderBy: { id: 'asc' }
  }),
  // ✅ Tipos de falla: ordenados + "Otro" al final
  'tipos-falla': async () => {
    const lista = await prisma.tipoFalla.findMany({ where: { activo: true } });
    return ordenarConOtroAlFinal(lista);
  },
};

async function listarCatalogo(req, res) {
  const { tipo } = req.params;
  const fn = catalogosPublicos[tipo];
  if (!fn) return res.status(404).json({ ok: false, error: 'Catálogo no encontrado' });

  const items = await fn();
  ok(res, items);
}

async function obtenerEquiposPorResponsable(req, res) {
  const nombreRaw = req.query.nombre || req.query.responsable || req.query.search || '';
  const nombre = String(nombreRaw).trim();
  if (!nombre || nombre.length < 2) {
    return ok(res, []);
  }

  // Extraer palabras significativas (mínimo 2 caracteres)
  const words = nombre
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2);

  let equipos = [];

  if (words.length > 0) {
    // 1. Intentar coincidencia con todas las palabras (ej. "Israel" y "Moreno")
    equipos = await prisma.equipoTecnologico.findMany({
      where: {
        AND: words.map(w => ({ responsable: { contains: w } })),
        estatus: { notIn: ['Baja', 'baja', 'Desincorporado', 'desincorporado'] }
      },
      select: {
        id: true,
        tipo: true,
        numeroInventario: true,
        numeroSerie: true,
        marca: true,
        modelo: true,
        responsable: true,
        cargoResponsable: true,
        areaUbicacion: true,
        estatus: true,
        componentes: {
          where: {
            estatus: { notIn: ['Baja', 'baja', 'Desincorporado', 'desincorporado'] }
          },
          select: {
            id: true,
            tipo: true,
            numeroInventario: true,
            numeroSerie: true,
            marca: true,
            modelo: true,
            estatus: true
          }
        }
      },
      orderBy: [
        { tipo: 'asc' },
        { numeroInventario: 'asc' }
      ]
    });

    // 2. Si no hubo resultados con todas las palabras, intentar con palabras principales (longitud >= 4)
    if (equipos.length === 0 && words.length > 1) {
      const palabrasLargas = words.filter(w => w.length >= 4);
      if (palabrasLargas.length > 0) {
        equipos = await prisma.equipoTecnologico.findMany({
          where: {
            OR: palabrasLargas.map(w => ({ responsable: { contains: w } })),
            estatus: { notIn: ['Baja', 'baja', 'Desincorporado', 'desincorporado'] }
          },
          select: {
            id: true,
            tipo: true,
            numeroInventario: true,
            numeroSerie: true,
            marca: true,
            modelo: true,
            responsable: true,
            cargoResponsable: true,
            areaUbicacion: true,
            estatus: true,
            componentes: {
              where: {
                estatus: { notIn: ['Baja', 'baja', 'Desincorporado', 'desincorporado'] }
              },
              select: {
                id: true,
                tipo: true,
                numeroInventario: true,
                numeroSerie: true,
                marca: true,
                modelo: true,
                estatus: true
              }
            }
          },
          orderBy: [
            { tipo: 'asc' },
            { numeroInventario: 'asc' }
          ]
        });
      }
    }
  }

  return ok(res, equipos);
}

module.exports = { listarCatalogo, obtenerEquiposPorResponsable };