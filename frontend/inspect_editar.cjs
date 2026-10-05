const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

const regex = /const handleEditar = \([\s\S]*?\}\);/m;
const match = code.match(regex);
console.log(match ? match[0] : "Not found");
