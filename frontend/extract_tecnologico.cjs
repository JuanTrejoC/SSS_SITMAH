const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

// I want to see the form rendering in InventarioTecnologico
const start = code.indexOf('<form onSubmit={handleGuardar}>');
const end = code.indexOf('</form>', start);
console.log(code.substring(start, end + 7).substring(0, 1500));
console.log("... (truncated)");
