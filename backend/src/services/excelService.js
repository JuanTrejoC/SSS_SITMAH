const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const sizeOf = require('image-size');

function aplicarEstiloTabla(sheet) {
  // Activar líneas de cuadrícula para que siempre sean visibles
  sheet.views = [
    { showGridLines: true }
  ];

  // Configurar altura de la fila de cabecera
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;

  // Estilo para la cabecera
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' } // Slate oscuro / Charcoal
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FF475569' } }
    };
  });

  // Estilo para las celdas de datos
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Omitir cabecera

    // Respetar altura si ya fue modificada (ej. miniatura de evidencia)
    if (row.height === undefined || row.height < 22) {
      row.height = 22;
    }

    const esPar = rowNumber % 2 === 0;
    const bgCol = esPar ? 'FFF8FAFC' : 'FFFFFFFF'; // Cebra: Slate-50 y Blanco

    row.eachCell((cell, colNumber) => {
      // Estilo de fuente general
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        color: { argb: 'FF334155' } // Slate-700
      };

      // Relleno base (cebra)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgCol }
      };

      // Bordes finos
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Alineación por defecto
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true
      };

      // Obtener el nombre del encabezado (de sheet.columns)
      const columnDef = sheet.columns[colNumber - 1];
      const key = columnDef ? columnDef.key : null;

      // Alineaciones específicas
      if (['id', 'folio', 'prioridad', 'estado', 'fecha', 'horaDano', 'horaReporte', 'horaResuelto'].includes(key)) {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        };
      }

      // Estilo especial para PRIORIDAD
      if (key === 'prioridad') {
        const val = String(cell.value || '').toLowerCase().trim();
        if (val === 'alta') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2F2' } // Rojo muy claro
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FF991B1B' } // Rojo oscuro
          };
        } else if (val === 'media') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFBEB' } // Ámbar muy claro
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FF92400E' } // Ámbar oscuro
          };
        } else if (val === 'baja') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' } // Verde muy claro
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FF166534' } // Verde oscuro
          };
        }
      }

      // Estilo especial para ESTADO
      if (key === 'estado') {
        const val = String(cell.value || '').toLowerCase().trim();
        if (val === 'abierto' || val === 'pendiente') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2F2' } // Rojo claro
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FF991B1B' }
          };
        } else if (val === 'en_proceso' || val === 'en proceso') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFBEB' } // Ámbar claro
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FF92400E' }
          };
        } else if (val === 'resuelto') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' } // Verde claro
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FF166534' }
          };
        }
      }

      // Formatear fechas si vienen en formato ISO
      if (['fecha', 'horaDano', 'horaReporte', 'horaResuelto'].includes(key) && cell.value) {
        try {
          const date = new Date(cell.value);
          if (!isNaN(date.getTime())) {
            // Formato amigable para Excel en México (DD/MM/YYYY HH:MM:SS)
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const anio = date.getFullYear();
            const hora = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const seg = String(date.getSeconds()).padStart(2, '0');
            cell.value = `${dia}/${mes}/${anio} ${hora}:${min}:${seg}`;
          }
        } catch (e) {
          // Si falla, dejamos el valor como texto original
        }
      }
    });
  });

  // Auto-ajustar ancho de columnas
  sheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, function (cell) {
      // Ignorar celdas con imágenes (el valor es null o vacío) para el cálculo de ancho de texto,
      // pero para la columna 'evidencia', daremos un ancho mínimo.
      const valStr = cell.value ? cell.value.toString() : '';
      if (valStr.length > maxLength) {
        maxLength = valStr.length;
      }
    });
    // Si la columna es evidencia y se agregaron imágenes, dar un ancho base
    if (column.key === 'evidencia' && maxLength < 25) {
      column.width = 25;
    } else {
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    }
  });
}

/**
 * Intenta agregar una imagen de evidencia en una hoja de Excel.
 * Devuelve true si pudo insertar imagen, false si no.
 */
async function insertarImagenEvidencia(workbook, sheet, rowIndex, colIndex, evidencias) {
  if (!evidencias || evidencias.length === 0) return false;

  // Buscar la primera evidencia que sea imagen
  const imagenEv = evidencias.find(ev =>
    ev.mimetype && ev.mimetype.startsWith('image/')
  );

  if (!imagenEv) return false;

  const filePath = path.join(__dirname, '../../uploads', imagenEv.filepath);
  if (!fs.existsSync(filePath)) return false;

  try {
    const imageBuffer = fs.readFileSync(filePath);
    
    // Obtener dimensiones originales para mantener la proporción (aspect ratio)
    let origW = 100;
    let origH = 100;
    try {
      const dimensions = sizeOf(imageBuffer);
      origW = dimensions.width;
      origH = dimensions.height;
    } catch (err) {
      console.error('No se pudieron leer las dimensiones de la imagen:', err.message);
    }

    // La celda tiene approx 175px de ancho (25 col width) y 120px de alto (90 row height)
    // Fijamos un área máxima para la imagen, dejando margen
    const MAX_WIDTH = 150; 
    const MAX_HEIGHT = 100;

    let width = origW;
    let height = origH;

    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width);
      width = MAX_WIDTH;
    }
    if (height > MAX_HEIGHT) {
      width = Math.round((width * MAX_HEIGHT) / height);
      height = MAX_HEIGHT;
    }

    const ext = imagenEv.mimetype.split('/')[1] || 'jpeg';
    const validExts = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
    const imgExt = validExts.includes(ext.toLowerCase()) ? (ext === 'jpg' ? 'jpeg' : ext.toLowerCase()) : 'jpeg';

    const imageId = workbook.addImage({
      buffer: imageBuffer,
      extension: imgExt,
    });

    // Insertar la imagen en la celda correspondiente, con su proporción original
    sheet.addImage(imageId, {
      tl: { col: colIndex + 0.2, row: rowIndex + 0.1 },
      ext: { width: width, height: height },
      editAs: 'oneCell',
    });

    return true;
  } catch (e) {
    console.error('Error al insertar imagen en Excel:', e.message);
    return false;
  }
}

