const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

const match = code.match(/const coincideCategoria[^;]+;/);
if (match) {
    console.log(match[0]);
}

const matchFetch = code.match(/const cargar[^=]+=[^{]+\{([^}]+)\}/);
console.log("Fetch function?");

