const fs = require('fs');

const inventarioCode = fs.readFileSync('c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/backend/src/controllers/inventarioController.js', 'utf8');

// Extraer procesarPerifericosDeDetalles
const match = inventarioCode.match(/async function procesarPerifericosDeDetalles[\s\S]*?return nuevosDetalles;\n}/);
if (!match) {
  console.log("No se pudo extraer procesarPerifericosDeDetalles");
  process.exit(1);
}
let funcCode = match[0];
// Remove debug logs
funcCode = funcCode.replace(/fs\.appendFileSync[^\n]*\n/g, '');
funcCode = funcCode.replace(/const fs = require\('fs'\);\n/g, '');
funcCode = funcCode.replace(/const logFile = 'debug_perifericos\.log';\n/g, '');

const targetFile = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/backend/src/controllers/equipoTecnologicoController.js';
let equipoCode = fs.readFileSync(targetFile, 'utf8');

// Insert the function before module.exports
equipoCode = equipoCode.replace(/module\.exports = {/, funcCode + '\n\nmodule.exports = {');

// In crearEquipo, right after res.status(201).json
// Wait, we need to do it BEFORE res.status(201) so we can update the equipment
const createPatch = `
    let detallesLimpios = await procesarPerifericosDeDetalles(
      detalles || {},
      nuevoEquipo.id,
      responsable,
      cargoResponsable,
      areaUbicacion,
      direccion,
      procedencia
    );
    if (JSON.stringify(detalles || {}) !== JSON.stringify(detallesLimpios)) {
      const eqActualizado = await prisma.equipoTecnologico.update({
        where: { id: nuevoEquipo.id },
        data: { detalles: detallesLimpios }
      });
      return res.status(201).json({ ok: true, data: eqActualizado });
    }
    
    res.status(201).json({ ok: true, data: nuevoEquipo });
`;

equipoCode = equipoCode.replace(/res\.status\(201\)\.json\(\{ ok: true, data: nuevoEquipo \}\);/, createPatch);

// In actualizarEquipo, right after const equipoActualizado = await prisma.equipoTecnologico.update
const updatePatch = `
    const equipoActualizado = await prisma.equipoTecnologico.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        numeroInventario: numeroInventario || null,
        numeroSerie: numeroSerie || null,
        marca: marca || null,
        modelo: modelo || null,
        responsable: responsable || null,
        cargoResponsable: cargoResponsable || null,
        areaUbicacion: areaUbicacion || null,
        direccion: direccion || null,
        procedencia: procedencia || null,
        estatus: estatus || 'Activo',
        detalles: detalles || {}
      }
    });

    let detallesLimpios = await procesarPerifericosDeDetalles(
      detalles || {},
      equipoActualizado.id,
      responsable,
      cargoResponsable,
      areaUbicacion,
      direccion,
      procedencia
    );
    if (JSON.stringify(detalles || {}) !== JSON.stringify(detallesLimpios)) {
      const eqAc2 = await prisma.equipoTecnologico.update({
        where: { id: equipoActualizado.id },
        data: { detalles: detallesLimpios }
      });
      return res.json({ ok: true, data: eqAc2 });
    }

    res.json({ ok: true, data: equipoActualizado });
`;

// Find where equipoActualizado is returned
equipoCode = equipoCode.replace(
  /const equipoActualizado = await prisma\.equipoTecnologico\.update\(\{[\s\S]*?\}\);\s*res\.json\(\{ ok: true, data: equipoActualizado \}\);/, 
  updatePatch
);

fs.writeFileSync(targetFile, equipoCode);
console.log("Parche aplicado exitosamente");
