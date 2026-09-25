const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

const oldLine = /const coincideCategoria = !filtroCategoria \|\| \(item\.categoria \|\| 'componente'\)\.toLowerCase\(\) === filtroCategoria\.toLowerCase\(\);/g;

const newLine = `const normalizar = str => (str || '').toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/s$/, '');
            const catFiltro = normalizar(filtroCategoria);
            const catItem = normalizar(item.categoria || item.tipo || 'componente');
            const coincideCategoria = !filtroCategoria || catItem.includes(catFiltro);`;

code = code.replace(oldLine, newLine);

fs.writeFileSync(file, code, 'utf8');
console.log('Category filter updated');
