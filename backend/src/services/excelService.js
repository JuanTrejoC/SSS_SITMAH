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
  headerRow.height = 40;

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
    if (row.height === undefined || row.height < 40) {
      row.height = 40;
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
      const valStr = cell.value ? cell.value.toString() : '';
      // Considerar saltos de línea para el ancho de la columna
      const lines = valStr.split('\n');
      for (const line of lines) {
        if (line.length > maxLength) {
          maxLength = line.length;
        }
      }
      
      // Ajustar la altura de la fila si hay muchas líneas de texto (calculado aprox 12px por línea)
      if (lines.length > 3) {
         const neededHeight = lines.length * 15;
         const rowObj = sheet.getRow(cell.row);
         if (!rowObj.height || rowObj.height < neededHeight) {
            rowObj.height = neededHeight;
         }
      }
    });
    
    if (column.key === 'evidencia' && maxLength < 25) {
      column.width = 25;
    } else {
      // Poner un máximo de 60 de ancho para no exagerar y permitir que wrapText haga su trabajo
      column.width = Math.min(maxLength < 10 ? 15 : maxLength + 3, 60);
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
    { header: 'Nombre de quien reporta', key: 'jefeTurno', width: 25 },
    { header: 'Origen', key: 'origen', width: 18 },
    { header: 'Crucero Afectado', key: 'crucero', width: 25 },
    { header: 'Falla', key: 'falla', width: 22 },
    { header: 'Fecha y hora daño', key: 'horaDano', width: 22 },
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
      origen: r.origen || '—',
      crucero: r.crucero?.nombre,
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

async function exportarInventarioExistencias(existencias, incluirImagenes = false) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventario Herramientas');

  const tieneImagenes = incluirImagenes && existencias.some(e => e.evidencias && e.evidencias.some(ev => ev.mimetype?.startsWith('image/')));

  sheet.columns = [
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'Responsable', key: 'responsable', width: 25 },
    { header: 'No. Inventario', key: 'numeroInventario', width: 22 },
    { header: 'No. Serie', key: 'numeroSerie', width: 22 },
    { header: 'Marca / Modelo', key: 'marcaModelo', width: 25 },
    { header: 'Área', key: 'direccion', width: 22 },
    { header: 'Ubicación', key: 'areaUbicacion', width: 22 },
    { header: 'Procedencia', key: 'procedencia', width: 20 },
    { header: 'Estatus', key: 'estatus', width: 15 },
    { header: 'Especificaciones Técnicas', key: 'especificaciones', width: 35 },
    { header: 'Monitores', key: 'monitores', width: 35 },
    { header: 'Teclado', key: 'teclado', width: 25 },
    { header: 'Mouse', key: 'mouse', width: 25 },
    { header: 'Cargador', key: 'cargador', width: 25 },
    { header: 'Diadema / Auricular', key: 'diadema', width: 25 },
    ...(tieneImagenes ? [{ header: 'Evidencia', key: 'evidencia', width: 25 }] : []),
  ];

  for (let i = 0; i < existencias.length; i++) {
    const e = existencias[i];
    
    let especificacionesStr = '';
    let monitoresStr = '';
    let tecladoStr = '';
    let mouseStr = '';
    let cargadorStr = '';
    let diademaStr = '';

    if (e.detalles && typeof e.detalles === 'object') {
       const espPartes = [];
       const mapKeys = {
         ipPredeterminada: 'IP',
         sistemaOperativo: 'OS',
         tarjetaGrafica: 'Gráfica',
         pantallasAsignadas: 'Pantallas',
         numeroTelefono: 'Teléfono',
       };

       for (let k in e.detalles) {
         if (e.detalles[k] !== undefined && e.detalles[k] !== null && typeof e.detalles[k] !== 'boolean') {
            if (k === 'monitores' && Array.isArray(e.detalles[k])) {
               const mons = e.detalles[k];
               const mPartes = [];
               mons.forEach((m, idx) => {
                 if(m.marca || m.modelo || m.serie || m.numeroInventario) {
                   mPartes.push(`Monitor ${idx + 1}:\nMarca: ${m.marca||'N/A'}\nModelo: ${m.modelo||'N/A'}\nSN: ${m.serie||'N/A'}\nInv: ${m.numeroInventario||'N/A'}\n`);
                 }
               });
               monitoresStr = mPartes.join('\n').trim();
            } else if (k.startsWith('marcaTeclado') || k.startsWith('modeloTeclado') || k.startsWith('serieTeclado') || k.startsWith('numeroInventarioTeclado')) {
               // Procesado abajo
            } else if (k.startsWith('marcaMouse') || k.startsWith('modeloMouse') || k.startsWith('serieMouse') || k.startsWith('numeroInventarioMouse')) {
               // Procesado abajo
            } else if (k.startsWith('marcaCargador') || k.startsWith('modeloCargador') || k.startsWith('serieCargador') || k.startsWith('numeroInventarioCargador')) {
               // Procesado abajo
            } else if (k.startsWith('marcaDiadema') || k.startsWith('modeloDiadema') || k.startsWith('serieDiadema') || k.startsWith('numeroInventarioDiadema')) {
               // Procesado abajo
            } else if (k === 'cantidadMonitores' || k === 'tieneMonitores' || k === 'tieneCargador' || k === 'tieneDiadema') {
               // Omitir
            } else {
               const label = mapKeys[k] || k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1');
               espPartes.push(`${label}: ${e.detalles[k]}`);
            }
         }
       }
       especificacionesStr = espPartes.join('\n');

       if (e.detalles.tieneTeclado || e.detalles.marcaTeclado || e.detalles.serieTeclado || e.detalles.numeroInventarioTeclado) {
          tecladoStr = `Marca: ${e.detalles.marcaTeclado || 'N/A'}\nModelo: ${e.detalles.modeloTeclado || 'N/A'}\nSN: ${e.detalles.serieTeclado || 'N/A'}\nInv: ${e.detalles.numeroInventarioTeclado || 'N/A'}`;
       }
       if (e.detalles.tieneMouse || e.detalles.marcaMouse || e.detalles.serieMouse || e.detalles.numeroInventarioMouse) {
          mouseStr = `Marca: ${e.detalles.marcaMouse || 'N/A'}\nModelo: ${e.detalles.modeloMouse || 'N/A'}\nSN: ${e.detalles.serieMouse || 'N/A'}\nInv: ${e.detalles.numeroInventarioMouse || 'N/A'}`;
       }
       if (e.detalles.tieneCargador || e.detalles.marcaCargador || e.detalles.serieCargador || e.detalles.numeroInventarioCargador) {
          cargadorStr = `Marca: ${e.detalles.marcaCargador || 'N/A'}\nModelo: ${e.detalles.modeloCargador || 'N/A'}\nSN: ${e.detalles.serieCargador || 'N/A'}\nInv: ${e.detalles.numeroInventarioCargador || 'N/A'}`;
       }
       if (e.detalles.tieneDiadema || e.detalles.marcaDiadema || e.detalles.serieDiadema || e.detalles.numeroInventarioDiadema) {
          diademaStr = `Marca: ${e.detalles.marcaDiadema || 'N/A'}\nModelo: ${e.detalles.modeloDiadema || 'N/A'}\nSN: ${e.detalles.serieDiadema || 'N/A'}\nInv: ${e.detalles.numeroInventarioDiadema || 'N/A'}`;
       }
    }

    const rowData = {
      tipo: e.tipo || 'N/A',
      responsable: e.responsable ? `${e.responsable}${e.cargoResponsable ? `\n${e.cargoResponsable}` : ''}` : 'N/A',
      numeroInventario: e.numeroInventario || 'N/A',
      numeroSerie: e.numeroSerie || 'N/A',
      marcaModelo: `${e.marca || 'N/A'} \n ${e.modelo || 'N/A'}`,
      direccion: e.direccion || 'N/A',
      areaUbicacion: e.areaUbicacion || 'N/A',
      procedencia: e.procedencia || 'N/A',
      estatus: e.estatus || 'Activo',
      especificaciones: especificacionesStr,
      monitores: monitoresStr,
      teclado: tecladoStr,
      mouse: mouseStr,
      cargador: cargadorStr,
      diadema: diademaStr,
    };
    if (tieneImagenes) rowData.evidencia = '';
    const row = sheet.addRow(rowData);
    const rowNumber = row.number;
    if (tieneImagenes && e.evidencias && e.evidencias.length > 0) {
      const imgEv = e.evidencias.find(ev => ev.mimetype?.startsWith('image/'));
      if (imgEv) {
        row.height = 90;
        const colIndex = 8; // 'evidencia' column index (0-based)
        await insertarImagenEvidencia(workbook, sheet, rowNumber - 1, colIndex, e.evidencias);
      }
    }
  }

  aplicarEstiloTabla(sheet);
  return workbook.xlsx.writeBuffer();
}

