import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  VerticalAlign,
  Footer,
  HeightRule
} from 'docx';
import headerLogos from '../assets/header_logos.png';

function formatearFechaEspanol(fecha) {
  const f = fecha ? new Date(fecha) : new Date();
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  const dia = f.getDate().toString().padStart(2, '0');
  const mes = meses[f.getMonth()];
  const anio = f.getFullYear();
  return `PACHUCA DE SOTO, HIDALGO., A ${dia} DE ${mes} DEL ${anio}.`;
}

export async function generarResguardoDocx(resguardo) {
  let imageBuffer = null;
  try {
    const response = await fetch(headerLogos);
    imageBuffer = await response.arrayBuffer();
  } catch (e) {
    console.warn('No se pudo cargar el logo de cabecera para Word', e);
  }

  const fechaTexto = formatearFechaEspanol(resguardo.fechaPrestamo);

  // Extraer datos de resguardante, cargo y dirección
  const nombreResguardante = (
    resguardo.nombreResguardante ||
    resguardo.mobiliario?.nombreResguardante ||
    resguardo.equipoTecnologico?.responsable ||
    resguardo.existencia?.responsable ||
    ''
  ).trim();

  const cargo = (
    resguardo.cargo ||
    resguardo.mobiliario?.cargo ||
    resguardo.equipoTecnologico?.cargoResponsable ||
    resguardo.existencia?.cargoResponsable ||
    ''
  ).trim();

  const direccion = (
    resguardo.direccion ||
    resguardo.area ||
    resguardo.mobiliario?.direccion ||
    resguardo.equipoTecnologico?.direccion ||
    resguardo.equipoTecnologico?.areaUbicacion ||
    ''
  ).trim();

  const numeroSerie = (resguardo.numeroSeriePdf || resguardo.numeroSerie || resguardo.mobiliario?.numeroSerie || resguardo.equipoTecnologico?.numeroSerie || 'S/S').trim().toUpperCase();

  // Preparar título y detalle de descripción
  let tituloBien = '';
  let detalleDesc = '';

  const rawDesc = (resguardo.descripcionPdf || resguardo.observaciones || '').trim();

  if (rawDesc.includes('\n')) {
    const partes = rawDesc.split('\n').map(p => p.trim()).filter(Boolean);
    tituloBien = partes[0] || '';
    detalleDesc = partes.slice(1).join(' ');
  } else if (rawDesc) {
    if (resguardo.tipoInventario === 'mobiliario' && resguardo.mobiliario?.bien) {
      tituloBien = resguardo.mobiliario.bien.toUpperCase();
      detalleDesc = rawDesc;
    } else if (resguardo.tipoInventario === 'tecnologico' && resguardo.equipoTecnologico?.tipo) {
      tituloBien = `${resguardo.equipoTecnologico.tipo} ${resguardo.equipoTecnologico.marca || ''} ${resguardo.equipoTecnologico.modelo || ''}`.toUpperCase().trim();
      detalleDesc = rawDesc;
    } else {
      tituloBien = rawDesc;
    }
  } else {
    tituloBien = 'BIEN EN RESGUARDO';
  }

  // Párrafos para la celda de DESCRIPCIÓN
  const descripcionParagraphs = [];
  if (tituloBien) {
    descripcionParagraphs.push(
      new Paragraph({
        spacing: { before: 0, after: detalleDesc ? 120 : 0 },
        children: [
          new TextRun({
            text: tituloBien,
            font: 'Arial',
            size: 20, // 10pt
            bold: true,
            color: '000000'
          })
        ]
      })
    );
  }
  if (detalleDesc) {
    descripcionParagraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: detalleDesc,
            font: 'Arial',
            size: 19, // ~9.5pt
            color: '000000'
          })
        ]
      })
    );
  }

  const leyendaLinea1 = 'ESTE DISPOSITIVO SE DESTINA EXCLUSIVAMENTE A ACTIVIDADES LABORALES DE ENCIERRO. EN CASO DE DAÑO, EL USUARIO SERÁ RESPONSABLE DE SU REPOSICIÓN TOTAL, CUBRIENDO EL 100% DEL COSTO.';
  const leyendaLinea2 = 'QUEDANDO PROHIBIDO CUALQUIER OTRO USO NO AUTORIZADO.';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 in
              right: 1000,  // ~0.7 in
              bottom: 720, // 0.5 in
              left: 1000   // ~0.7 in
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({
                    text: 'Blvd. Felipe Ángeles Km 86 + 040',
                    font: 'Arial',
                    size: 15, // 7.5pt
                    color: '64748B'
                  }),
                  new TextRun({
                    text: 'Col. Venta Prieta',
                    break: 1,
                    font: 'Arial',
                    size: 15,
                    color: '64748B'
                  }),
                  new TextRun({
                    text: 'Pachuca de Soto, Hgo.,',
                    break: 1,
                    font: 'Arial',
                    size: 15,
                    color: '64748B'
                  }),
                  new TextRun({
                    text: 'C. P. 42083.',
                    break: 1,
                    font: 'Arial',
                    size: 15,
                    color: '64748B'
                  })
                ]
              })
            ]
          })
        },
        children: [
          // 1. LOGOS DE CABECERA (Alineados a la derecha)
          ...(imageBuffer ? [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 },
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 320,
                    height: 52
                  },
                  type: 'png'
                })
              ]
            })
          ] : []),

          // 2. FECHA Y LUGAR
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 80, after: 260 },
            children: [
              new TextRun({
                text: fechaTexto,
                font: 'Arial',
                size: 19, // ~9.5pt
                color: '000000'
              })
            ]
          }),

          // 3. TÍTULO PRINCIPAL (Rojo/Vino SITMAH)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 220 },
            children: [
              new TextRun({
                text: 'RESGUARDO DE BIENES',
                font: 'Arial',
                size: 30, // 15pt
                bold: true,
                color: '691B31'
              })
            ]
          }),

          // 4. CUADRO DE ÓRGANO SUPERIOR Y DEPENDENCIA
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              left: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              right: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 120, bottom: 60, left: 140, right: 60 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'ÓRGANO SUPERIOR',
                            font: 'Arial',
                            size: 20,
                            bold: true,
                            color: '000000'
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 120, bottom: 60, left: 60, right: 140 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'SECRETARÍA DE MOVILIDAD Y TRANSPORTE',
                            font: 'Arial',
                            size: 20,
                            color: '000000'
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 120, left: 140, right: 60 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'DEPENDENCIA',
                            font: 'Arial',
                            size: 20,
                            bold: true,
                            color: '000000'
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 120, left: 60, right: 140 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'SISTEMA INTEGRADO DE TRANSPORTE MASIVO',
                            font: 'Arial',
                            size: 20,
                            color: '000000'
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // Espacio separador
          new Paragraph({ spacing: { before: 240, after: 0 } }),

          // 5. TABLA DE DESCRIPCIÓN Y NÚMERO DE SERIE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              left: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              right: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
              insideVertical: { style: BorderStyle.SINGLE, size: 8, color: '333333' }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'DESCRIPCIÓN',
                            font: 'Arial',
                            size: 20,
                            bold: true,
                            color: '000000'
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'NÚMERO DE SERIE',
                            font: 'Arial',
                            size: 20,
                            bold: true,
                            color: '000000'
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                height: { value: 3400, rule: HeightRule.ATLEAST },
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    margins: { top: 160, bottom: 160, left: 140, right: 140 },
                    children: descripcionParagraphs
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    margins: { top: 160, bottom: 160, left: 140, right: 140 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: numeroSerie,
                            font: 'Arial',
                            size: 20,
                            color: '000000'
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // Espacio tras tabla
          new Paragraph({ spacing: { before: 180, after: 0 } }),

          // 6. CLÁUSULA DE CONDICIONES / ADVERTENCIA
          new Paragraph({
            spacing: { before: 40, after: 30 },
            children: [
              new TextRun({
                text: leyendaLinea1,
                font: 'Arial',
                size: 16, // 8pt
                color: '333333'
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: leyendaLinea2,
                font: 'Arial',
                size: 16, // 8pt
                color: '333333'
              })
            ]
          }),

          // 7. LÍNEA Y FIRMA DEL RESGUARDANTE CON DATOS AUTOMÁTICOS
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 900, after: 50 },
            children: [
              new TextRun({
                text: '________________________________________',
                font: 'Arial',
                size: 20,
                bold: true,
                color: '000000'
              })
            ]
          }),
          ...(nombreResguardante ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: nombreResguardante.toUpperCase(),
                  font: 'Arial',
                  size: 20, // 10pt
                  bold: true,
                  color: '000000'
                })
              ]
            })
          ] : [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: 'NOMBRE Y FIRMA DEL RESGUARDANTE',
                  font: 'Arial',
                  size: 20, // 10pt
                  bold: true,
                  color: '000000'
                })
              ]
            })
          ]),
          ...(cargo ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: cargo.toUpperCase(),
                  font: 'Arial',
                  size: 19, // 9.5pt
                  color: '333333'
                })
              ]
            })
          ] : []),
          ...(direccion && direccion.toUpperCase() !== 'S/N' ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: direccion.toUpperCase(),
                  font: 'Arial',
                  size: 19, // 9.5pt
                  color: '333333'
                })
              ]
            })
          ] : [])
        ]
      }
    ]
  });

  // Generar Blob y descargar
  const blob = await Packer.toBlob(doc);
  const nombreLimpio = nombreResguardante.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const nombreArchivo = `Resguardo_${nombreLimpio || 'Bienes'}.docx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