async function exportarReportesOficina(reportes, incluirImagenes = false) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Reportes Oficina');

  const tieneImagenes = incluirImagenes && reportes.some(r => r.evidencias && r.evidencias.some(ev => ev.mimetype?.startsWith('image/')));

  sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Folio', key: 'folio', width: 18 },
    { header: 'Solicitante', key: 'solicitante', width: 25 },
    { header: 'Área', key: 'area', width: 22 },
    { header: 'Sede', key: 'sede', width: 22 },
    { header: 'Equipo', key: 'equipo', width: 18 },
    { header: 'Categoría', key: 'categoria', width: 18 },
    { header: 'Prioridad', key: 'prioridad', width: 14 },
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Fecha', key: 'fecha', width: 22 },
    ...(tieneImagenes ? [{ header: 'Evidencia', key: 'evidencia', width: 22 }] : []),
  ];

  for (let i = 0; i < reportes.length; i++) {
    const r = reportes[i];
    const rowData = {
      id: r.id,
      folio: r.folio,
      solicitante: r.solicitante,
      area: r.area?.nombre,
      sede: r.sede?.nombre,
      equipo: r.equipo,
      categoria: r.categoria?.nombre,
      prioridad: r.prioridad,
      estado: r.estado,
      fecha: r.createdAt?.toISOString(),
    };

    if (tieneImagenes) {
      rowData.evidencia = '';
    }

    const row = sheet.addRow(rowData);
    const rowNumber = row.number;

    // Si tiene imágenes, ajustar altura y poner imagen
    if (tieneImagenes && r.evidencias && r.evidencias.length > 0) {
      const imgEv = r.evidencias.find(ev => ev.mimetype?.startsWith('image/'));
      if (imgEv) {
        row.height = 90; // Altura para mostrar miniatura
        const colIndex = 10; // columna 'evidencia' (0-based = 10)
        await insertarImagenEvidencia(workbook, sheet, rowNumber - 1, colIndex, r.evidencias);
      }
    }
  }

  aplicarEstiloTabla(sheet);

  return workbook.xlsx.writeBuffer();
}

async function exportarReportesSemaforo(reportes, incluirImagenes = false) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Reportes Semáforo');

  const tieneImagenes = incluirImagenes && reportes.some(r => r.evidencias && r.evidencias.some(ev => ev.mimetype?.startsWith('image/')));

  sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Folio', key: 'folio', width: 18 },
    { header: 'Jefe turno', key: 'jefeTurno', width: 25 },
    { header: 'Crucero', key: 'crucero', width: 25 },
    { header: 'Estación', key: 'estacion', width: 22 },
    { header: 'Falla', key: 'falla', width: 22 },
    { header: 'Hora daño', key: 'horaDano', width: 22 },
    { header: 'Hora reporte', key: 'horaReporte', width: 22 },
    { header: 'Hora resuelto', key: 'horaResuelto', width: 22 },
    { header: 'Estado', key: 'estado', width: 14 },
    ...(tieneImagenes ? [{ header: 'Evidencia', key: 'evidencia', width: 22 }] : []),
  ];

  for (let i = 0; i < reportes.length; i++) {
    const r = reportes[i];
    const rowData = {
      id: r.id,
      folio: r.folio,
      jefeTurno: r.jefeTurno,
      crucero: r.crucero?.nombre,
      estacion: r.estacion?.nombre,
      falla: r.tipoFalla?.nombre,
      horaDano: r.horaDano?.toISOString(),
      horaReporte: r.createdAt?.toISOString(),
      horaResuelto: r.fechaResolucion?.toISOString() || '',
      estado: r.estado,
    };

    if (tieneImagenes) {
      rowData.evidencia = '';
    }

    const row = sheet.addRow(rowData);
    const rowNumber = row.number;

    // Si tiene imágenes, ajustar altura y poner imagen
    if (tieneImagenes && r.evidencias && r.evidencias.length > 0) {
      const imgEv = r.evidencias.find(ev => ev.mimetype?.startsWith('image/'));
      if (imgEv) {
        row.height = 90;
        const colIndex = 10; // columna 'evidencia' (0-based = 10)
        await insertarImagenEvidencia(workbook, sheet, rowNumber - 1, colIndex, r.evidencias);
      }
    }
  }

  aplicarEstiloTabla(sheet);

  return workbook.xlsx.writeBuffer();
}

module.exports = { exportarReportesOficina, exportarReportesSemaforo };
