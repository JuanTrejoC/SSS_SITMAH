const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

const matchGuardar = code.match(/const handleGuardar = async \(e\) => \{[\s\S]*?\} catch \(error\)/);
console.log(matchGuardar ? matchGuardar[0] : "Not found");
