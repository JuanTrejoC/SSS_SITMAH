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
  // ✅ Estaciones: por ID tal cual tu lista
  estaciones: () => prisma.estacion.findMany({ 
    where: { activo: true }, 
    orderBy: { id: 'asc' }
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

module.exports = { listarCatalogo };