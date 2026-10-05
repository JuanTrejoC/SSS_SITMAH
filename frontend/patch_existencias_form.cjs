const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add fields to initial state form
code = code.replace(
  /numeroInventario: '',\s*tipoInventario: 'tecnologico'/g,
  `numeroInventario: '',\n    procedencia: '',\n    responsable: '',\n    cargoResponsable: '',\n    tipoInventario: 'tecnologico'`
);

// 2. Add fields to resetForm
code = code.replace(
  /numeroInventario: '',\s*tipoInventario: 'tecnologico'\s*\}\);/g,
  `numeroInventario: '',\n      procedencia: '',\n      responsable: '',\n      cargoResponsable: '',\n      tipoInventario: 'tecnologico'\n    });`
);

// 3. Add fields to handleEditar
code = code.replace(
  /numeroInventario: item.numeroInventario \|\| '',\s*tipoInventario: 'tecnologico'/g,
  `numeroInventario: item.numeroInventario || '',\n      procedencia: item.equipoOriginal?.procedencia || '',\n      responsable: item.equipoOriginal?.responsable || '',\n      cargoResponsable: item.equipoOriginal?.cargoResponsable || '',\n      tipoInventario: 'tecnologico'`
);

// 4. Update payload in handleGuardar
const payloadStr = `const payload = {
        tipo: form.categoria || 'Componentes',
        marca: form.marca || null,
        modelo: form.modelo || null,
        numeroSerie: form.numeroSerie || null,
        numeroInventario: form.numeroInventario || null,
        areaUbicacion: form.areaUbicacion || 'Almacén de Sistemas',
        estatus: form.estadoFisico,
        procedencia: form.procedencia || null,
        responsable: form.responsable || null,
        cargoResponsable: form.cargoResponsable || null,
        detalles: {
          nombre: form.nombre,
          categoria: form.categoria,
          cantidad: cantidadFinal,
          estadoFisico: form.estadoFisico,
          areaUbicacion: form.areaUbicacion,
          procedencia: form.procedencia,
          responsable: form.responsable,
          cargoResponsable: form.cargoResponsable
        }
      };`;
code = code.replace(/const payload = \{[\s\S]*?areaUbicacion\n\s*\}\n\s*\};\n/m, payloadStr + '\n');


// 5. Add inputs to the modal JSX. Right after Ubicacion / Area
const htmlToAdd = `
              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Procedencia (opcional)</label>
                  <input
                    type="text"
                    value={form.procedencia || ''}
                    onChange={e => setForm({ ...form, procedencia: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Responsable (opcional)</label>
                  <input
                    type="text"
                    value={form.responsable || ''}
                    onChange={e => setForm({ ...form, responsable: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Cargo del Responsable (opcional)</label>
                <input
                  type="text"
                  value={form.cargoResponsable || ''}
                  onChange={e => setForm({ ...form, cargoResponsable: e.target.value })}
                  style={inputStyle}
                />
              </div>
`;

code = code.replace(/<\/div>\n\n\s*<div style=\{\{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.75rem' \}\}>/m, 
  `</div>\n${htmlToAdd}\n              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>`
);

fs.writeFileSync(file, code, 'utf8');
console.log("Patched InventarioExistencias form");
