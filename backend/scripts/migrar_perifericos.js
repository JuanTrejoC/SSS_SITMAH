const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrarPerifericos() {
  console.log('Iniciando migración de periféricos ocultos en "detalles"...');
  
  const equipos = await prisma.equipoTecnologico.findMany({
    where: { detalles: { not: null } }
  });

  let creados = 0;
  let actualizados = 0;

  for (const equipo of equipos) {
    if (!equipo.detalles || typeof equipo.detalles !== 'object') continue;

    const detalles = equipo.detalles;
    const nuevosDetalles = { ...detalles };
    let huboCambios = false;

    const mapeoPerifericos = [
      { tipo: 'Mouse', sufijo: 'Mouse' },
      { tipo: 'Teclado', sufijo: 'Teclado' },
      { tipo: 'Monitor', sufijo: 'Monitores' },
      { tipo: 'Monitor', sufijo: 'Monitor' },
      { tipo: 'Regulador', sufijo: 'Regulador' },
      { tipo: 'No break', sufijo: 'Nobreak' }
    ];
    
    for (const p of mapeoPerifericos) {
      const { tipo, sufijo } = p;
      const marca = detalles[`marca${sufijo}`];
      const modelo = detalles[`modelo${sufijo}`];
      const serie = detalles[`serie${sufijo}`];
      let inventario = detalles[`numeroInventario${sufijo}`] ? String(detalles[`numeroInventario${sufijo}`]) : null;

      if (marca || modelo || serie || inventario) {
        
        // Handle unique inventory number
        if (inventario) {
          let count = 0;
          let newInventario = inventario;
          while (true) {
            const existe = await prisma.equipoTecnologico.findUnique({
              where: { numeroInventario: newInventario }
            });
            if (!existe) break;
            count++;
            newInventario = `${inventario}-${count}`;
          }
          inventario = newInventario;
        }

        const nuevoEquipo = await prisma.equipoTecnologico.create({
          data: {
            tipo: tipo,
            marca: marca ? String(marca) : null,
            modelo: modelo ? String(modelo) : null,
            numeroSerie: serie ? String(serie) : null,
            numeroInventario: inventario,
            responsable: equipo.responsable,
            cargoResponsable: equipo.cargoResponsable,
            areaUbicacion: equipo.areaUbicacion,
            direccion: equipo.direccion,
            procedencia: equipo.procedencia,
            estatus: 'Activo',
            equipoPrincipalId: equipo.id,
            detalles: {}
          }
        });

        console.log(`Creado ${tipo} (ID: ${nuevoEquipo.id}) y asignado a equipo ID: ${equipo.id}`);
        creados++;
        huboCambios = true;

        delete nuevosDetalles[`marca${sufijo}`];
        delete nuevosDetalles[`modelo${sufijo}`];
        delete nuevosDetalles[`serie${sufijo}`];
        delete nuevosDetalles[`numeroInventario${sufijo}`];
        delete nuevosDetalles[`tiene${sufijo}`];
        delete nuevosDetalles[`cantidad${sufijo}`];
      }
    }

    if (huboCambios) {
      await prisma.equipoTecnologico.update({
        where: { id: equipo.id },
        data: { detalles: nuevosDetalles }
      });
      actualizados++;
    }
  }

  console.log(`\nMigración completada con éxito.`);
  console.log(`- Periféricos independientes creados: ${creados}`);
  console.log(`- Equipos originales actualizados (limpiados): ${actualizados}`);
  
  await prisma.$disconnect();
}

migrarPerifericos().catch(async (e) => {
  console.error("Error durante la migración:", e);
  await prisma.$disconnect();
  process.exit(1);
});
