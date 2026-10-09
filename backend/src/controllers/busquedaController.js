const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

async function buscar(req, res) {
  const query = (req.query.q || '').trim();
  const contexto = (req.query.contexto || '').toLowerCase();
  const rolUsuario = req.usuario?.rol || '';
  
  // Es modo infraestructura si lo pide el contexto de la URL o si el usuario tiene rol de infraestructura
  const esModoInfra = contexto === 'infraestructura' || rolUsuario === 'infraestructura';

  if (!query || query.length < 2) {
    return ok(res, {
      reportesInfraestructura: [],
      reportesOficina: [],
      reportesSemaforo: [],
      equiposTecnologicos: [],
      herramientas: [],
      existencias: [],
      resguardos: [],
      mobiliario: [],
      totalResultados: 0,
      modo: esModoInfra ? 'infraestructura' : 'general'
    });
  }

  try {
    // Si estamos en MODO INFRAESTRUCTURA
    if (esModoInfra) {
      const [reportesInfra, herramientas, existenciasInfra] = await Promise.all([
        // 1. Solo reportes de Infraestructura (RI- o categoria Infraestructura)
        prisma.reporteOficina.findMany({
          where: {
            AND: [
              {
                OR: [
                  { folio: { startsWith: 'RI' } },
                  { categoria: { nombre: { contains: 'Infraestructura' } } }
                ]
              },
              {
                OR: [
                  { folio: { contains: query } },
                  { solicitante: { contains: query } },
                  { equipo: { contains: query } },
                  { numeroSerie: { contains: query } },
                  { descripcion: { contains: query } }
                ]
              }
            ]
          },
          include: {
            area: { select: { nombre: true } },
            sede: { select: { nombre: true } },
            categoria: { select: { nombre: true } }
          },
          take: 6,
          orderBy: { id: 'desc' }
        }),

        // 2. Solo Herramientas de Taller / Infraestructura
        prisma.EquipoTecnologico.findMany({
          where: {
            AND: [
              {
                OR: [
                  { tipo: { contains: 'herramienta' } },
                  { procedencia: { contains: 'infra' } },
                  { areaUbicacion: { contains: 'infra' } },
                  { tipo: 'herramienta_infra' },
                  { tipo: 'herramienta_tec' }
                ]
              },
              {
                OR: [
                  { numeroInventario: { contains: query } },
                  { numeroSerie: { contains: query } },
                  { tipo: { contains: query } },
                  { marca: { contains: query } },
                  { modelo: { contains: query } },
                  { responsable: { contains: query } },
                  { areaUbicacion: { contains: query } }
                ]
              }
            ]
          },
          take: 6,
          orderBy: { id: 'desc' }
        }),

        // 3. Solo existencias / refacciones de Infraestructura
        prisma.existenciaComponente.findMany({
          where: {
            AND: [
              { tipoInventario: 'infraestructura' },
              {
                OR: [
                  { nombre: { contains: query } },
                  { marca: { contains: query } },
                  { modelo: { contains: query } },
                  { numeroSerie: { contains: query } },
                  { numeroInventario: { contains: query } },
                  { categoria: { contains: query } }
                ]
              }
            ]
          },
          take: 6,
          orderBy: { id: 'desc' }
        })
      ]);

      const totalResultados = reportesInfra.length + herramientas.length + existenciasInfra.length;

      return ok(res, {
        reportesInfraestructura: reportesInfra,
        reportesOficina: [],
        reportesSemaforo: [],
        equiposTecnologicos: [],
        herramientas,
        existencias: existenciasInfra,
        resguardos: [],
        mobiliario: [],
        totalResultados,
        modo: 'infraestructura'
      });
    }

    // ==========================================================
    // MODO GENERAL (ADMINISTRADOR GLOBAL)
    // ==========================================================
    const [
      reportesOficina,
      reportesInfraestructura,
      reportesSemaforo,
      equiposTecnologicos,
      herramientas,
      existencias,
      resguardos,
      mobiliario
    ] = await Promise.all([
      // 1. Reportes de Oficina (excluyendo infraestructura)
      prisma.reporteOficina.findMany({
        where: {
          AND: [
            {
              NOT: {
                OR: [
                  { folio: { startsWith: 'RI' } },
                  { categoria: { nombre: { contains: 'Infraestructura' } } }
                ]
              }
            },
            {
              OR: [
                { folio: { contains: query } },
                { solicitante: { contains: query } },
                { equipo: { contains: query } },
                { numeroSerie: { contains: query } },
                { descripcion: { contains: query } }
              ]
            }
          ]
        },
        include: {
          area: { select: { nombre: true } },
          sede: { select: { nombre: true } },
          categoria: { select: { nombre: true } }
        },
        take: 5,
        orderBy: { id: 'desc' }
      }),

      // 2. Reportes de Infraestructura (separados claramente)
      prisma.reporteOficina.findMany({
        where: {
          AND: [
            {
              OR: [
                { folio: { startsWith: 'RI' } },
                { categoria: { nombre: { contains: 'Infraestructura' } } }
              ]
            },
            {
              OR: [
                { folio: { contains: query } },
                { solicitante: { contains: query } },
                { equipo: { contains: query } },
                { numeroSerie: { contains: query } },
                { descripcion: { contains: query } }
              ]
            }
          ]
        },
        include: {
          area: { select: { nombre: true } },
          sede: { select: { nombre: true } },
          categoria: { select: { nombre: true } }
        },
        take: 5,
        orderBy: { id: 'desc' }
      }),

      // 3. Reportes de Semáforo
      prisma.reporteSemaforo.findMany({
        where: {
          OR: [
            { folio: { contains: query } },
            { jefeTurno: { contains: query } },
            { descripcion: { contains: query } },
            { crucero: { nombre: { contains: query } } },
            { estacion: { nombre: { contains: query } } }
          ]
        },
        include: {
          crucero: { select: { nombre: true } },
          estacion: { select: { nombre: true } }
        },
        take: 5,
        orderBy: { id: 'desc' }
      }),

      // 4. Equipos Tecnológicos (computadoras, servidores, redes - sin herramientas)
      prisma.EquipoTecnologico.findMany({
        where: {
          AND: [
            {
              NOT: {
                tipo: { contains: 'herramienta' }
              }
            },
            {
              OR: [
                { numeroInventario: { contains: query } },
                { numeroSerie: { contains: query } },
                { tipo: { contains: query } },
                { marca: { contains: query } },
                { modelo: { contains: query } },
                { responsable: { contains: query } },
                { areaUbicacion: { contains: query } }
              ]
            }
          ]
        },
        take: 5,
        orderBy: { id: 'desc' }
      }),

      // 5. Herramientas de Taller
      prisma.EquipoTecnologico.findMany({
        where: {
          AND: [
            {
              OR: [
                { tipo: { contains: 'herramienta' } },
                { procedencia: { contains: 'infra' } },
                { tipo: 'herramienta_infra' },
                { tipo: 'herramienta_tec' }
              ]
            },
            {
              OR: [
                { numeroInventario: { contains: query } },
                { numeroSerie: { contains: query } },
                { tipo: { contains: query } },
                { marca: { contains: query } },
                { modelo: { contains: query } },
                { responsable: { contains: query } }
              ]
            }
          ]
        },
        take: 5,
        orderBy: { id: 'desc' }
      }),

      // 6. Existencias / Piezas en Stock
      prisma.existenciaComponente.findMany({
        where: {
          OR: [
            { nombre: { contains: query } },
            { marca: { contains: query } },
            { modelo: { contains: query } },
            { numeroSerie: { contains: query } },
            { numeroInventario: { contains: query } },
            { categoria: { contains: query } }
          ]
        },
        take: 5,
        orderBy: { id: 'desc' }
      }),

      // 7. Resguardos
      prisma.resguardo.findMany({
        where: {
          OR: [
            { nombreResguardante: { contains: query } },
            { numeroSeriePdf: { contains: query } },
            { descripcionPdf: { contains: query } },
            { area: { contains: query } }
          ]
        },
        take: 5,
        orderBy: { id: 'desc' }
      }),

      // 8. Mobiliario
      prisma.inventarioMobiliario.findMany({
        where: {
          OR: [
            { bien: { contains: query } },
            { numeroInventario: { contains: query } },
            { numeroSerie: { contains: query } },
            { nombreResguardante: { contains: query } },
            { area: { contains: query } }
          ]
        },
        take: 5,
        orderBy: { id: 'desc' }
      })
    ]);

    const totalResultados =
      reportesOficina.length +
      reportesInfraestructura.length +
      reportesSemaforo.length +
      equiposTecnologicos.length +
      herramientas.length +
      existencias.length +
      resguardos.length +
      mobiliario.length;

    ok(res, {
      reportesOficina,
      reportesInfraestructura,
      reportesSemaforo,
      equiposTecnologicos,
      herramientas,
      existencias,
      resguardos,
      mobiliario,
      totalResultados,
      modo: 'general'
    });
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    fail(res, 'Error al realizar la búsqueda global', 500);
  }
}

module.exports = { buscar };