async function exportarHerramientasExcel(herramientas, tipo = 'herramienta_infra', incluirImagenes = true) {
  const workbook = new ExcelJS.Workbook();
  const esInfra = tipo === 'herramienta_infra';
  const nombreHoja = esInfra ? 'Herramientas Infraestructura' : 'Herramientas Tecnológicas';
  const sheet = workbook.addWorksheet(nombreHoja);

  sheet.views = [{ showGridLines: true }];

  if (esInfra) {
    // Encabezado institucional estilo SITMAH
    sheet.mergeCells('B1:G1');
    const titleCell1 = sheet.getCell('B1');
    titleCell1.value = 'SISTEMA INTEGRADO DE TRANSPORTE MASIVO DE HIDALGO (SITMAH)';
    titleCell1.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF000000' } };
    titleCell1.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('B2:G2');
    const titleCell2 = sheet.getCell('B2');
    titleCell2.value = 'FORMATO DE INVENTARIO DE EQUIPOS';
    titleCell2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF000000' } };
    titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('B3:C3');
    const depLabel = sheet.getCell('B3');
    depLabel.value = 'Departamento: Infraestructura';
    depLabel.font = { name: 'Segoe UI', size: 10, bold: true };
    depLabel.alignment = { vertical: 'middle', horizontal: 'left' };

    sheet.mergeCells('E3:G3');
    const fechaLabel = sheet.getCell('E3');
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    fechaLabel.value = `Fecha de actualización: ${dia}/${mes}/${anio}`;
    fechaLabel.font = { name: 'Segoe UI', size: 10, bold: true };
    fechaLabel.alignment = { vertical: 'middle', horizontal: 'right' };

    // Fila 5: Cabeceras de columnas
    const headerRow = sheet.getRow(5);
    headerRow.values = [
      '',
      'No. Inventario',
      'Equipo',
      'Cantidad',
      'Marca',
      'Modelo',
      'Estado Físico',
      'Imagen'
    ];
    headerRow.height = 28;

    headerRow.eachCell((cell, colNumber) => {
      if (colNumber > 1) {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      }
    });

    sheet.getColumn(1).width = 4;
    sheet.getColumn(2).width = 20; // No. Inventario
    sheet.getColumn(3).width = 38; // Equipo
    sheet.getColumn(4).width = 14; // Cantidad
    sheet.getColumn(5).width = 20; // Marca
    sheet.getColumn(6).width = 20; // Modelo
    sheet.getColumn(7).width = 16; // Estado Físico
    sheet.getColumn(8).width = 32; // Imagen

    let currentRow = 6;
    for (let i = 0; i < herramientas.length; i++) {
      const item = herramientas[i];
      const detalles = item.detalles || {};
      const equipoNombre = detalles.equipo || item.modelo || 'Sin nombre';
      const modeloTec = detalles.modeloTecnico || (detalles.equipo ? item.modelo : '-');
      const cantidad = detalles.cantidad !== undefined ? detalles.cantidad : 1;
      const estadoFisico = detalles.estadoFisico || item.estatus || 'Bueno';
      const imagenes = detalles.imagenes?.length
        ? detalles.imagenes
        : detalles.imagen
        ? [detalles.imagen]
        : [];

      const row = sheet.getRow(currentRow);
      row.values = [
        '',
        item.numeroInventario || 'INF-S/N',
        equipoNombre,
        cantidad,
        item.marca || '-',
        modeloTec || '-',
        estadoFisico,
        ''
      ];
      row.height = imagenes.length > 0 && incluirImagenes ? 75 : 35;

      row.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: [2, 4, 7].includes(colNumber) ? 'center' : 'left',
            wrapText: true
          };
        }
      });

      if (incluirImagenes && imagenes.length > 0) {
        for (let imgIdx = 0; imgIdx < Math.min(imagenes.length, 3); imgIdx++) {
          const imgSrc = imagenes[imgIdx];
          if (imgSrc && typeof imgSrc === 'string' && imgSrc.startsWith('data:image/')) {
            try {
              const parts = imgSrc.split(';base64,');
              if (parts.length === 2 && parts[1]) {
                const mime = parts[0].replace('data:image/', '').toLowerCase();
                const ext = mime.includes('png') ? 'png' : 'jpeg';
                const imageId = workbook.addImage({
                  base64: parts[1],
                  extension: ext
                });

                sheet.addImage(imageId, {
                  tl: { col: 7.05 + (imgIdx * 0.32), row: currentRow - 1 + 0.08 },
                  ext: { width: 55, height: 65 },
                  editAs: 'oneCell'
                });
              }
            } catch (err) {
              console.error('Error insertando imagen base64 en Excel:', err.message);
            }
          }
        }
      }

      currentRow++;
    }
  } else {
    // Para Herramientas Tecnológicas
    sheet.columns = [
      { header: 'Tipo', key: 'tipo', width: 22 },
      { header: 'No. Inventario', key: 'numeroInventario', width: 20 },
      { header: 'No. Serie', key: 'numeroSerie', width: 20 },
      { header: 'Nombre / Modelo', key: 'modelo', width: 30 },
      { header: 'Marca', key: 'marca', width: 18 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Ubicación', key: 'areaUbicacion', width: 22 },
      { header: 'Estado Físico', key: 'estatus', width: 16 },
      { header: 'Imagen', key: 'imagen', width: 28 },
    ];

    aplicarEstiloTabla(sheet);

    for (let i = 0; i < herramientas.length; i++) {
      const item = herramientas[i];
      const detalles = item.detalles || {};
      const equipoNombre = detalles.equipo || item.modelo || 'Sin nombre';
      const cantidad = detalles.cantidad !== undefined ? detalles.cantidad : 1;
      const estadoFisico = detalles.estadoFisico || item.estatus || 'Bueno';
      const imagenes = detalles.imagenes?.length
        ? detalles.imagenes
        : detalles.imagen
        ? [detalles.imagen]
        : [];

      const row = sheet.addRow({
        tipo: 'Herramienta Tecnológica',
        numeroInventario: item.numeroInventario || 'TEC-S/N',
        numeroSerie: item.numeroSerie || '-',
        modelo: equipoNombre,
        marca: item.marca || '-',
        cantidad: cantidad,
        areaUbicacion: item.areaUbicacion || 'Mantenimiento',
        estatus: estadoFisico,
        imagen: ''
      });

      const rowNumber = row.number;
      row.height = imagenes.length > 0 && incluirImagenes ? 75 : 35;

      if (incluirImagenes && imagenes.length > 0) {
        for (let imgIdx = 0; imgIdx < Math.min(imagenes.length, 3); imgIdx++) {
          const imgSrc = imagenes[imgIdx];
          if (imgSrc && typeof imgSrc === 'string' && imgSrc.startsWith('data:image/')) {
            try {
              const parts = imgSrc.split(';base64,');
              if (parts.length === 2 && parts[1]) {
                const mime = parts[0].replace('data:image/', '').toLowerCase();
                const ext = mime.includes('png') ? 'png' : 'jpeg';
                const imageId = workbook.addImage({
                  base64: parts[1],
                  extension: ext
                });

                sheet.addImage(imageId, {
                  tl: { col: 8.05 + (imgIdx * 0.32), row: rowNumber - 1 + 0.08 },
                  ext: { width: 55, height: 65 },
                  editAs: 'oneCell'
                });
              }
            } catch (err) {
              console.error('Error insertando imagen base64 en Excel:', err.message);
            }
          }
        }
      }
    }
  }

  return workbook.xlsx.writeBuffer();
}

