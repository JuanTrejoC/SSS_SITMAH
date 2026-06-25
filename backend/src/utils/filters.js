function buildReporteFilters(query) {
  const { keyword, estado, prioridad, mes, anio } = query;
  const where = {};

  if (estado) where.estado = estado;
  if (prioridad) where.prioridad = prioridad;

  if (mes && anio) {
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
