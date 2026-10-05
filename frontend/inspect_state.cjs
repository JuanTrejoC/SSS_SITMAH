const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

const match = code.match(/const \[form, setForm\] = useState\(\{[\s\S]*?\}\);/);
console.log(match ? match[0] : "Not found");
