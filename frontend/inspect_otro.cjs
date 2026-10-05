const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

const matchSelect = code.match(/<select\s*value=\{form\.tipo\}[\s\S]*?<\/select>/);
console.log(matchSelect ? matchSelect[0].substring(0, 500) : "Not found");

const matchOtro = code.match(/\{form\.tipo === 'otro'/);
console.log(matchOtro ? "Found 'otro' logic" : "No 'otro' logic found");

const matchSubmit = code.match(/const handleGuardar = async \(e\) => \{[\s\S]*?body: JSON\.stringify\(form\)/);
console.log(matchSubmit ? matchSubmit[0].substring(0, 500) : "No matchSubmit");

