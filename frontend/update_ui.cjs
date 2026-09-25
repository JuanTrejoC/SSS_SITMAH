const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Mantenimiento card
const bajaCardRegex = /\{\/\* Tarjeta: Baja \*\/\}[\s\S]*?(?=\{\/\* FORM MODAL \*\/\}|<\/div>[\s]*\{\/\* FORM MODAL \*\/\}|  \}\)\(\)\}\n        <\/div>)/;
const match = code.match(bajaCardRegex);
if(match && !code.includes('Tarjeta: Mantenimiento')) {
  const mantenimientoCard = `          {/* Tarjeta: Mantenimiento */}
          {(() => {
            const countMantenimiento = existencias.filter(i => i.estadoFisico === 'Mantenimiento').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
            const totalArticulos = existencias.filter(i => i.estadoFisico === 'Mantenimiento').length;
            const isActive = filtroEstado === 'Mantenimiento';
            return (
              <div
                onClick={() => setFiltroEstado(isActive ? '' : 'Mantenimiento')}
                style={{
                  backgroundColor: isActive ? '#fffbeb' : '#ffffff',
                  border: isActive ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: isActive ? '0 8px 16px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: '#f59e0b' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block'
                    }}></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mantenimiento
                    </span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#78350f', lineHeight: 1.1 }}>
                    {countMantenimiento} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#d97706' }}>piezas</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {totalArticulos} {totalArticulos === 1 ? 'artículo' : 'artículos'}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportarReportePDF('mantenimiento');
                    }}
                    title="Descargar Reporte PDF de Mantenimiento"
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.3rem 0.65rem',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      border: '1px solid #FDE68A',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <FaFilePdf size={12} />
                    PDF
                  </button>
                </div>
                
                <div style={{
                  width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b'
                }}>
                  <FaWrench size={24} />
                </div>
              </div>
            );
          })()}

`;
  code = code.replace(match[0], mantenimientoCard + match[0]);
}

// 2. Add expandedGroups state
if(!code.includes('const [expandedGroups, setExpandedGroups]')) {
  code = code.replace("const [busqueda, setBusqueda] = useState('');", "const [busqueda, setBusqueda] = useState('');\n  const [expandedGroups, setExpandedGroups] = useState({});");
}

// 3. Replace the list rendering with grouped logic
const listRegex = /return \(\s*<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(320px, 1fr\)\)', gap: '1\.5rem' \}\}>\s*\{itemsFiltrados\.map\(item => \{[\s\S]*?\}\)\}\s*<\/div>\s*\);/g;

const newList = `return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(() => {
                // AGRUPAR itemsFiltrados por nombre, marca y modelo
                const gruposObj = {};
                itemsFiltrados.forEach(item => {
                  const key = \`\${item.nombre || ''}-\${item.marca || ''}-\${item.modelo || ''}\`;
                  if (!gruposObj[key]) {
                    gruposObj[key] = {
                      key,
                      nombre: item.nombre,
                      marca: item.marca,
                      modelo: item.modelo,
                      categoria: item.categoria,
                      estadoFisico: item.estadoFisico,
                      cantidadTotal: 0,
                      items: []
                    };
                  }
                  gruposObj[key].items.push(item);
                  gruposObj[key].cantidadTotal += (Number(item.cantidad) || 1);
                });
                
                return Object.values(gruposObj).map(grupo => {
                  const isExpanded = !!expandedGroups[grupo.key];
                  const toggleExpand = () => setExpandedGroups(prev => ({...prev, [grupo.key]: !prev[grupo.key]}));
                  
                  const bgCat = getCategoriaBg(grupo.categoria);
                  const textCat = getCategoriaTextColor(grupo.categoria);

                  return (
                    <div
                      key={grupo.key}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}
                    >
                      {/* Cabecera del Grupo */}
                      <div 
                        onClick={toggleExpand}
                        style={{
                          padding: '1.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#f8fafc' : 'white',
                          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            color: textCat,
                            textTransform: 'uppercase',
                            backgroundColor: bgCat,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            width: 'max-content'
                          }}>
                            {getCategoriaIcon(grupo.categoria)}
                            {getCategoriaLabel(grupo.categoria)}
                          </span>
                          
                          <h3 style={{ fontSize: '1.35rem', margin: '0', fontWeight: '800', color: '#0f172a', textTransform: 'capitalize' }}>
                            {grupo.nombre}
                          </h3>
                          
                          {(grupo.marca || grupo.modelo) && (
                            <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '500' }}>
                              {grupo.marca && <span>Marca: {grupo.marca}</span>}
                              {grupo.marca && grupo.modelo && ' | '}
                              {grupo.modelo && <span>Modelo: {grupo.modelo}</span>}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginBottom: '0.2rem' }}>Piezas Disponibles</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f766e' }}>{grupo.cantidadTotal}</div>
                          </div>
                          
                          <div style={{ color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                            ▼
                          </div>
                        </div>
                      </div>

                      {/* Lista de Items Expandida */}
                      {isExpanded && (
                        <div style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textAlign: 'left' }}>
                              <tr>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>No. Serie</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>No. Inventario</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Ubicación</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Responsable</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Estatus</th>
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupo.items.map((item, idx) => (
                                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#334155' }}>
                                  <td style={{ padding: '0.75rem 1rem' }}>{item.numeroSerie || 'N/A'}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>{item.numeroInventario || 'N/A'}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>{item.areaUbicacion || 'N/A'}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>{item.equipoOriginal?.responsable || 'N/A'}</td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <span style={{
                                      backgroundColor: item.estadoFisico === 'Stock' ? '#ecfdf5' : item.estadoFisico === 'Refacciones' ? '#fffbeb' : '#fef2f2',
                                      color: item.estadoFisico === 'Stock' ? '#047857' : item.estadoFisico === 'Refacciones' ? '#b45309' : '#b91c1c',
                                      padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                                    }}>
                                      {item.estadoFisico}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleEditar(item)}
                                      title="Editar"
                                      style={{ backgroundColor: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <FaEdit size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          );`

code = code.replace(listRegex, newList);

fs.writeFileSync(file, code, 'utf8');
