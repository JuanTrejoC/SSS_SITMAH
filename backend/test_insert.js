const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Generando registros de prueba...");

  // Insertar Subdirecciones
  await prisma.subdireccion.create({ data: { nombre: 'Subdirección de Recursos Humanos' } }).catch(() => {});
  await prisma.subdireccion.create({ data: { nombre: 'Subdirección de TI' } }).catch(() => {});

  // Insertar Mobiliario
  await prisma.inventarioMobiliario.create({
    data: {
      numeroInventario: 'MOB-TEST-001',
      bien: 'Mesa tipo L',
      marca: 'SIN MARCA',
      modelo: 'S/M',
      numeroSerie: 'S/S',
      descripcion: 'Mesa tipo L color caoba con detalles metálicos.',
      direccion: 'Dirección de Administración y Finanzas',
      subdireccion: 'Subdirección de TI',
      area: 'Oficinas Téllez',
      nombreResguardante: 'Juan Pérez'
    }
  }).catch(() => {});

  await prisma.inventarioMobiliario.create({
    data: {
      numeroInventario: 'MOB-TEST-002',
      bien: 'Silla ejecutiva',
      marca: 'ErgoChair',
      modelo: 'Pro',
      numeroSerie: 'S/S',
      descripcion: 'Silla ejecutiva ergonómica color negro.',
      direccion: 'Dirección de Operación e Inspección',
      subdireccion: 'Subdirección de Recursos Humanos',
      area: 'Centro de control',
      nombreResguardante: 'María Gómez'
    }
  }).catch(() => {});

  console.log("Registros de prueba creados exitosamente.");
}

main()
  .catch(e => {
    console.error("Error durante las pruebas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
