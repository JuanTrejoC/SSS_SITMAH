const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

const regex = /<CustomEquipmentSelect[\s\S]*?gruposOpciones=\{gruposOpciones\}\s*\/>/;
const match = code.match(regex);
console.log(match ? match[0] : "Not found");
