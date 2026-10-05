const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

const start = code.indexOf('const TIPOS_EQUIPO = [');
const end = code.indexOf('];', start);
console.log(code.substring(start, end + 2));
