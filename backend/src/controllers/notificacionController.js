const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

const filtroExcluirInfra = {
  NOT: {
    OR: [
      { folio: { startsWith: 'RI' } },
      { categoria: { nombre: { contains: 'Infraestructura' } } }
    ]
  }
};

const filtroSoloInfra = {
  OR: [
    { folio: { startsWith: 'RI' } },
    { categoria: { nombre: { contains: 'Infraestructura' } } }
  ]
};

async function obtenerNotificaciones(req, res) {
  try {
    const rolUsuario = req.usuario?.rol;

    if (rolUsuario === 'infraestructura') {
      const filtroInfraActivos = {
        ...filtroSoloInfra,
        estado: { in: ['abierto', 'en_proceso'] }
      };

      const [reportesInfra, pendientesInfra] = await Promise.all([
        prisma.reporteOficina.findMany({
          where: filtroInfraActivos,
          take: 50,
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
        prisma.reporteOficina.count({
          where: filtroInfraActivos,
        }),
      ]);

      const notifInfra = reportesInfra.map((r) => ({
        id: `infra-${r.id}`,
        reporteId: r.id,
        tipo: 'infraestructura',
        tipoLabel: 'Infraestructura',
        folio: r.folio || `RI-${r.id}`,
        solicitante: r.solicitante || 'Usuario',
        detalle: r.categoria?.nombre || r.descripcion || 'Incidencia de infraestructura',
        ubicacion: r.sede?.nombre || r.area?.nombre || 'Instalaciones',
        prioridad: r.prioridad || 'media',
        estado: r.estado || 'abierto',
        createdAt: r.createdAt,
        ruta: `/dashboard-infraestructura?id=${r.id}`,
      }));

      return ok(res, {
        notificaciones: notifInfra,
        resumen: {
          totalPendientes: pendientesInfra,
          pendientesInfra,
        },
      });
    }

    const filtroOficinaActivos = {
      ...filtroExcluirInfra,
      estado: { in: ['abierto', 'en_proceso'] }
    };

    const filtroSemaforoActivos = {
      estado: { in: ['abierto', 'en_proceso'] }
    };

    const [reportesOficina, reportesSemaforo, pendientesOficina, pendientesSemaforo] = await Promise.all([
      prisma.reporteOficina.findMany({
        where: filtroOficinaActivos,
        take: 50,
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
        where: filtroSemaforoActivos,
        take: 50,
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
        where: filtroOficinaActivos,
      }),
      prisma.reporteSemaforo.count({
        where: filtroSemaforoActivos,
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
