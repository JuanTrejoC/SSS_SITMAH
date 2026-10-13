const path = require('path');
const fs = require('fs');
const prisma = require('../config/db');
const { ok, fail } = require('../utils/response');

const uploadsDir = path.join(__dirname, '../../uploads');

function borrarArchivo(nombre) {
  if (!nombre) return;
  const ruta = path.join(uploadsDir, path.basename(nombre));
  fs.promises.unlink(ruta).catch(() => {});
}

async function sincronizarResguardosPendientes() {
  try {
    const mobiliarios = await prisma.inventarioMobiliario.findMany({
      where: { nombreResguardante: { not: '' } }
    });
    for (const m of mobiliarios) {
      const resp = (m.nombreResguardante || '').trim();
      if (!resp || resp.toUpperCase() === 'N/A') continue;
      const existe = await prisma.resguardo.findFirst({ where: { mobiliarioId: m.id } });
      if (!existe) {
        const tituloBien = (m.bien || 'MOBILIARIO').toUpperCase();
        const lineas = [];
        if (m.marca || m.modelo) lineas.push(`MARCA ${m.marca || 'S/M'}, MODELO ${m.modelo || 'S/M'}`);
        if (m.numeroInventario) lineas.push(`No. de Inventario: ${m.numeroInventario}`);
        if (m.descripcion) lineas.push(m.descripcion);
        await prisma.resguardo.create({
          data: {
            tipoInventario: 'mobiliario',
            mobiliarioId: m.id,
            nombreResguardante: resp,
            cargo: m.cargo || '',
            direccion: m.direccion || '',
            area: m.direccion || '',
            descripcionPdf: `${tituloBien}\n\n${lineas.join('\n')}`,
            numeroSeriePdf: m.numeroSerie || 'S/S',
            fechaPrestamo: m.createdAt || new Date(),
            estado: 'Activo'
          }
        });
      }
    }

    // Limpiar resguardos activos sin firmar de equipos que ya no están activos (ej. regresaron a Stock o Baja)
    await prisma.resguardo.deleteMany({
      where: {
        tipoInventario: 'tecnologico',
        estado: 'Activo',
        archivoFirmado: null,
        equipoTecnologico: {
          estatus: { not: 'Activo' }
        }
      }
    });

    // Sincronizar todos los equipos tecnológicos con estatus 'Activo'
    const equipos = await prisma.equipoTecnologico.findMany({
      where: {
        estatus: 'Activo'
      }
    });
    for (const eq of equipos) {
      const existe = await prisma.resguardo.findFirst({ where: { equipoTecnologicoId: eq.id } });
      if (!existe) {
        const resp = (eq.responsable || '').trim();
        const nombreResp = (resp && resp.toUpperCase() !== 'N/A' && !resp.toLowerCase().includes('área tecnológica'))
          ? resp
          : (eq.areaUbicacion ? `Responsable ${eq.areaUbicacion}` : 'Por Asignar');

        const tipoLabel = eq.tipo ? eq.tipo.replace(/_/g, ' ').toUpperCase() : 'EQUIPO TECNOLÓGICO';
        const titulo = `${tipoLabel} ${eq.marca || ''} ${eq.modelo || ''}`.trim();
        const lineas = [];
        lineas.push(`${tipoLabel} MARCA ${eq.marca || 'S/M'}, MODELO ${eq.modelo || 'S/M'}`);
        if (eq.numeroInventario) lineas.push(`No. Inventario: ${eq.numeroInventario}`);
        if (eq.areaUbicacion) lineas.push(`Ubicación: ${eq.areaUbicacion}`);
        await prisma.resguardo.create({
          data: {
            tipoInventario: 'tecnologico',
            equipoTecnologicoId: eq.id,
            nombreResguardante: nombreResp,
            cargo: eq.cargoResponsable || (eq.areaUbicacion ? 'Responsable de Ubicación' : ''),
            direccion: eq.direccion || eq.areaUbicacion || 'Operación SITMAH',
            area: eq.direccion || eq.areaUbicacion || 'Operación SITMAH',
            descripcionPdf: `${titulo}\n\n${lineas.join('\n')}`,
            numeroSeriePdf: eq.numeroSerie || 'S/S',
            fechaPrestamo: new Date(),
            estado: 'Activo'
          }
        });
      }
    }
  } catch (err) {
    console.warn('Advertencia al sincronizar resguardos automáticos:', err);
  }
}

