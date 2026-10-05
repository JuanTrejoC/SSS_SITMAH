const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
let code = fs.readFileSync(file, 'utf8');

// I will look for TIPOS_EQUIPO.find(t => t.value === eq.tipo)?.label
// and replace it to use eq.detalles?.nombre as fallback if tipo === 'otro'

const search1 = "TIPOS_EQUIPO.find(t => t.value === eq.tipo)?.label || (eq.tipo ? eq.tipo.charAt(0).toUpperCase() + eq.tipo.slice(1) : 'Equipo')";
const search2 = "TIPOS_EQUIPO.find(t => t.value === item.tipo)?.label || (item.tipo ? item.tipo.toUpperCase() : 'EQUIPO')";

const rep1 = "eq.tipo === 'otro' ? (eq.detalles?.nombre || 'Otro') : (TIPOS_EQUIPO.find(t => t.value === eq.tipo)?.label || (eq.tipo ? eq.tipo.charAt(0).toUpperCase() + eq.tipo.slice(1) : 'Equipo'))";
const rep2 = "item.tipo === 'otro' ? ((item.detalles?.nombre || 'Otro').toUpperCase()) : (TIPOS_EQUIPO.find(t => t.value === item.tipo)?.label || (item.tipo ? item.tipo.toUpperCase() : 'EQUIPO'))";

code = code.replace(search1, rep1).replace(search2, rep2);
code = code.replace(search1, rep1).replace(search2, rep2); // Run again just in case multiple matches
code = code.replace(/TIPOS_EQUIPO\.find\(t => t\.value === eq\.tipo\)\?\.label \|\| eq\.tipo/g, "eq.tipo === 'otro' ? (eq.detalles?.nombre || 'Otro') : (TIPOS_EQUIPO.find(t => t.value === eq.tipo)?.label || eq.tipo)");

fs.writeFileSync(file, code, 'utf8');
console.log("Patched rendering of 'otro' type");
