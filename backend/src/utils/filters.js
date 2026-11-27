function buildReporteFilters(query) {
  const { keyword, estado, prioridad, mes, anio, dia, fecha, semana } = query;
  const where = {};

  if (estado) where.estado = estado;
  if (prioridad) where.prioridad = prioridad;

  const diaSeleccionado = dia || fecha;
  if (diaSeleccionado) {
    const [y, m, d] = diaSeleccionado.split('-').map(Number);
    if (y && m && d) {
      const inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
      const fin = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
      where.createdAt = { gte: inicio, lt: fin };
    }
  } else if (semana) {
    const match = semana.match(/^(\d{4})-W(\d{1,2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const week = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay() || 7;
      const lunesSemana1 = new Date(year, 0, 4 - dayOfWeek + 1);
      const inicio = new Date(lunesSemana1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: inicio, lt: fin };
    }
  } else if (mes && anio) {
    const m = Number(mes);
    const y = Number(anio);
    const inicio = new Date(y, m - 1, 1);
    const fin = new Date(y, m, 1);
    where.createdAt = { gte: inicio, lt: fin };
  } else if (anio) {
    const y = Number(anio);
    where.createdAt = {
      gte: new Date(`${y}-01-01`),
      lt: new Date(`${y + 1}-01-01`),
    };
  }

  return { keyword, where };
}

function applyKeywordOficina(where, keyword) {
  if (!keyword) return where;

  return {
    ...where,
    OR: [
      { solicitante: { contains: keyword } },
      { email: { contains: keyword } },
      { equipo: { contains: keyword } },
      { folio: { contains: keyword } },
      { descripcion: { contains: keyword } },
    ],
  };
}

function applyKeywordSemaforo(where, keyword) {
  if (!keyword) return where;

  return {
    ...where,
    OR: [
      { jefeTurno: { contains: keyword } },
      { folio: { contains: keyword } },
      { descripcion: { contains: keyword } },
    ],
  };
}

function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = {
  buildReporteFilters,
  applyKeywordOficina,
  applyKeywordSemaforo,
  parsePagination,
};