async function listar(req, res) {
  try {
    await sincronizarResguardosPendientes();
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

    const campoItem = {
      mobiliario: 'mobiliarioId',
      tecnologico: 'equipoTecnologicoId',
      herramienta: 'existenciaId',
      existencia: 'existenciaId',
      semaforos: 'controladorSemaforoId'
    }[tipoInventario];

    // Evita duplicar el resguardo activo de la misma persona y el mismo bien
    const existente = await prisma.resguardo.findFirst({
      where: { [campoItem]: Number(itemId), nombreResguardante, estado: 'Activo' },
      include: { mobiliario: true, equipoTecnologico: true, existencia: true, controladorSemaforo: true }
    });
    if (existente) return ok(res, existente, 200);

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
    if (estado === 'Devuelto') {
      data.fechaDevolucion = fechaDevolucion ? new Date(fechaDevolucion) : new Date();
    } else if (fechaDevolucion) {
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

    // Si se marca como Devuelto, regresar el equipo tecnológico a Stock y quitar el responsable
    if (estado === 'Devuelto') {
      if (resguardoActualizado.equipoTecnologicoId) {
        await prisma.equipoTecnologico.update({
          where: { id: resguardoActualizado.equipoTecnologicoId },
          data: {
            estatus: 'Stock',
            responsable: null,
            cargoResponsable: null
          }
        }).catch(err => console.warn('Error regresando equipo a Stock:', err));
      }
      if (resguardoActualizado.mobiliarioId) {
        await prisma.inventarioMobiliario.update({
          where: { id: resguardoActualizado.mobiliarioId },
          data: {
            nombreResguardante: null,
            cargo: null
          }
        }).catch(err => console.warn('Error regresando mobiliario:', err));
      }
    }

    ok(res, resguardoActualizado);
  } catch (error) {
    console.error('Error al actualizar resguardo:', error);
    fail(res, 'Error interno del servidor', 500);
  }
}

async function subirFirmado(req, res) {
  try {
    const id = Number(req.params.id);
    if (!req.file) return fail(res, 'Selecciona un archivo PDF del resguardo firmado', 400);

    const actual = await prisma.resguardo.findUnique({ where: { id } });
    if (!actual) {
      borrarArchivo(req.file.filename);
      return fail(res, 'Resguardo no encontrado', 404);
    }

    const actualizado = await prisma.resguardo.update({
      where: { id },
      data: {
        archivoFirmado: req.file.filename,
        archivoFirmadoMime: 'application/pdf',
        fechaFirmado: new Date()
      },
      include: { mobiliario: true, equipoTecnologico: true, existencia: true, controladorSemaforo: true }
    });

    borrarArchivo(actual.archivoFirmado);
    ok(res, actualizado);
  } catch (error) {
    console.error('Error al subir resguardo firmado:', error);
    fail(res, 'Error interno del servidor', 500);
  }
}

async function obtenerFirmado(req, res) {
  try {
    const resguardo = await prisma.resguardo.findUnique({ where: { id: Number(req.params.id) } });
    if (!resguardo || !resguardo.archivoFirmado) return fail(res, 'Sin archivo firmado', 404);

    const ruta = path.join(uploadsDir, path.basename(resguardo.archivoFirmado));
    if (!fs.existsSync(ruta)) return fail(res, 'Archivo no encontrado', 404);

    res.removeHeader('X-Frame-Options');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'application/pdf');
    const nombreLimpio = `Resguardo_Firmado_${(resguardo.nombreResguardante || 'sitmah').replace(/\s+/g, '_')}.pdf`;

    if (req.query.download === '1') {
      res.download(ruta, nombreLimpio);
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${nombreLimpio}"`);
    res.sendFile(ruta);
  } catch (error) {
    console.error('Error al obtener resguardo firmado:', error);
    fail(res, 'Error interno del servidor', 500);
  }
}

async function eliminarFirmado(req, res) {
  try {
    const id = Number(req.params.id);
    const actual = await prisma.resguardo.findUnique({ where: { id } });
    if (!actual) return fail(res, 'Resguardo no encontrado', 404);

    const actualizado = await prisma.resguardo.update({
      where: { id },
      data: { archivoFirmado: null, archivoFirmadoMime: null, fechaFirmado: null },
      include: { mobiliario: true, equipoTecnologico: true, existencia: true, controladorSemaforo: true }
    });
    borrarArchivo(actual.archivoFirmado);
    ok(res, actualizado);
  } catch (error) {
    console.error('Error al eliminar resguardo firmado:', error);
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
  subirFirmado,
  obtenerFirmado,
  eliminarFirmado,
  generarPDF
};
