const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');
const index = code.indexOf('{modalAbierto && (');
if (index > -1) {
    const lines = code.substring(0, index).split('\n').length;
    console.log("Modal starts at line: " + lines);
} else {
    console.log("Not found");
}
