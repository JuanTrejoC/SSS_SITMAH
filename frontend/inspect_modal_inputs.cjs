const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
const code = fs.readFileSync(file, 'utf8');

const modalRegex = /\{modalAbierto && \([\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*\)\}/;
const matchModal = code.match(modalRegex);
if(matchModal) {
  // console.log(matchModal[0]);
  const inputs = matchModal[0].match(/<input[\s\S]*?\/>/g);
  const selects = matchModal[0].match(/<select[\s\S]*?<\/select>/g);
  console.log("Inputs:", inputs ? inputs.length : 0);
  console.log("Selects:", selects ? selects.length : 0);
  // console.log(inputs);
} else {
  console.log("Modal not found");
}