async function exportarInventarioMobiliario(mobiliario) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventario Mobiliario');

  sheet.columns = [
    { header: 'NO. DE INVENTARIO', key: 'numeroInventario', width: 22 },
    { header: 'BIEN', key: 'bien', width: 25 },
    { header: 'MARCA', key: 'marca', width: 20 },
    { header: 'MODELO', key: 'modelo', width: 20 },
    { header: 'NO. DE SERIE', key: 'numeroSerie', width: 22 },
    { header: 'DESCRIPCIÓN', key: 'descripcion', width: 35 },
    { header: 'DIRECCIÓN', key: 'direccion', width: 25 },
    { header: 'SUBDIRECCIÓN', key: 'subdireccion', width: 25 },
    { header: 'ÁREA', key: 'area', width: 25 },
    { header: 'NOMBRE DEL RESGUARDANTE', key: 'nombreResguardante', width: 30 },
  ];

  for (let i = 0; i < mobiliario.length; i++) {
    const m = mobiliario[i];
    
    sheet.addRow({
      numeroInventario: m.numeroInventario || 'S/N',
      bien: m.bien || 'N/A',
      marca: m.marca || 'S/M',
      modelo: m.modelo || 'S/M',
      numeroSerie: m.numeroSerie || 'S/S',
      descripcion: m.descripcion || 'N/A',
      direccion: m.direccion || 'N/A',
      subdireccion: m.subdireccion || 'N/A',
      area: m.area || 'N/A',
      nombreResguardante: m.nombreResguardante || 'N/A',
    });
  }

  aplicarEstiloTabla(sheet);
  return workbook.xlsx.writeBuffer();
}

module.exports = {
  exportarReportesOficina,
  exportarReportesSemaforo,
  exportarInventarioExistencias,
  exportarInventarioMobiliario,
  exportarHerramientasExcel
};



