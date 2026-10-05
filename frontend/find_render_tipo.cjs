const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

// I want to see how tipo is rendered in the table
const regex = /<td[\s\S]*?>[\s\S]*?\{item\.tipo[\s\S]*?<\/td>/;
const match = code.match(regex);
console.log(match ? match[0] : "Not found");
