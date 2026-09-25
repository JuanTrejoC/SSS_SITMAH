const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

const oldStart = `          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>`;

const oldEnd = `                });
              })()}
            </div>
          );`;

const startIndex = code.indexOf(oldStart);
const endIndex = code.indexOf(oldEnd, startIndex) + oldEnd.length;

if (startIndex === -1 || endIndex < oldEnd.length) {
    console.error("Could not find the block to replace");
    process.exit(1);
}

const newList = `          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
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
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                      }}
                    >
                      {/* Left accent bar (similar to original image) */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#691B31' }}></div>
                      
                      {/* Top Row: Category and Action icons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px'
                        }}>
                          {getCategoriaIcon(grupo.categoria)}
                          {getCategoriaLabel(grupo.categoria)}
                        </span>

                        {/* Top right buttons placeholder to match image aesthetics */}
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            onClick={toggleExpand}
                            title={isExpanded ? "Ocultar piezas" : "Ver piezas"}
                            style={{
                              backgroundColor: '#e0f2fe',
                              border: 'none',
                              color: '#0284c7',
                              cursor: 'pointer',
                              padding: '0.4rem',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.2s',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>

                      {/* Middle: Title */}
                      <div style={{ paddingLeft: '0.5rem', flex: 1, minHeight: '60px' }}>
                        <h3 style={{
                          fontSize: '1.15rem',
                          margin: '0 0 0.25rem 0',
                          fontWeight: '800',
                          color: '#0f172a',
                          textTransform: 'capitalize'
                        }}>
                          {grupo.nombre}
                        </h3>
                        {(grupo.marca || grupo.modelo) && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                            {grupo.marca} {grupo.modelo}
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Adjust Stock & Quantity */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        paddingLeft: '0.5rem',
                        marginTop: '1rem'
                      }}>
                        <button 
                          onClick={toggleExpand}
                          style={{
                            padding: '0.3rem 0.65rem',
                            backgroundColor: '#f1f5f9',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#9f1239',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        >
                          Ver Piezas
                        </button>
                        
                        <span style={{
                          fontSize: '1.4rem',
                          fontWeight: '800',
                          color: '#047857',
                          backgroundColor: '#ecfdf5',
                          padding: '0.2rem 0.8rem',
                          borderRadius: '8px',
                          minWidth: '2.5rem',
                          textAlign: 'center',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          {grupo.cantidadTotal}
                        </span>
                      </div>

                      {/* Expanded View */}
                      {isExpanded && (
                        <div style={{ 
                          marginTop: '1.5rem', 
                          paddingTop: '1rem', 
                          borderTop: '1px solid #e2e8f0',
                          paddingLeft: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {grupo.items.map((item, idx) => (
                              <div key={item.id || idx} style={{
                                backgroundColor: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                padding: '0.75rem',
                                position: 'relative'
                              }}>
                                <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
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

code = code.substring(0, startIndex) + newList + code.substring(endIndex);

fs.writeFileSync(file, code, 'utf8');
console.log("Replaced block successfully");
