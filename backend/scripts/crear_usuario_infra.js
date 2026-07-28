const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('infra123', 10);
  await prisma.usuario.upsert({
    where: { username: 'infra' },
    update: {},
    create: {
      username: 'infra',
      email: 'infra@sitmah.gob.mx',
      nombre: 'Gestor Infraestructura',
      passwordHash: hash,
      rol: 'infraestructura'
    }
  });
  console.log('Usuario creado exitosamente');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
