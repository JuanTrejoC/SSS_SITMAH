const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

const modalSelectRegex = /<option value="Refacciones">🟡 Refacciones<\/option>\s*<option value="Baja">🔴 Baja \/ Baja<\/option>/;
if (code.match(modalSelectRegex) && !code.includes('<option value="Mantenimiento">🟠 Mantenimiento</option>')) {
  code = code.replace(modalSelectRegex, `<option value="Refacciones">🟡 Refacciones</option>
                    <option value="Mantenimiento">🟠 Mantenimiento</option>
                    <option value="Baja">🔴 Baja / Baja</option>`);
}

// Ensure the PDF dropdown also has Mantenimiento
const pdfDropdownRegex = /\{\/\* 2\. Refacciones \*\/\}([\s\S]*?)\{\/\* 3\. Baja \*\/\}/g;
if (code.match(pdfDropdownRegex) && !code.includes('{/* 3. Mantenimiento */}')) {
  const pdfItem = `
                {/* 3. Mantenimiento */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuExportarAbierto(false);
                    exportarReportePDF('Mantenimiento');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    textAlign: 'left'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.5rem', borderRadius: '8px' }}>
                    <FaTools size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#B45309' }}>3. Piezas en Mantenimiento</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Piezas siendo reparadas</div>
                  </div>
                </button>
`;
  code = code.replace('{/* 3. Baja */}', pdfItem + '                {/* 4. Baja */}');
}

fs.writeFileSync(file, code, 'utf8');
console.log('Modal and PDF dropdown updated');
