const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

async function listar(req, res) {
  try {
    const resguardos = await prisma.resguardo.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        mobiliario: true,
        equipoTecnologico: true,
        existencia: true,
        controladorSemaforo: true
      }
    });
    ok(res, resguardos);
  } catch (error) {
    console.error('Error al listar resguardos:', error);
    fail(res, 'Error interno del servidor', 500);
  }
}

async function crear(req, res) {
  try {
    const { tipoInventario, itemId, nombreResguardante, cargo, direccion, area, observaciones, descripcionPdf, numeroSeriePdf } = req.body;
    
    if (!tipoInventario || !itemId || !nombreResguardante) {
      return fail(res, 'Datos incompletos', 400);
    }

    const data = {
      tipoInventario,
      nombreResguardante,
      cargo: cargo || null,
      direccion: direccion || null,
      area: area || direccion || '',
      observaciones,
      descripcionPdf,
      numeroSeriePdf
    };

    if (tipoInventario === 'mobiliario') {
      data.mobiliarioId = Number(itemId);
    } else if (tipoInventario === 'tecnologico') {
      data.equipoTecnologicoId = Number(itemId);
    } else if (tipoInventario === 'herramienta' || tipoInventario === 'existencia') {
      data.existenciaId = Number(itemId);
    } else if (tipoInventario === 'semaforos') {
      data.controladorSemaforoId = Number(itemId);
    } else {
      return fail(res, 'Tipo de inventario no válido', 400);
    }

    const nuevoResguardo = await prisma.resguardo.create({
      data,
      include: {
        mobiliario: true,
        equipoTecnologico: true,
        existencia: true,
        controladorSemaforo: true
      }
    });

    ok(res, nuevoResguardo, 201);
  } catch (error) {
    console.error('Error al crear resguardo:', error);
    fail(res, 'Error interno del servidor', 500);
  }
}

async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { estado, observaciones, fechaDevolucion } = req.body;

    const data = { estado, observaciones };
    if (fechaDevolucion) {
      data.fechaDevolucion = new Date(fechaDevolucion);
    }

    const resguardoActualizado = await prisma.resguardo.update({
      where: { id: Number(id) },
      data,
      include: {
        mobiliario: true,
        equipoTecnologico: true,
        existencia: true,
        controladorSemaforo: true
      }
    });

    ok(res, resguardoActualizado);
  } catch (error) {
    console.error('Error al actualizar resguardo:', error);
    fail(res, 'Error interno del servidor', 500);
  }
}

async function generarPDF(req, res) {
  // Placeholder pending the user's PDF base
  fail(res, 'Generación de PDF en desarrollo', 501);
}

module.exports = {
  listar,
  crear,
  actualizar,
  generarPDF
};
