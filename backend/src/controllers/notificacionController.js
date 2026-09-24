const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

async function obtenerNotificaciones(req, res) {
  try {
    const [reportesOficina, reportesSemaforo, pendientesOficina, pendientesSemaforo] = await Promise.all([
      prisma.reporteOficina.findMany({
        take: 20,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          folio: true,
          solicitante: true,
          prioridad: true,
          estado: true,
          createdAt: true,
          descripcion: true,
          categoria: { select: { nombre: true } },
          area: { select: { nombre: true } },
          sede: { select: { nombre: true } },
        },
      }),
      prisma.reporteSemaforo.findMany({
        take: 20,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          folio: true,
          jefeTurno: true,
          prioridad: true,
          estado: true,
          createdAt: true,
          descripcion: true,
          crucero: { select: { nombre: true } },
          estacion: { select: { nombre: true } },
          tipoFalla: { select: { nombre: true } },
        },
      }),
      prisma.reporteOficina.count({
        where: { estado: { in: ['abierto', 'en_proceso'] } },
      }),
      prisma.reporteSemaforo.count({
        where: { estado: { in: ['abierto', 'en_proceso'] } },
      }),
    ]);

    const notifOficinas = reportesOficina.map((r) => ({
      id: `oficina-${r.id}`,
      reporteId: r.id,
      tipo: 'oficina',
      tipoLabel: 'Tecnológico',
      folio: r.folio || `OF-${r.id}`,
      solicitante: r.solicitante || 'Usuario',
      detalle: r.categoria?.nombre || r.descripcion || 'Incidencia tecnológica',
      ubicacion: r.sede?.nombre || r.area?.nombre || 'Oficinas',
      prioridad: r.prioridad || 'media',
      estado: r.estado || 'abierto',
      createdAt: r.createdAt,
      ruta: `/dashboard-oficinas?id=${r.id}`,
    }));

    const notifSemaforos = reportesSemaforo.map((r) => ({
      id: `semaforo-${r.id}`,
      reporteId: r.id,
      tipo: 'semaforo',
      tipoLabel: 'Semafórico',
      folio: r.folio || `SEM-${r.id}`,
      solicitante: r.jefeTurno || 'Jefe de turno',
      detalle: r.tipoFalla?.nombre || r.descripcion || 'Falla semafórica',
      ubicacion: r.crucero?.nombre || r.estacion?.nombre || 'Vía pública',
      prioridad: r.prioridad || 'alta',
      estado: r.estado || 'abierto',
      createdAt: r.createdAt,
      ruta: `/dashboard-semaforos?id=${r.id}`,
    }));

    const todas = [...notifOficinas, ...notifSemaforos].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return ok(res, {
      notificaciones: todas,
      resumen: {
        totalPendientes: pendientesOficina + pendientesSemaforo,
        pendientesOficina,
        pendientesSemaforo,
      },
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return fail(res, `Error al obtener notificaciones: ${error.message}`);
  }
}

module.exports = {
  obtenerNotificaciones,
};
