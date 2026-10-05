const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioTecnologico.jsx';
const code = fs.readFileSync(file, 'utf8');

const regex = /<td[\s\S]*?<\/td>/g;
const matches = code.match(regex);
if(matches){
    matches.slice(0, 5).forEach(m => console.log(m.replace(/\n\s*/g, ' ')));
}
