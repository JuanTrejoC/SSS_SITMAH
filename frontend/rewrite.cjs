const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/Buen Estado/g, 'Stock');
code = code.replace(/Por Reparar/g, 'Refacciones');
code = code.replace(/Dañado/g, 'Baja');
code = code.replace(/dañado/g, 'baja');
code = code.replace(/dañados/g, 'bajas');

code = code.replace(/exportarReportePDF\('buen_estado'\)/g, "exportarReportePDF('Stock')");
code = code.replace(/exportarReportePDF\('por_reparar'\)/g, "exportarReportePDF('Refacciones')");
code = code.replace(/exportarReportePDF\('danado'\)/g, "exportarReportePDF('Baja')");

fs.writeFileSync(file, code, 'utf8');
