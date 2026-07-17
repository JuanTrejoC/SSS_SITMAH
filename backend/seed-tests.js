const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Rutas de origen
  const trafficLightImgPath = 'C:\\Users\\Ivane\\.gemini\\antigravity-ide\\brain\\b49941e8-42f5-45d2-893e-10db1e7c02f1\\broken_traffic_light_1784305742987.png';
  const laptopImgPath = 'C:\\Users\\Ivane\\.gemini\\antigravity-ide\\brain\\b49941e8-42f5-45d2-893e-10db1e7c02f1\\broken_laptop_1784305753441.png';

  // Rutas destino
  const destTrafficLight = path.join(uploadsDir, 'broken_traffic_light.png');
  const destLaptop = path.join(uploadsDir, 'broken_laptop.png');

  // Copiar imagenes
  if (fs.existsSync(trafficLightImgPath)) fs.copyFileSync(trafficLightImgPath, destTrafficLight);
  if (fs.existsSync(laptopImgPath)) fs.copyFileSync(laptopImgPath, destLaptop);

  // Obtener IDs requeridos (tomamos el primero de cada uno)
  const crucero = await prisma.crucero.findFirst({ include: { estaciones: true } });
  const tipoFalla = await prisma.tipoFalla.findFirst();
  const area = await prisma.area.findFirst();
  const categoria = await prisma.categoria.findFirst();
  const sede = await prisma.sede.findFirst();
  const admin = await prisma.usuario.findFirst({ where: { username: 'admin' } });

  // Crear reporte de semáforo
  if (crucero && crucero.estaciones.length > 0 && tipoFalla) {
    const reporteSemaforo = await prisma.reporteSemaforo.create({
      data: {
        folio: `SEM-TEST-${Date.now()}`,
        jefeTurno: 'Juan Pérez',
        estacionId: crucero.estaciones[0].estacionId,
        cruceroId: crucero.id,
        tipoFallaId: tipoFalla.id,
        descripcion: 'Un camión chocó con el semáforo y los cables están colgando. Se apagó por completo.',
        horaDano: new Date(),
        prioridad: 'alta',
        estado: 'abierto',
        evidencias: {
          create: [{
            filename: 'broken_traffic_light.png',
            filepath: '/uploads/broken_traffic_light.png',
            mimetype: 'image/png',
            sizeBytes: 102400
          }]
        }
      }
    });
    console.log('Reporte Semaforo creado:', reporteSemaforo.folio);
  }

  // Crear reporte de oficina
  if (area && categoria && sede) {
    const reporteOficina = await prisma.reporteOficina.create({
      data: {
        folio: `OFI-TEST-${Date.now()}`,
        solicitante: 'María Gonzalez',
        areaId: area.id,
        email: 'maria@ejemplo.com',
        sedeId: sede.id,
        equipo: 'Laptop Lenovo',
        categoriaId: categoria.id,
        prioridad: 'media',
        descripcion: 'La pantalla de mi laptop se rompió y solo se ven líneas de colores.',
        estado: 'abierto',
        evidencias: {
          create: [{
            filename: 'broken_laptop.png',
            filepath: '/uploads/broken_laptop.png',
            mimetype: 'image/png',
            sizeBytes: 204800
          }]
        }
      }
    });
    console.log('Reporte Oficina creado:', reporteOficina.folio);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
