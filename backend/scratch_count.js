const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const countOficinas = await prisma.reporteOficina.count();
  const countSemaforos = await prisma.reporteSemaforo.count();
  const countAreas = await prisma.area.count();
  console.log(`Reportes Oficina: ${countOficinas}`);
  console.log(`Reportes Semaforo: ${countSemaforos}`);
  console.log(`Areas: ${countAreas}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
