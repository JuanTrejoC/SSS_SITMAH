const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
const code = fs.readFileSync(file, 'utf8');
const modalRegex = /\{modalAbierto && \([\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*\)\}/;
const matchModal = code.match(modalRegex);
if(matchModal) {
  let text = matchModal[0];
  const inputs = text.match(/<(input|select|textarea)[^>]*>/g) || [];
  inputs.forEach(i => console.log(i));
}
