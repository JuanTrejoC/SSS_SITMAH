const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Estandarizando a mayúsculas...");

  // Estandarizar Subdirecciones
  const subdirecciones = await prisma.subdireccion.findMany();
  for (const sub of subdirecciones) {
    if (sub.nombre !== sub.nombre.toUpperCase()) {
      await prisma.subdireccion.update({
        where: { id: sub.id },
        data: { nombre: sub.nombre.toUpperCase() }
      });
      console.log(`Subdirección actualizada: ${sub.nombre} -> ${sub.nombre.toUpperCase()}`);
    }
  }

  // Estandarizar inventario de mobiliario (subdirecciones asociadas)
  const mobiliario = await prisma.inventarioMobiliario.findMany();
  for (const mob of mobiliario) {
    if (mob.subdireccion !== mob.subdireccion.toUpperCase()) {
      await prisma.inventarioMobiliario.update({
        where: { id: mob.id },
        data: { subdireccion: mob.subdireccion.toUpperCase() }
      });
      console.log(`Mobiliario actualizado: ${mob.subdireccion} -> ${mob.subdireccion.toUpperCase()}`);
    }
  }

  console.log("¡Estandarización completada!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
