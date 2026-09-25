const prisma = require('../config/db');

async function generarFolio(tipo) {
  let prefijo = 'RT';
  if (tipo === 'infraestructura') {
    prefijo = 'RI';
  } else if (tipo === 'semaforo') {
    prefijo = 'RS';
  }

  const anio = new Date().getFullYear();
  const inicioAnio = new Date(`${anio}-01-01T00:00:00`);
  const finAnio = new Date(`${anio + 1}-01-01T00:00:00`);

  let count = 0;

  if (tipo === 'infraestructura') {
    count = await prisma.reporteOficina.count({
      where: {
        createdAt: { gte: inicioAnio, lt: finAnio },
        OR: [
          { folio: { startsWith: 'RI' } },
          { categoria: { nombre: { contains: 'Infraestructura' } } }
        ]
      },
    });
  } else if (tipo === 'oficina' || tipo === 'tecnologico') {
    count = await prisma.reporteOficina.count({
      where: {
        createdAt: { gte: inicioAnio, lt: finAnio },
        NOT: {
          OR: [
            { folio: { startsWith: 'RI' } },
            { categoria: { nombre: { contains: 'Infraestructura' } } }
          ]
        }
      },
    });
  } else {
    count = await prisma.reporteSemaforo.count({
      where: { createdAt: { gte: inicioAnio, lt: finAnio } },
    });
  }

  // Generar secuencia con padding de 2 dígitos
  const secuencia = String(count + 1).padStart(2, '0');

  return `${prefijo}-${secuencia}-${anio}`;
}

module.exports = { generarFolio };