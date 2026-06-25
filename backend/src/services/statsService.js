const prisma = require('../config/db');

async function obtenerEstadisticas() {
  const [
    totalOficina,
    totalSemaforo,
    enProcesoOficina,
    enProcesoSemaforo,
    resueltosOficina,
    resueltosSemaforo,
    resueltosOficinaData,
    resueltosSemaforoData,
    oficinaPorMes,
    semaforoPorMes,
  ] = await Promise.all([
    prisma.reporteOficina.count(),
    prisma.reporteSemaforo.count(),
    prisma.reporteOficina.count({ where: { estado: 'en_proceso' } }),
    prisma.reporteSemaforo.count({ where: { estado: 'en_proceso' } }),
    prisma.reporteOficina.count({ where: { estado: 'resuelto' } }),
    prisma.reporteSemaforo.count({ where: { estado: 'resuelto' } }),
    prisma.reporteOficina.findMany({
      where: { estado: 'resuelto', fechaResolucion: { not: null } },
      select: { createdAt: true, fechaResolucion: true },
    }),
    prisma.reporteSemaforo.findMany({
      where: { estado: 'resuelto', fechaResolucion: { not: null } },
      select: { createdAt: true, fechaResolucion: true },
    }),
    prisma.reporteOficina.findMany({
      where: { createdAt: { gte: hace12Meses() } },
      select: { createdAt: true },
    }),
    prisma.reporteSemaforo.findMany({
      where: { createdAt: { gte: hace12Meses() } },
      select: { createdAt: true },
    }),
  ]);

  const todosResueltos = [...resueltosOficinaData, ...resueltosSemaforoData];
  let tiempoPromedioHoras = 0;

  if (todosResueltos.length > 0) {
    const totalMs = todosResueltos.reduce((acc, r) => {
      return acc + (r.fechaResolucion.getTime() - r.createdAt.getTime());
    }, 0);
    tiempoPromedioHoras = Math.round((totalMs / todosResueltos.length / 3600000) * 10) / 10;
  }

  const porMesMap = {};

  [...oficinaPorMes, ...semaforoPorMes].forEach((r) => {
    const mes = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
    porMesMap[mes] = (porMesMap[mes] || 0) + 1;
  });

  const porMes = Object.entries(porMesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, cantidad]) => ({ mes, cantidad }));

  const abiertosOficina = await prisma.reporteOficina.count({ where: { estado: 'abierto' } });
  const abiertosSemaforo = await prisma.reporteSemaforo.count({ where: { estado: 'abierto' } });

  return {
    totales: {
      total: totalOficina + totalSemaforo,
      en_proceso: enProcesoOficina + enProcesoSemaforo,
      resueltos: resueltosOficina + resueltosSemaforo,
    },
    tiempo_promedio_horas: tiempoPromedioHoras,
    por_mes: porMes,
    distribucion: {
      por_tipo: { oficina: totalOficina, semaforo: totalSemaforo },
      por_estado: {
        abierto: abiertosOficina + abiertosSemaforo,
        en_proceso: enProcesoOficina + enProcesoSemaforo,
        resuelto: resueltosOficina + resueltosSemaforo,
      },
    },
    oficina: {
      total: totalOficina,
      abierto: abiertosOficina,
      en_proceso: enProcesoOficina,
      resuelto: resueltosOficina
    },
    semaforo: {
      total: totalSemaforo,
      abierto: abiertosSemaforo,
      en_proceso: enProcesoSemaforo,
      resuelto: resueltosSemaforo
    }
  };
}

function hace12Meses() {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return d;
}

module.exports = { obtenerEstadisticas };
