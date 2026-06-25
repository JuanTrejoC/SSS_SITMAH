const prisma = require('../config/db');

async function registrarHistorial({ usuarioId, tipoReporte, reporteId, estadoAnterior, estadoNuevo, comentario }) {
  return prisma.historialReporte.create({
    data: {
      usuarioId,
      tipoReporte,
      reporteId,
      estadoAnterior,
      estadoNuevo,
      comentario,
    },
  });
}

async function obtenerHistorial(tipoReporte, reporteId) {
  return prisma.historialReporte.findMany({
    where: { tipoReporte, reporteId },
    orderBy: { fecha: 'desc' },
    include: {
      usuario: { select: { id: true, nombre: true, username: true } },
    },
  });
}

module.exports = { registrarHistorial, obtenerHistorial };
