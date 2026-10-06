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

  let maxNumero = 0;

  if (tipo === 'semaforo') {
    const reportes = await prisma.reporteSemaforo.findMany({
      where: {
        createdAt: { gte: inicioAnio, lt: finAnio },
        folio: { startsWith: `${prefijo}-` }
      },
      select: { folio: true }
    });

    for (const r of reportes) {
      if (!r.folio) continue;
      const partes = r.folio.split('-');
      if (partes.length >= 2) {
        const num = parseInt(partes[1], 10);
        if (!isNaN(num) && num > maxNumero) {
          maxNumero = num;
        }
      }
    }
  } else {
    // Oficina / Tecnológico (RT) o Infraestructura (RI)
    const reportes = await prisma.reporteOficina.findMany({
      where: {
        createdAt: { gte: inicioAnio, lt: finAnio },
        folio: { startsWith: `${prefijo}-` }
      },
      select: { folio: true }
    });

    for (const r of reportes) {
      if (!r.folio) continue;
      const partes = r.folio.split('-');
      if (partes.length >= 2) {
        const num = parseInt(partes[1], 10);
        if (!isNaN(num) && num > maxNumero) {
          maxNumero = num;
        }
      }
    }
  }

  let siguienteNumero = maxNumero + 1;
  let folioCandidato = `${prefijo}-${String(siguienteNumero).padStart(2, '0')}-${anio}`;

  // Verificación adicional contra colisiones
  if (tipo === 'semaforo') {
    while (await prisma.reporteSemaforo.findUnique({ where: { folio: folioCandidato } })) {
      siguienteNumero++;
      folioCandidato = `${prefijo}-${String(siguienteNumero).padStart(2, '0')}-${anio}`;
    }
  } else {
    while (await prisma.reporteOficina.findUnique({ where: { folio: folioCandidato } })) {
      siguienteNumero++;
      folioCandidato = `${prefijo}-${String(siguienteNumero).padStart(2, '0')}-${anio}`;
    }
  }

  return folioCandidato;
}

module.exports = { generarFolio };