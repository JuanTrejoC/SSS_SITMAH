const prisma = require('../config/db');

async function generarFolio(tipo) {
  const prefijo = tipo === 'oficina' ? 'RO' : 'RS';
  const anio = new Date().getFullYear();

  const inicioAnio = new Date(`${anio}-01-01T00:00:00`);
  const finAnio = new Date(`${anio + 1}-01-01T00:00:00`);

  let count = 0;

  if (tipo === 'oficina') {
    count = await prisma.reporteOficina.count({
      where: { createdAt: { gte: inicioAnio, lt: finAnio } },
    });
  } else {
    count = await prisma.reporteSemaforo.count({
      where: { createdAt: { gte: inicioAnio, lt: finAnio } },
    });
  }

  // ✅ Aquí el cambio clave: 2 dígitos mínimo, sin límite
  const secuencia = String(count + 1).padStart(2, '0');
  const anioCorto = String(anio).slice(-2);

  return `${prefijo}-${secuencia}-${anioCorto}`;
}

module.exports = { generarFolio };