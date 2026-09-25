const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

const listRegex = /return \(\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '1\.5rem' \}\}>[\s\S]*?\n\s*\);\s*\}\)\(\)\}\s*<\/div>\s*\);/g;

const newList = `return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
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
                        padding: '0',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.06)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#691B31' }}></div>
                      
                      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            color: textCat,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backgroundColor: bgCat,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px'
                          }}>
                            {getCategoriaIcon(grupo.categoria)}
                            {getCategoriaLabel(grupo.categoria)}
                          </span>
                        </div>

                        <h3 style={{
                          fontSize: '1.25rem',
                          margin: '0.5rem 0 0.25rem',
                          fontWeight: '800',
                          color: '#0f172a',
                          textTransform: 'capitalize'
                        }}>
                          {grupo.nombre}
                        </h3>

                        {(grupo.marca || grupo.modelo) && (
                          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500', marginBottom: '0.5rem' }}>
                            {grupo.marca && <span>{grupo.marca}</span>}
                            {grupo.marca && grupo.modelo && ' - '}
                            {grupo.modelo && <span>{grupo.modelo}</span>}
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '1rem',
                          marginTop: 'auto'
                        }}>
                          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Stock Disponible:</span>
                          <span style={{
                            fontSize: '1.4rem',
                            fontWeight: '800',
                            color: grupo.cantidadTotal > 5 ? '#047857' : grupo.cantidadTotal > 0 ? '#b45309' : '#b91c1c',
                            backgroundColor: grupo.cantidadTotal > 5 ? '#dcfce7' : grupo.cantidadTotal > 0 ? '#fef3c7' : '#fee2e2',
                            padding: '0.15rem 0.85rem',
                            borderRadius: '8px',
                            minWidth: '2.5rem',
                            textAlign: 'center'
                          }}>
                            {grupo.cantidadTotal}
                          </span>
                        </div>

                        <button 
                          onClick={toggleExpand}
                          style={{
                            marginTop: '1rem',
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}
                        >
                          {isExpanded ? 'Ocultar detalles ▲' : 'Ver piezas detalladas ▼'}
                        </button>
                      </div>

                      {/* Lista de Items Expandida */}
                      {isExpanded && (
                        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', backgroundColor: 'white' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {grupo.items.map((item, idx) => (
                              <div key={item.id || idx} style={{
                                backgroundColor: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                padding: '0.75rem',
                                position: 'relative'
                              }}>
                                <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                  {item.numeroSerie && <span><strong style={{color:'#64748b'}}>S/N:</strong> {item.numeroSerie}</span>}
                                  {item.numeroInventario && <span><strong style={{color:'#64748b'}}>Inv:</strong> {item.numeroInventario}</span>}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                  <span style={{
                                    backgroundColor: item.estadoFisico === 'Stock' ? '#ecfdf5' : item.estadoFisico === 'Refacciones' ? '#fffbeb' : '#fef2f2',
                                    color: item.estadoFisico === 'Stock' ? '#047857' : item.estadoFisico === 'Refacciones' ? '#b45309' : '#b91c1c',
                                    padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold'
                                  }}>
                                    {item.estadoFisico}
                                  </span>

                                  {(item.areaUbicacion || item.equipoOriginal?.responsable) && (
                                    <span style={{ fontSize: '0.7rem', color: '#475569', backgroundColor: '#e2e8f0', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                      {item.equipoOriginal?.responsable ? item.equipoOriginal.responsable : item.areaUbicacion}
                                    </span>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => handleEditar(item)}
                                  title="Editar pieza"
                                  style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    backgroundColor: '#fef3c7',
                                    border: 'none',
                                    color: '#d97706',
                                    cursor: 'pointer',
                                    padding: '0.35rem',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                                >
                                  <FaEdit size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          );`;

code = code.replace(listRegex, newList);

fs.writeFileSync(file, code, 'utf8');
