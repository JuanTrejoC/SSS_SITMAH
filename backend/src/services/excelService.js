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

async function exportarReportesInfraestructura(reportes, incluirImagenes = false) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Reportes Infraestructura');

  const tieneImagenes = incluirImagenes && reportes.some(r => r.evidencias && r.evidencias.some(ev => ev.mimetype?.startsWith('image/')));

  sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Folio', key: 'folio', width: 18 },
    { header: 'Solicitante', key: 'solicitante', width: 25 },
    { header: 'Cargo', key: 'cargo', width: 22 },
    { header: 'Área / Dirección', key: 'area', width: 25 },
    { header: 'Sede / Instalación', key: 'sede', width: 22 },
    { header: 'Elemento / Falla', key: 'equipo', width: 22 },
    { header: 'No. Serie / Ref', key: 'numeroSerie', width: 18 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Prioridad', key: 'prioridad', width: 14 },
    { header: 'Estado', key: 'estado', width: 14 },
    { header: 'Descripción', key: 'descripcion', width: 35 },
    { header: 'Diagnóstico / Solución', key: 'diagnosticoSolucion', width: 35 },
    { header: 'Técnico Atendió', key: 'tecnicoAtendio', width: 25 },
    { header: 'Fecha Reporte', key: 'fecha', width: 22 },
    { header: 'Fecha Resolución', key: 'fechaResolucion', width: 22 },
    ...(tieneImagenes ? [{ header: 'Evidencia', key: 'evidencia', width: 22 }] : []),
  ];

  for (let i = 0; i < reportes.length; i++) {
    const r = reportes[i];
    const rowData = {
      id: r.id,
      folio: r.folio,
      solicitante: r.solicitante,
      cargo: r.cargo?.nombre || 'General',
      area: r.area?.nombre || 'N/A',
      sede: r.sede?.nombre || 'N/A',
      equipo: r.equipo || 'Infraestructura General',
      numeroSerie: r.numeroSerie || 'S/N',
      categoria: r.categoria?.nombre || 'Infraestructura',
      prioridad: r.prioridad,
      estado: r.estado,
      descripcion: r.descripcion || '',
      diagnosticoSolucion: r.diagnosticoSolucion || 'Pendiente',
      tecnicoAtendio: r.tecnicoAtendio || (r.atendidoPor?.nombre || 'No asignado'),
      fecha: r.createdAt?.toISOString(),
      fechaResolucion: r.fechaResolucion?.toISOString() || 'Pendiente',
    };

    if (tieneImagenes) {
      rowData.evidencia = '';
    }

    const row = sheet.addRow(rowData);
    const rowNumber = row.number;

    if (tieneImagenes && r.evidencias && r.evidencias.length > 0) {
      const imgEv = r.evidencias.find(ev => ev.mimetype?.startsWith('image/'));
      if (imgEv) {
        row.height = 90;
        const colIndex = 16; // columna 'evidencia'
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

const MAPA_TIPOS_EQUIPO = {
  escritorio: 'Escritorio',
  laptop: 'Laptop',
  tableta: 'Tableta',
  servidor: 'Servidor',
  teclado: 'Teclado',
  mouse: 'Mouse',
  adaptador: 'Adaptador / Hub USB',
  antena_wifi: 'Antena / Adaptador WiFi',
  cargador: 'Cargador / Eliminador',
  cable: 'Cable (HDMI, Red, DisplayPort)',
  router: 'Router',
  switch: 'Switch',
  firewall: 'Firewall',
  access_point: 'Access Point',
  antena: 'Antena Microonda',
  internet: 'Internet / Módem',
  camara: 'Cámara de Videovigilancia',
  dvr: 'DVR',
  impresora: 'Impresora',
  plotter: 'Plotter',
  pantalla: 'Pantalla',
  monitor: 'Monitor',
  videowall: 'Controlador de Videowall',
  celular: 'Celular',
  telefono: 'Teléfono',
  radio: 'Radio',
  aire: 'Aire Acondicionado',
  no_break: 'No Break (UPS)',
  regulador: 'Regulador',
  lectora_tags: 'Lectora de Tags',
  controladora: 'Controladora',
  terminal_multibiometrica: 'Terminal Multibiométrica',
  ram: 'Memoria RAM',
  almacenamiento: 'Disco Duro / SSD',
  cabezal: 'Cabezal de Impresión',
  refaccion: 'Refacción',
  herramienta_tec: 'Herramienta Tecnológica',
  herramienta_infra: 'Herramienta de Infraestructura',
  otro: 'Otro'
};

function formatearTipoEquipo(tipo, detalles) {
  if (!tipo) return 'N/A';
  const tipoNorm = String(tipo).toLowerCase().trim();
  
  if (tipoNorm === 'otro') {
    const custom = detalles?.nombre || detalles?.nombreEquipo || detalles?.especificarTipo || detalles?.otroTipo;
    if (custom && String(custom).trim()) {
      const customTrim = String(custom).trim();
      const customCap = customTrim.charAt(0).toUpperCase() + customTrim.slice(1);
      return `${customCap} (Otro)`;
    }
    return 'Otro';
  }

  if (MAPA_TIPOS_EQUIPO[tipoNorm]) {
    return MAPA_TIPOS_EQUIPO[tipoNorm];
  }

  return tipoNorm
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatearEstatus(estatus) {
  if (!estatus) return 'Activo';
  const estNorm = String(estatus).toLowerCase().trim();
  const mapa = {
    activo: 'Activo',
    operando: 'Operando',
    stock: 'Stock',
    refacciones: 'Refacciones',
    mantenimiento: 'Mantenimiento',
    baja: 'Baja',
    'en reparacion': 'En Reparación',
    'en reparación': 'En Reparación',
    'por reparar': 'Por Reparar',
    'buen estado': 'Buen Estado',
    regular: 'Regular',
    dañada: 'Dañada',
    danada: 'Dañada',
    dañado: 'Dañado',
    danado: 'Dañado'
  };
  return mapa[estNorm] || (estatus.charAt(0).toUpperCase() + estatus.slice(1));
}

function formatearTextoCapitalizado(texto) {
  if (!texto) return 'N/A';
  const str = String(texto).trim();
  if (str === '' || str.toUpperCase() === 'N/A') return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function exportarInventarioExistencias(existencias, incluirImagenes = false) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventario Tecnológico');

  const tieneImagenes = incluirImagenes && existencias.some(e => e.evidencias && e.evidencias.some(ev => ev.mimetype?.startsWith('image/')));

  sheet.columns = [
    { header: 'Tipo de Equipo', key: 'tipo', width: 22 },
    { header: 'Responsable', key: 'responsable', width: 28 },
    { header: 'No. de Inventario', key: 'numeroInventario', width: 22 },
    { header: 'No. de Serie', key: 'numeroSerie', width: 22 },
    { header: 'Marca / Modelo', key: 'marcaModelo', width: 26 },
    { header: 'Área', key: 'direccion', width: 24 },
    { header: 'Ubicación', key: 'areaUbicacion', width: 24 },
    { header: 'Procedencia', key: 'procedencia', width: 20 },
    { header: 'Estatus', key: 'estatus', width: 16 },
    { header: 'Especificaciones Técnicas', key: 'especificaciones', width: 36 },
    { header: 'Monitores', key: 'monitores', width: 35 },
    { header: 'Teclado', key: 'teclado', width: 25 },
    { header: 'Mouse', key: 'mouse', width: 25 },
    { header: 'Cargador', key: 'cargador', width: 25 },
    { header: 'Diadema / Auricular', key: 'diadema', width: 25 },
    ...(tieneImagenes ? [{ header: 'Evidencia', key: 'evidencia', width: 25 }] : []),
  ];

  for (let i = 0; i < existencias.length; i++) {
    const e = existencias[i];
    
    let det = e.detalles;
    if (typeof det === 'string') {
      try { det = JSON.parse(det); } catch { det = {}; }
    }

    let especificacionesStr = '';
    let monitoresStr = '';
    let tecladoStr = '';
    let mouseStr = '';
    let cargadorStr = '';
    let diademaStr = '';

    if (det && typeof det === 'object') {
       const espPartes = [];
       const mapKeys = {
         procesador: 'Procesador',
         ram: 'Memoria RAM',
         almacenamiento: 'Almacenamiento',
         tipoAlmacenamiento: 'Tipo de Almacenamiento',
         sistemaOperativo: 'Sistema Operativo',
         tarjetaGrafica: 'Tarjeta Gráfica',
         red: 'Conectividad de Red',
         mac: 'Dirección MAC',
         ipPredeterminada: 'Dirección IP',
         pantallasAsignadas: 'Pantallas Asignadas',
         numeroTelefono: 'Número Telefónico',
         puertos: 'Puertos',
         puertosRed: 'Puertos de Red',
         especificarTipo: 'Tipo Especificado',
         observaciones: 'Observaciones',
         capacidad: 'Capacidad',
         voltaje: 'Voltaje',
         amperaje: 'Amperaje',
         resolucion: 'Resolución',
         megapixeles: 'Megapíxeles',
         tipoToner: 'Tipo de Tóner',
         modeloToner: 'Modelo de Tóner',
         colorToner: 'Color de Tóner',
         rendimiento: 'Rendimiento'
       };

       for (let k in det) {
         if (det[k] !== undefined && det[k] !== null && typeof det[k] !== 'boolean') {
            if (k === 'monitores' && Array.isArray(det[k])) {
               const mons = det[k];
               const mPartes = [];
               mons.forEach((m, idx) => {
                 if (m.marca || m.modelo || m.serie || m.numeroInventario) {
                   mPartes.push(`Monitor ${idx + 1}:\nMarca: ${m.marca || 'N/A'}\nModelo: ${m.modelo || 'N/A'}\nNo. Serie: ${m.serie || 'N/A'}\nNo. Inventario: ${m.numeroInventario || 'N/A'}\n`);
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
            } else if (k === 'cantidadMonitores' || k === 'tieneMonitores' || k === 'tieneCargador' || k === 'tieneDiadema' || k === 'tieneTeclado' || k === 'tieneMouse') {
               // Omitir booleanos/flags
            } else {
               const label = mapKeys[k] || k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1');
               let valStr = String(det[k]);
               if (k === 'red') {
                 const rLow = valStr.toLowerCase();
                 if (rLow === 'wifi') valStr = 'WiFi';
                 else if (rLow === 'ethernet') valStr = 'Ethernet';
                 else if (rLow === 'ambos') valStr = 'Ethernet y WiFi';
               }
               espPartes.push(`${label}: ${valStr}`);
            }
         }
       }
       especificacionesStr = espPartes.join('\n');

       if (det.tieneTeclado || det.marcaTeclado || det.serieTeclado || det.numeroInventarioTeclado || det.modeloTeclado) {
          tecladoStr = `Marca: ${det.marcaTeclado || 'N/A'}\nModelo: ${det.modeloTeclado || 'N/A'}\nNo. Serie: ${det.serieTeclado || 'N/A'}\nNo. Inventario: ${det.numeroInventarioTeclado || 'N/A'}`;
       }
       if (det.tieneMouse || det.marcaMouse || det.serieMouse || det.numeroInventarioMouse || det.modeloMouse) {
          mouseStr = `Marca: ${det.marcaMouse || 'N/A'}\nModelo: ${det.modeloMouse || 'N/A'}\nNo. Serie: ${det.serieMouse || 'N/A'}\nNo. Inventario: ${det.numeroInventarioMouse || 'N/A'}`;
       }
       if (det.tieneCargador || det.marcaCargador || det.serieCargador || det.numeroInventarioCargador || det.modeloCargador) {
          cargadorStr = `Marca: ${det.marcaCargador || 'N/A'}\nModelo: ${det.modeloCargador || 'N/A'}\nNo. Serie: ${det.serieCargador || 'N/A'}\nNo. Inventario: ${det.numeroInventarioCargador || 'N/A'}`;
       }
       if (det.tieneDiadema || det.marcaDiadema || det.serieDiadema || det.numeroInventarioDiadema || det.modeloDiadema) {
          diademaStr = `Marca: ${det.marcaDiadema || 'N/A'}\nModelo: ${det.modeloDiadema || 'N/A'}\nNo. Serie: ${det.serieDiadema || 'N/A'}\nNo. Inventario: ${det.numeroInventarioDiadema || 'N/A'}`;
       }
    }

    const rowData = {
      tipo: formatearTipoEquipo(e.tipo, det),
      responsable: e.responsable ? `${e.responsable}${e.cargoResponsable ? `\n${e.cargoResponsable}` : ''}` : 'N/A',
      numeroInventario: e.numeroInventario || 'N/A',
      numeroSerie: e.numeroSerie || 'N/A',
      marcaModelo: `${e.marca || 'N/A'} \n ${e.modelo || 'N/A'}`,
      direccion: e.direccion || 'N/A',
      areaUbicacion: e.areaUbicacion || 'N/A',
      procedencia: formatearTextoCapitalizado(e.procedencia),
      estatus: formatearEstatus(e.estatus),
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
    // Encabezado institucional estilo SITRAC-H
    sheet.mergeCells('B1:G1');
    const titleCell1 = sheet.getCell('B1');
    titleCell1.value = 'SITRAC-H - SISTEMA INTELIGENTE DE TRÁNSITO, RESGUARDO Y AUTOMATIZACIÓN DE CONTROL DE HIDALGO';
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
      { header: 'Nombre / Herramienta', key: 'modelo', width: 32 },
      { header: 'Marca', key: 'marca', width: 18 },
      { header: 'Modelo', key: 'modeloTecnico', width: 18 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Estado Físico', key: 'estatus', width: 16 },
      { header: 'Imagen', key: 'imagen', width: 32 },
    ];

    aplicarEstiloTabla(sheet);

    for (let i = 0; i < herramientas.length; i++) {
      const item = herramientas[i];
      const detalles = item.detalles || {};
      const equipoNombre = detalles.equipo || item.modelo || 'Sin nombre';
      const modeloTec = detalles.modeloTecnico || '-';
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
        modeloTecnico: modeloTec,
        cantidad: cantidad,
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

async function exportarControladoresSemaforoExcel(controladores, meta = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SITRAC-H';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Controladores Semafóricos', {
    views: [{ showGridLines: true }]
  });

  const TOTAL_COLUMNAS = 13;

  // 1. BANNER INSTITUCIONAL (Filas 1 a 3)
  sheet.mergeCells('A1:M1');
  const title1 = sheet.getCell('A1');
  title1.value = 'SITRAC-H — SISTEMA INTELIGENTE DE TRÁNSITO, RESGUARDO Y AUTOMATIZACIÓN DE CONTROL';
  title1.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF691B31' } }; // Guinda
  title1.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells('A2:M2');
  const title2 = sheet.getCell('A2');
  title2.value = 'INVENTARIO GENERAL DE CONTROLADORES SEMAFÓRICOS INSTALADOS';
  title2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF691B31' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF8EE' } }; // Crema/Dorado suave
  title2.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(2).height = 22;

  sheet.mergeCells('A3:M3');
  const title3 = sheet.getCell('A3');
  const fechaMex = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const horaMex = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const filtroTexto = (meta.search || meta.modelo)
    ? `Filtros: ${meta.modelo ? `[Modelo: ${meta.modelo}] ` : ''}${meta.search ? `[Búsqueda: "${meta.search}"]` : ''} | Total: ${controladores.length} controlador(es)`
    : `Inventario Completo | Total: ${controladores.length} controlador(es) registrados`;
  title3.value = `Emisión: ${fechaMex} a las ${horaMex} hrs  |  ${filtroTexto}`;
  title3.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  title3.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(3).height = 20;

  // Fila 4: Separador visual
  sheet.getRow(4).height = 8;

  // 2. CONFIGURACIÓN DE COLUMNAS (Fila 5)
  sheet.getRow(5).height = 32;
  const columnasDef = [
    { key: 'num', header: 'No.', width: 6 },
    { key: 'modelo', header: 'Modelo', width: 16 },
    { key: 'crucero', header: 'Crucero / Intersección', width: 34 },
    { key: 'gabinete', header: 'No. Gabinete', width: 16 },
    { key: 'cabezales', header: 'Cabezales (3L / 4L)', width: 22 },
    { key: 'leds', header: 'Desglose de LEDs', width: 26 },
    { key: 'peatonal', header: 'Accesibilidad Peatonal', width: 28 },
    { key: 'electronica', header: 'Electrónica Interna', width: 30 },
    { key: 'red', header: 'Red y Conectividad', width: 28 },
    { key: 'postes', header: 'Postes del Crucero', width: 36 },
    { key: 'camaras', header: 'Cámaras', width: 20 },
    { key: 'estadoFisico', header: 'Estado Base y Registros', width: 24 },
    { key: 'observaciones', header: 'Observaciones', width: 34 }
  ];

  sheet.columns = columnasDef.map(c => ({ key: c.key, width: c.width }));

  // Re-asignar fila de cabecera en fila 5 manualmente para respetar el banner superior
  const headerRow = sheet.getRow(5);
  columnasDef.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF691B31' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF691B31' } },
      bottom: { style: 'medium', color: { argb: 'FF691B31' } },
      left: { style: 'thin', color: { argb: 'FF8A2441' } },
      right: { style: 'thin', color: { argb: 'FF8A2441' } }
    };
  });

  // 3. AGREGAR DATOS
  let totalCabezalesSum = 0;
  let totalLedsSum = 0;

  for (let i = 0; i < controladores.length; i++) {
    const ctrl = controladores[i];
    const rowNum = 6 + i;

    // Normalizar postes con modelo, tipo y coordenadas
    let postesList = [];
    if (typeof ctrl.postesDetalle === 'string') {
      try { postesList = JSON.parse(ctrl.postesDetalle); } catch (e) { postesList = []; }
    } else if (Array.isArray(ctrl.postesDetalle)) {
      postesList = ctrl.postesDetalle;
    }

    const postesStr = postesList.length > 0
      ? `${postesList.length} poste(s):\n` + postesList.map((p, idx) => {
          const mod = p.modeloPoste || p.modelo || p.posteModeloTipo || 'S/M';
          const tipo = p.tipoPoste === 'peatonal' ? 'Peatonal' : (p.tipoPoste === 'mixto' ? 'Vehicular' : (p.tipoPoste || ''));
          const tipoText = tipo ? ` (${tipo})` : '';
          const ubic = p.ubicacionPoste || p.coordenadas;
          const coords = ubic ? ` [${ubic}]` : '';
          return `• Poste ${idx + 1}: ${mod}${tipoText}${coords}`;
        }).join('\n')
      : '0 postes registrados';

    const sem3L = Number(ctrl.semaforos3Luces) || 0;
    const sem4L = Number(ctrl.semaforos4Luces) || 0;
    const totalCab = sem3L + sem4L;
    totalCabezalesSum += totalCab;

    const ledsV = Number(ctrl.totalLedsVerdes) || 0;
    const ledsR = Number(ctrl.totalLedsRojos) || 0;
    const ledsA = Number(ctrl.totalLedsAmarillos) || 0;
    const flechasV = Number(ctrl.totalFlechasVerdes) || 0;
    const flechasR = Number(ctrl.totalFlechasRojas) || 0;
    const totalLeds = ledsV + ledsR + ledsA + flechasV + flechasR;
    totalLedsSum += totalLeds;

    // Cabezales string
    const cabezalesStr = `3 Luces: ${sem3L}\n4 Luces: ${sem4L}\nTotal: ${totalCab} cabezal(es)`;

    // LEDs string
    const ledsStr = `Verdes: ${ledsV}${flechasV ? ` (${flechasV} fl.)` : ''}\nRojos: ${ledsR}${flechasR ? ` (${flechasR} fl.)` : ''}\nAmarillos: ${ledsA}\nTotal LEDs: ${totalLeds}`;

    // Peatonal / Accesibilidad
    const peatPartes = [];
    if (ctrl.pasoPeatonal) peatPartes.push('• Paso Peatonal: SÍ');
    if (ctrl.audible) peatPartes.push('• Audible: SÍ');
    if (ctrl.pantallaLed) peatPartes.push('• Pantalla LED: SÍ');
    if (ctrl.botonera) peatPartes.push('• Botonera: SÍ');
    const peatonalStr = peatPartes.length > 0 ? peatPartes.join('\n') : 'Sin dispositivos peatonales';

    // Electrónica interna
    const elecPartes = [];
    elecPartes.push(`CPU: ${ctrl.cpu ? 'Sí' : 'No'}`);
    elecPartes.push(`Relés: ${ctrl.tarjetaRelevadora ? (ctrl.tarjetaRelevadoresModelo ? `Sí (${ctrl.tarjetaRelevadoresModelo})` : 'Sí') : 'No'}`);
    elecPartes.push(`Fuente: ${ctrl.fuentePoder ? 'Sí' : 'No'}`);
    if (ctrl.gps) elecPartes.push(`GPS: Sí (${ctrl.gpsModelo || 'Instalado'})`);
    const electronicaStr = elecPartes.join('\n');

    // Red y Conectividad
    const redPartes = [];
    if (ctrl.ipLocal) redPartes.push(`IP Local: ${ctrl.ipLocal}`);
    if (ctrl.ipSystem) redPartes.push(`IP Sistema: ${ctrl.ipSystem}`);
    if (ctrl.versionFirmware) redPartes.push(`Firmware: ${ctrl.versionFirmware}`);
    if (ctrl.switch) redPartes.push(`Switch: ${ctrl.switchFibraMarca || ''} ${ctrl.switchFibraModelo || ''}`.trim() || 'Sí');
    if (ctrl.fibraOptica) redPartes.push('Fibra Óptica: Sí');
    const redStr = redPartes.length > 0 ? redPartes.join('\n') : 'Sin configuración de red';

    // Cámaras
    const camarasStr = ctrl.camaraCantidad
      ? `${ctrl.camaraCantidad} cámara(s)\nModelo: ${ctrl.camaraModelo || 'Estándar'}`
      : (ctrl.camaraModelo ? `Cámaras: ${ctrl.camaraModelo}` : 'Ninguna');

    // Estado Base y Registros
    const estadoPartes = [];
    const regDanados = Number(ctrl.registrosPisoDanados) || 0;
    if (regDanados > 0) estadoPartes.push(`⚠️ ${regDanados} REG. DAÑADO(S)`);
    else estadoPartes.push('Registros: En buen estado');
    if (ctrl.cimientoCompleto) estadoPartes.push(`Cimiento: ${ctrl.cimientoCompleto}`);
    if (ctrl.tapaCableado) estadoPartes.push(`Tapa cableado: ${ctrl.tapaCableado}`);
    const estadoStr = estadoPartes.join('\n');

    // Observaciones
    const obsStr = ctrl.observacionesExterior || ctrl.posteObservaciones || 'Sin observaciones registradas';

    const row = sheet.getRow(rowNum);
    row.values = [
      i + 1,
      ctrl.modelo || '—',
      ctrl.crucero?.nombre || (ctrl.cruceroId ? `Crucero #${ctrl.cruceroId}` : 'Sin Asignar'),
      ctrl.numeroGabinete || '—',
      cabezalesStr,
      ledsStr,
      peatonalStr,
      electronicaStr,
      redStr,
      postesStr,
      camarasStr,
      estadoStr,
      obsStr
    ];

    // Formateo de celdas de datos
    const esPar = i % 2 === 0;
    const bgCol = esPar ? 'FFFFFFFF' : 'FFF9FAFB'; // Alternar blanco y gris sutil

    // Altura dinámica según líneas de contenido para evitar texto cortado
    const maxLineas = Math.max(
      postesList.length + 1,
      elecPartes.length,
      redPartes.length,
      estadoPartes.length,
      3
    );
    row.height = Math.max(46, Math.min(130, maxLineas * 15 + 10));

    for (let c = 1; c <= TOTAL_COLUMNAS; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgCol } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Alineaciones según la columna
      if (c === 1 || c === 4 || c === 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF691B31' } };
      } else if (c === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
      } else if (c === 12 && regDanados > 0) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFDC2626' } }; // Rojo si hay dañados
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    }
  }

  // 4. FILA DE RESUMEN FINAL
  const finalRowNum = 6 + controladores.length;
  sheet.mergeCells(`A${finalRowNum}:D${finalRowNum}`);
  const totalLabelCell = sheet.getCell(`A${finalRowNum}`);
  totalLabelCell.value = `TOTALES (${controladores.length} CONTROLADORES)`;
  totalLabelCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF691B31' } };
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF8EE' } };

  const totalCabCell = sheet.getCell(`E${finalRowNum}`);
  totalCabCell.value = `${totalCabezalesSum} Cabezales`;
  totalCabCell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF691B31' } };
  totalCabCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalCabCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF8EE' } };

  const totalLedsCell = sheet.getCell(`F${finalRowNum}`);
  totalLedsCell.value = `${totalLedsSum} LEDs`;
  totalLedsCell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF691B31' } };
  totalLedsCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalLedsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF8EE' } };

  sheet.mergeCells(`G${finalRowNum}:M${finalRowNum}`);
  const summaryEmpty = sheet.getCell(`G${finalRowNum}`);
  summaryEmpty.value = 'SITRAC-H — Dirección de Control y Dispositivos Viales';
  summaryEmpty.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  summaryEmpty.alignment = { vertical: 'middle', horizontal: 'center' };
  summaryEmpty.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF8EE' } };

  sheet.getRow(finalRowNum).height = 28;

  for (let c = 1; c <= TOTAL_COLUMNAS; c++) {
    sheet.getCell(finalRowNum, c).border = {
      top: { style: 'medium', color: { argb: 'FF691B31' } },
      bottom: { style: 'medium', color: { argb: 'FF691B31' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  }

  return workbook.xlsx.writeBuffer();
}

module.exports = {
  exportarReportesOficina,
  exportarReportesInfraestructura,
  exportarReportesSemaforo,
  exportarInventarioExistencias,
  exportarInventarioMobiliario,
  exportarHerramientasExcel,
  exportarControladoresSemaforoExcel
};




