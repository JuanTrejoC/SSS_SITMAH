const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function updateDB() {
  // Update Optiplex 7090 to have full specs
  await prisma.equipoTecnologico.update({
    where: { id: 9 },
    data: {
      tipo: 'escritorio',
      responsable: 'Carlos Gómez',
      cargoResponsable: 'Desarrollador',
      detalles: {
        ram: '32GB',
        procesador: 'Intel Core i9-11900',
        almacenamiento: '1TB',
        tipoAlmacenamiento: 'NVMe SSD',
        sistemaOperativo: 'Windows 11 Pro',
        tarjetaGrafica: 'Integrada',
        tieneTeclado: true,
        marcaTeclado: 'Dell',
        modeloTeclado: 'KB216',
        serieTeclado: 'CN-0DJ425',
        numeroInventarioTeclado: 'INV-TEC-099',
        tieneMouse: true,
        marcaMouse: 'Dell',
        modeloMouse: 'MS116',
        serieMouse: 'CN-009R56',
        numeroInventarioMouse: 'INV-MOU-099',
        tieneMonitores: true,
        cantidadMonitores: '1',
        monitores: [{
          marca: 'Dell',
          modelo: 'P2419H',
          serie: 'CN-0XJ123',
          numeroInventario: 'INV-MON-099'
        }]
      }
    }
  });

  // Update MSI Thin15 to have a charger
  await prisma.equipoTecnologico.update({
    where: { id: 11 },
    data: {
      detalles: {
        ram: '16GB',
        red: 'ambos',
        procesador: 'Intel Core i7',
        almacenamiento: '512GB',
        tarjetaGrafica: 'RTX 4050',
        sistemaOperativo: 'Windows 11 Pro',
        tipoAlmacenamiento: 'HDD',
        tieneCargador: true,
        marcaCargador: 'MSI',
        modeloCargador: '120W AC Adapter',
        serieCargador: 'MSI-CHG-554433',
        numeroInventarioCargador: 'INV-CAR-001'
      }
    }
  });

  console.log('Database updated!');
}

updateDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
