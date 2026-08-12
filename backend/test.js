const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const equipos = await prisma.equipoTecnologico.findMany({ take: 2, orderBy: { id: 'desc' }});
  console.log(equipos);
}
main().finally(() => prisma.$disconnect());
