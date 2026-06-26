const prisma = require('../config/db');

async function obtenerEstadisticas(filtroTiempo = 'dia') {
  let fechaFiltro = null;
  const ahora = new Date();

  if (filtroTiempo === 'dia') {
    fechaFiltro = new Date(ahora.setHours(0, 0, 0, 0));
  } else if (filtroTiempo === 'semana') {
    const day = ahora.getDay() || 7;
    if (day !== 1) ahora.setHours(-24 * (day - 1));
    fechaFiltro = new Date(ahora.setHours(0, 0, 0, 0));
  } else if (filtroTiempo === 'mes') {
    fechaFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  } else if (filtroTiempo === 'año') {
    fechaFiltro = new Date(ahora.getFullYear(), 0, 1);
  }

  const whereOficina = fechaFiltro ? { createdAt: { gte: fechaFiltro } } : {};
  const whereSemaforo = fechaFiltro ? { createdAt: { gte: fechaFiltro } } : {};

  const [
    totalOficina,
    totalSemaforo,
    enProcesoOficina,
    enProcesoSemaforo,
    resueltosOficina,
    resueltosSemaforo,
    resueltosOficinaData,
    resueltosSemaforoData,
    reportesOficinaList,
    reportesSemaforoList,
  ] = await Promise.all([
    prisma.reporteOficina.count({ where: whereOficina }),
    prisma.reporteSemaforo.count({ where: whereSemaforo }),
    prisma.reporteOficina.count({ where: { ...whereOficina, estado: 'en_proceso' } }),
    prisma.reporteSemaforo.count({ where: { ...whereSemaforo, estado: 'en_proceso' } }),
    prisma.reporteOficina.count({ where: { ...whereOficina, estado: 'resuelto' } }),
    prisma.reporteSemaforo.count({ where: { ...whereSemaforo, estado: 'resuelto' } }),
    prisma.reporteOficina.findMany({
      where: { ...whereOficina, estado: 'resuelto', fechaResolucion: { not: null } },
      select: { createdAt: true, fechaResolucion: true },
    }),
    prisma.reporteSemaforo.findMany({
      where: { ...whereSemaforo, estado: 'resuelto', fechaResolucion: { not: null } },
      select: { createdAt: true, fechaResolucion: true },
    }),
    prisma.reporteOficina.findMany({
      where: whereOficina,
      include: { categoria: true, cargo: true, area: true, sede: true }
    }),
    prisma.reporteSemaforo.findMany({
      where: whereSemaforo,
      include: { tipoFalla: true, crucero: true, estacion: true }
    })
  ]);

  const todosResueltos = [...resueltosOficinaData, ...resueltosSemaforoData];
  let tiempoPromedioHoras = 0;

  if (todosResueltos.length > 0) {
    const totalMs = todosResueltos.reduce((acc, r) => {
      return acc + (r.fechaResolucion.getTime() - r.createdAt.getTime());
    }, 0);
    tiempoPromedioHoras = Math.round((totalMs / todosResueltos.length / 3600000) * 10) / 10;
  }

  const abiertosOficina = await prisma.reporteOficina.count({ where: { ...whereOficina, estado: 'abierto' } });
  const abiertosSemaforo = await prisma.reporteSemaforo.count({ where: { ...whereSemaforo, estado: 'abierto' } });

  const reportes = [
    ...reportesOficinaList.map(r => ({
      id: r.id,
      tipo: 'Oficina',
      folio: r.folio || `OFI-${r.id}`,
      solicitante: r.solicitante,
      categoria: r.categoria?.nombre || 'N/A',
      cargo: r.cargo?.nombre || 'No especificado',
      sede: r.sede?.nombre || 'N/A',
      area: r.area?.nombre || 'N/A',
      equipo: r.equipo || 'N/A',
      prioridad: r.prioridad,
      estado: r.estado,
      fecha: r.createdAt
    })),
    ...reportesSemaforoList.map(r => ({
      id: r.id,
      tipo: 'Semáforo',
      folio: r.folio || `SEM-${r.id}`,
      solicitante: r.jefeTurno,
      notas: r.descripcion,
      crucero: r.crucero?.nombre || 'N/A',
      estacion: r.estacion?.nombre || 'N/A',
      tipoFalla: r.tipoFalla?.nombre || 'N/A',
      prioridad: r.prioridad,
      estado: r.estado,
      fecha: r.createdAt,
      horaDano: r.horaDano
    }))
  ].sort((a, b) => b.fecha - a.fecha);

  return {
    totales: {
      total: totalOficina + totalSemaforo,
      en_proceso: enProcesoOficina + enProcesoSemaforo,
      resueltos: resueltosOficina + resueltosSemaforo,
    },
    tiempo_promedio_horas: tiempoPromedioHoras,
    por_mes: [],
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
    },
    reportes: reportes
  };
}

module.exports = { obtenerEstadisticas };
