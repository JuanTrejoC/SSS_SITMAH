const fs = require('fs');
const code = fs.readFileSync('c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx', 'utf8');

const matchCargar = code.match(/const cargarExistencias = async \(\) => \{[\s\S]*?\} catch \(error\)/);
console.log("=== CARGAR ===");
console.log(matchCargar ? matchCargar[0] : "Not found");

const matchGuardar = code.match(/const handleGuardar = async \(e\) => \{[\s\S]*?\} catch \(error\)/);
console.log("=== GUARDAR ===");
console.log(matchGuardar ? matchGuardar[0] : "Not found");

const matchEliminar = code.match(/const handleEliminar = async \(item\) => \{[\s\S]*?\} catch \(error\)/);
console.log("=== ELIMINAR ===");
console.log(matchEliminar ? matchEliminar[0] : "Not found");

