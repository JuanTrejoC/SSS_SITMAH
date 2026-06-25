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

  // Desactivar categorías existentes
  await prisma.categoria.updateMany({ data: { activo: false } });

  const categorias = [
    'Equipo no enciende',
    'Equipo lento o se traba',
    'Pantalla sin imagen o con fallas',
    'Teclado o mouse no funcionan',
    'Batería de portátil no carga',
    'Impresora no imprime o atasca papel',
    'Impresora no se comunica con el equipo',
    'Escáner no funciona',
    'Sin conexión a internet',
    'Conexión lenta o intermitente',
    'Sin acceso a red local',
    'Puerto o cable de red dañado',
    'Regulador / No-Break no funciona',
    'No-Break descarga rápido',
    'Toma de corriente dañada',
    'Programa no abre o se cierra solo',
    'Archivos no se pueden abrir',
    'Problemas de acceso o contraseña',
    'Sistema operativo con errores',
    'Otro (especificar en observaciones)'
  ];
  for (const nombre of categorias) {
    const existe = await prisma.categoria.findFirst({ where: { nombre } });
    if (existe) {
      await prisma.categoria.update({ where: { id: existe.id }, data: { activo: true } });
    } else {
      await prisma.categoria.create({ data: { nombre, activo: true } });
    }
  }



  // Desactivar tipos de falla existentes
  await prisma.tipoFalla.updateMany({ data: { activo: false } });

  const tiposFalla = [
    'Luz roja no funciona',
    'Luz amarilla no funciona',
    'Luz verde no funciona',
    'Semaforo peatonal dañado',
    'Poste dañado',
    'Cabezal semaforico dañado',
    'Cabezal semaforico caido',
    'Cableado dañado',
    'Daño por choque vehicular',
    'Daño por vandalismo',
    'Desincronizacion semaforica',
    'Programacion incorrecta de tiempos',
    'Modulo LED dañado',
    'Lente roto',
    'Gabinete de control dañado',
    'Falla CFE',
    'Otro (especificar en observaciones)'
  ];
  for (const nombre of tiposFalla) {
    const existe = await prisma.tipoFalla.findFirst({ where: { nombre } });
    if (existe) {
      await prisma.tipoFalla.update({ where: { id: existe.id }, data: { activo: true } });
    } else {
      await prisma.tipoFalla.create({ data: { nombre, activo: true } });
    }
  }

  const correoExiste = await prisma.correoNotificacion.findFirst({
    where: { correo: 'admin@sitmah.local' },
  });
  if (!correoExiste) {
    await prisma.correoNotificacion.create({
      data: {
        nombre: 'Administrador SITMAH',
        correo: 'admin@sitmah.local',
      },
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
