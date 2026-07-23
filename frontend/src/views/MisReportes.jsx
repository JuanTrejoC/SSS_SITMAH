import { useState, useEffect } from 'react'

export default function MisReportes({ usuarioActual }) {
  const [reportes, setReportes] = useState([])
  const [buscar, setBuscar] = useState('')
  const [verDetalle, setVerDetalle] = useState(null)

  // ✅ CARGA SOLO LOS REPORTES DEL USUARIO ACTUAL (SEPARADO)
  useEffect(() => {
    let todos;
    if (usuarioActual === 'administrador') {
      const oficinas = JSON.parse(localStorage.getItem('reportes_oficinas_admin')) || []
      const semaforos = JSON.parse(localStorage.getItem('reportes_semaforos_admin')) || []
      todos = [...oficinas, ...semaforos]
    } else {
      const oficinas = JSON.parse(localStorage.getItem('reportes_oficinas_solicitante')) || []
      const semaforos = JSON.parse(localStorage.getItem('reportes_semaforos_solicitante')) || []
      todos = [...oficinas, ...semaforos]
    }
    todos.sort((a, b) => b.id - a.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReportes(todos)
  }, [usuarioActual])

  // ✅ ELIMINAR REPORTE
  const eliminarReporte = (id, tipo) => {
    const clave = usuarioActual === 'administrador'
      ? `reportes_${tipo}_admin`
      : `reportes_${tipo}_solicitante`
    const actuales = JSON.parse(localStorage.getItem(clave)) || []
    const filtrados = actuales.filter(r => r.id !== id)
    localStorage.setItem(clave, JSON.stringify(filtrados))
    setReportes(prev => prev.filter(r => r.id !== id))
  }

  // ✅ FILTRAR
  const filtrados = reportes.filter(r =>
    Object.values(r).join(' ').toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="card-padding" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#BC955B', fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.8rem' }}>Mis Reportes Enviados</h2>

        {/* ✅ BUSCADOR + BOTÓN SOLO ADMIN */}
        <div className="responsive-flex" style={{ alignItems: 'center', marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Buscar palabra clave..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            style={{ flex: 1, padding: '0.7rem', border: '1px solid #9B9B9A', borderRadius: '8px' }}
          />
          {usuarioActual === 'administrador' && (
            <button style={{ padding: '0.7rem 1.5rem', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>
              Generar Reporte
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #6F7271' }}>ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #6F7271' }}>Solicitante</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #6F7271' }}>Área / Sede</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #6F7271' }}>Equipo Relacionado</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #6F7271' }}>Categoría</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #6F7271' }}>Prioridad</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #6F7271' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #6F7271' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6F7271' }}>No tienes reportes enviados</td>
                </tr>
              ) : filtrados.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271' }}>{r.id}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271' }}>{r.nombre || r.jefe_turno}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271' }}>{r.area || r.sede || r.estacion}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271' }}>{r.equipo || '—'}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271' }}>{r.categoria || r.tipo_falla}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271' }}>
                    <span style={{
                      padding: '0.25rem 0.7rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      backgroundColor: r.prioridad === 'Baja' ? '#fef08a' : r.prioridad === 'Media' ? '#fdba74' : r.prioridad === 'Alta' ? '#fca5a5' : '#dcfce7',
                      color: r.prioridad === 'Baja' ? '#854d0e' : r.prioridad === 'Media' ? '#92400e' : r.prioridad === 'Alta' ? '#991b1b' : '#166534'
                    }}>
                      {r.prioridad || 'ALTA'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271' }}>
                    <span style={{ padding: '0.25rem 0.7rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500', backgroundColor: '#fef3c7', color: '#d97706' }}>{r.estado}</span>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #6F7271', textAlign: 'center' }}>
                    {/* ✅ ICONO OJO (SVG) */}
                    <button
                      onClick={() => setVerDetalle(r)}
                      style={{ margin: '0 0.3rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                      title="Ver detalles"
                    >
                      <svg width="18" height="18" fill="#475569" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    </button>
                    {/* ✅ ICONO BASURA (SVG) */}
                    <button
                      onClick={() => { if (confirm('¿Eliminar este reporte?')) eliminarReporte(r.id, r.tipo) }}
                      style={{ margin: '0 0.3rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                      title="Eliminar"
                    >
                      <svg width="18" height="18" fill="#dc2626" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ MODAL DETALLES */}
        {verDetalle && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div className="card-padding" style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#BC955B' }}>Detalle del Reporte #{verDetalle.id}</h3>
                <button onClick={() => setVerDetalle(null)} style={{ border: 'none', backgroundColor: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ lineHeight: '1.6' }}>
                {Object.entries(verDetalle).map(([k, v]) => (
                  <div key={k} style={{ padding: '0.3rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <strong>{k.replace(/_/g, ' ').toUpperCase()}:</strong> {v || '—'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}