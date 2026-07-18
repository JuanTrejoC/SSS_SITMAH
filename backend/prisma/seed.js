require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@sitmah.local',
      passwordHash,
      nombre: 'Administrador',
      rol: 'admin',
    },
  });

  // Seed initial traffic light components
  const componentesSemaforos = [
    { nombre: 'controladores', categoria: 'equipo', cantidad: 10 },
    { nombre: 'cabezales', categoria: 'componente', cantidad: 10 },
    { nombre: 'led verdes', categoria: 'componente', cantidad: 50 },
    { nombre: 'led rojos', categoria: 'componente', cantidad: 50 },
    { nombre: 'led amarillos', categoria: 'componente', cantidad: 50 },
    { nombre: 'paso peatonal', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'audible', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'pantalla led', categoria: 'periferico', cantidad: 10 },
    { nombre: 'tarjeta relevadora', categoria: 'componente', cantidad: 10 },
    { nombre: 'fuente de poder', categoria: 'componente', cantidad: 10 },
    { nombre: 'cpu', categoria: 'componente', cantidad: 10 },
    { nombre: 'switch', categoria: 'equipo', cantidad: 10 },
    { nombre: 'fibra optica', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'gps', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'botonera', categoria: 'accesorio', cantidad: 10 }
  ];

  for (const comp of componentesSemaforos) {
    await prisma.existenciaComponente.upsert({
      where: { nombre: comp.nombre },
      update: {},
      create: comp,
    });
  }

  // Seed initial technological equipment and tools
  const equiposSemilla = [
    {
      tipo: 'lectora_tags',
      numeroInventario: 'INV-TAG-001',
      marca: 'ZKTeco',
      modelo: 'U1000',
      numeroSerie: 'ZK987654321',
      areaUbicacion: 'Peaje Acceso Norte',
      detalles: {}
    },
    {
      tipo: 'controladora',
      numeroInventario: 'INV-CTR-001',
      marca: 'Hikvision',
      modelo: 'DS-K2604',
      numeroSerie: 'HK11223344',
      areaUbicacion: 'Peaje Acceso Sur',
      detalles: {}
    },
    {
      tipo: 'herramienta_tec',
      numeroInventario: 'INV-HER-TEC-001',
      marca: 'Steren',
      modelo: 'Ponchadora RJ45',
      numeroSerie: 'ST998877',
      areaUbicacion: 'Sistemas',
      detalles: {}
    },
    {
      tipo: 'herramienta_infra',
      numeroInventario: 'INV-HER-INF-001',
      marca: 'Truper',
      modelo: 'Martillo de uña',
      numeroSerie: 'TR665544',
      areaUbicacion: 'Mantenimiento',
      detalles: {}
    }
  ];

  for (const eq of equiposSemilla) {
    await prisma.equipoTecnologico.upsert({
      where: { numeroInventario: eq.numeroInventario },
      update: {},
      create: eq,
    });
  }

  console.log('Seed completado.');
  console.log('Usuario admin: username=admin, password=admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
