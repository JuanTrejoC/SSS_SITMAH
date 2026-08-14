const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tec = await prisma.equipoTecnologico.count();
  const exis = await prisma.existenciaComponente.count();
  const exisList = await prisma.existenciaComponente.findMany();
  const mobi = await prisma.inventarioMobiliario.count();
  const semaforos = await prisma.controladorSemaforo.count();
  console.log(`Tecnologico: ${tec}`);
  console.log(`Existencias: ${exis}`, exisList.map(e => e.categoria + ' ' + e.tipoInventario));
  console.log(`Mobiliario: ${mobi}`);
  console.log(`Semaforos: ${semaforos}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
