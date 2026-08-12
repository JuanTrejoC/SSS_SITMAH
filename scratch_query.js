const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const equipos = await prisma.equipoTecnologico.findMany();
  console.log(JSON.stringify(equipos, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
