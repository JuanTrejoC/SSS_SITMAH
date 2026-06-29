import { useState, useEffect } from 'react'
import { FaEye, FaTrashAlt } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { formatFolio } from '../utils/formatFolio'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'



export default function DashboardSemaforos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reportes, setReportes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Pendiente')
  const [mesFiltro, setMesFiltro] = useState('')
  const [anioFiltro, setAnioFiltro] = useState('')
  const [verDetalle, setVerDetalle] = useState(null)
  const [cargando, setCargando] = useState(false)

  // ✅ CARGAR DATOS DESDE EL BACKEND
  const cargarReportes = async () => {
    if (!user?.token) return
    setCargando(true)
    try {
      let url = `${API_BASE_URL}/api/admin/reportes/semaforo?limit=100`
      if (mesFiltro) url += `&mes=${mesFiltro}`
      if (anioFiltro) url += `&anio=${anioFiltro}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        setReportes(json.data.items || [])
      } else {
        console.error('Error al obtener reportes de semáforos:', json.error)
      }
    } catch (err) {
      console.error('Error de red al obtener reportes de semáforos:', err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarReportes()
  }, [user, mesFiltro, anioFiltro])

  // ✅ CAMBIAR ESTADO EN BACKEND
  const cambiarEstado = async (id, nuevoEstado) => {
    if (!user?.token) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reportes/semaforo/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          comentario: 'Actualizado desde el panel de administración'
        })
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        cargarReportes()
      } else {
        alert('❌ Error al cambiar el estado: ' + (json.error || 'Desconocido'))
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err)
      alert('❌ Error de red al actualizar estado')
    }
  }

  // ✅ ELIMINAR REPORTE EN BACKEND
  const eliminarReporte = async (id) => {
    if (!user?.token) return
    if (confirm('¿Eliminar este reporte de forma permanente?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reportes/semaforo/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        })
        const json = await response.json()
        if (response.ok && json.ok) {
          alert('✅ Reporte eliminado correctamente')
          cargarReportes()
        } else {
          alert('❌ Error al eliminar reporte: ' + (json.error || 'Desconocido'))
        }
      } catch (err) {
        console.error('Error al eliminar:', err)
        alert('❌ Error de red al eliminar reporte')
      }
    }
  }

  // ✅ DESCARGAR / GENERAR REPORTE EXCEL CON FILTROS DE MES/AÑO
  const descargarExcel = async () => {
    if (!user?.token) return
    try {
      let url = `${API_BASE_URL}/api/admin/reportes/semaforo/export?`
      if (mesFiltro) url += `mes=${mesFiltro}&`
      if (anioFiltro) url += `anio=${anioFiltro}&`
      if (estadoFiltro !== 'Todos') {
        const mapEstado = { 'Pendiente': 'abierto', 'En Proceso': 'en_proceso', 'Resuelto': 'resuelto' }
        url += `estado=${mapEstado[estadoFiltro]}&`
      }
      if (busqueda) url += `keyword=${encodeURIComponent(busqueda)}&`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      if (!response.ok) throw new Error('Error al descargar archivo')
      const blob = await response.blob()
      const urlObj = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = `reportes_semaforos_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
      a.click()
      URL.revokeObjectURL(urlObj)
    } catch (error) {
      alert('❌ Error al generar y descargar el reporte Excel: ' + error.message)
    }
  }

  // ✅ FILTRAR DATOS
  const reportesFiltrados = reportes.filter(r => {
    const coincideBusqueda =
      r.jefeTurno?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.estacion?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.crucero?.nombre?.toLowerCase().includes(busqueda.toLowerCase())

    const coincideEstado = estadoFiltro === 'Todos' ||
      (estadoFiltro === 'Pendiente' && r.estado === 'abierto') ||
      (estadoFiltro === 'En Proceso' && r.estado === 'en_proceso') ||
      (estadoFiltro === 'Resuelto' && r.estado === 'resuelto')

    return coincideBusqueda && coincideEstado
  })

  // ✅ ESTILO DE PRIORIDAD (Todos los semáforos son alta prioridad)
  const obtenerEstiloPrioridad = () => {
    return { bg: '#fee2e2', color: '#dc2626', label: 'Alta' }
  }

  const obtenerNombreEstado = (estado) => {
    switch (estado) {
      case 'abierto': return 'Pendiente'
      case 'en_proceso': return 'En Proceso'
      case 'resuelto': return 'Resuelto'
      default: return estado
    }
  }

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ✅ ENCABEZADO CON TABS DE NAVEGACIÓN */}
        <div className="responsive-flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#BC955B', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            <i className="fa-solid fa-traffic-light" style={{ marginRight: '0.5rem' }}></i> Panel de Reportes - Semáforos
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'white', padding: '0.4rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <button
              onClick={() => navigate('/dashboard-oficinas')}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#6F7271',
                fontWeight: '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#691B31' }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6F7271' }}
            >
              <i className="fa-solid fa-building"></i> Oficinas
            </button>
            <button
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#691B31',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fa-solid fa-traffic-light"></i> Semáforos
            </button>
          </div>
        </div>

        {/* ✅ BARRA DE FILTROS */}
        <div style={{ backgroundColor: 'white', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
          {/* Fila 1: Búsqueda por mes, año y estado */}
          <div className="form-responsive-grid grid-2" style={{ marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#6F7271', display: 'block', marginBottom: '0.3rem' }}>
                <i className="fa-solid fa-calendar-days" style={{ marginRight: '0.3rem' }}></i>Mes y Año
              </label>
              <input
                type="month"
                id="monthFilter"
                value={(anioFiltro && mesFiltro) ? `${anioFiltro}-${mesFiltro.padStart(2, '0')}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const [y, m] = val.split('-');
                    setAnioFiltro(y);
                    setMesFiltro(parseInt(m, 10).toString());
                  } else {
                    setAnioFiltro('');
                    setMesFiltro('');
                  }
                }}
                style={{ width: '100%', padding: '0.5rem 0.8rem', border: '1px solid #9B9B9A', borderRadius: '8px', backgroundColor: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#6F7271', display: 'block', marginBottom: '0.3rem' }}>Estado</label>
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.8rem', border: '1px solid #9B9B9A', borderRadius: '8px', backgroundColor: 'white' }}>
                <option>Todos</option>
                <option>Pendiente</option>
                <option>En Proceso</option>
                <option>Resuelto</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Busqueda por Termino y Botón Excel */}
          <div className="form-responsive-grid grid-2" style={{ alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#6F7271', display: 'block', marginBottom: '0.3rem' }}>Buscar Término</label>
              <input
                type="text"
                placeholder="Buscar por jefe de turno, folio, estación o crucero..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.8rem', border: '1px solid #9B9B9A', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#6F7271', display: 'block', marginBottom: '0.3rem' }}>&nbsp;</label>
              <button onClick={descargarExcel} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>
                <i className="fa-solid fa-file-excel" style={{ marginRight: '0.4rem' }}></i>Generar Reporte Excel
              </button>
            </div>
          </div>
        </div>

        {/* ✅ TABLA */}
        <div className="overflow-x-auto" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #9B9B9A' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Folio</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Fecha</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Jefe de Turno</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Estación / Crucero</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Equipo</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Tipo de Falla</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Prioridad</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#000000' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#000000' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#6F7271' }}>
                    Cargando reportes del servidor...
                  </td>
                </tr>
              ) : reportesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#6F7271' }}>
                    No se encontraron reportes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                reportesFiltrados.map(r => {
                  const estiloPri = obtenerEstiloPrioridad(r.prioridad)
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid #9B9B9A', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '500' }}>{formatFolio(r.folio, r.id)}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{r.jefeTurno}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{r.estacion?.nombre || '—'} / {r.crucero?.nombre || '—'}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>Semáforo</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{r.tipoFalla?.nombre || '—'}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        <span style={{
                          padding: '0.25rem 0.7rem',
                          borderRadius: '20px',
                          backgroundColor: estiloPri.bg,
                          color: estiloPri.color,
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          display: 'inline-block',
                          minWidth: '70px',
                          textAlign: 'center'
                        }}>
                          {estiloPri.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        <select
                          value={r.estado}
                          onChange={(e) => cambiarEstado(r.id, e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', border: '1px solid #9B9B9A', borderRadius: '6px', backgroundColor: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="abierto">Pendiente</option>
                          <option value="en_proceso">En Proceso</option>
                          <option value="resuelto">Resuelto</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => setVerDetalle(r)}
                            title="Ver detalles"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#BC955B',
                              cursor: 'pointer',
                              fontSize: '18px',
                              padding: '4px'
                            }}
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => eliminarReporte(r.id)}
                            title="Eliminar"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '18px',
                              padding: '4px'
                            }}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ MODAL DETALLES */}
        {verDetalle && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ color: '#BC955B', marginBottom: '1.5rem', fontSize: '1.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                Detalles del Reporte {formatFolio(verDetalle.folio, verDetalle.id)}
              </h3>
              <div className="form-responsive-grid grid-2" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#334155' }}>
                <div><strong>Jefe Turno:</strong> {verDetalle.jefeTurno}</div>
                <div><strong>Estación:</strong> {verDetalle.estacion?.nombre || '—'}</div>
                <div><strong>Crucero:</strong> {verDetalle.crucero?.nombre || '—'}</div>
                <div><strong>Tipo de Falla:</strong> {verDetalle.tipoFalla?.nombre || '—'}</div>
                <div><strong>Prioridad:</strong> Alta</div>
                <div><strong>Estado:</strong> {obtenerNombreEstado(verDetalle.estado)}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Hora Siniestro:</strong> {new Date(verDetalle.horaDano).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Fecha Registro:</strong> {new Date(verDetalle.createdAt).toLocaleString()}</div>
                {verDetalle.fechaResolucion && (
                  <div style={{ gridColumn: '1 / -1' }}><strong>Fecha Resolución:</strong> {new Date(verDetalle.fechaResolucion).toLocaleString()}</div>
                )}
                {verDetalle.atendidoPor && (
                  <div style={{ gridColumn: '1 / -1' }}><strong>Atendido por:</strong> {verDetalle.atendidoPor.nombre} ({verDetalle.atendidoPor.username})</div>
                )}
                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <strong>Descripción:</strong>
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.8rem', borderRadius: '8px', marginTop: '0.4rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid #6F7271', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    {verDetalle.descripcion || 'Sin observaciones adicionales.'}
                  </div>
                </div>

                {/* ✅ IMAGEN DE EVIDENCIA */}
                {verDetalle.evidencias && verDetalle.evidencias.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.6rem' }}>
                      <i className="fa-solid fa-image" style={{ marginRight: '0.4rem', color: '#BC955B' }}></i>
                      Evidencia Fotográfica:
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                      {verDetalle.evidencias.map((ev) => (
                        <div key={ev.id} style={{ border: '1px solid #6F7271', borderRadius: '8px', overflow: 'hidden', maxWidth: '260px' }}>
                          {ev.mimetype?.startsWith('image/') ? (
                            <a
                              href={`${API_BASE_URL}/api/evidencias/${ev.id}?token=${user.token}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={`${API_BASE_URL}/api/evidencias/${ev.id}?token=${user.token}`}
                                alt={ev.filename}
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            </a>
                          ) : (
                            <a
                              href={`${API_BASE_URL}/api/evidencias/${ev.id}?token=${user.token}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem', color: '#BC955B', textDecoration: 'none', fontSize: '0.85rem' }}
                            >
                              <i className="fa-solid fa-file"></i>
                              {ev.filename}
                            </a>
                          )}
                          <div style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#6F7271', backgroundColor: '#f8fafc', borderTop: '1px solid #6F7271' }}>
                            {ev.filename}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {verDetalle.evidencias && verDetalle.evidencias.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.8rem', color: '#9ca3af', fontSize: '0.88rem', fontStyle: 'italic' }}>
                    <i className="fa-solid fa-image" style={{ marginRight: '0.4rem' }}></i>
                    Sin evidencia fotográfica adjunta.
                  </div>
                )}
              </div>
              <button onClick={() => setVerDetalle(null)} style={{ marginTop: '1.8rem', padding: '0.65rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '6px', width: '100%', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#a07238'} onMouseOut={(e) => e.target.style.backgroundColor = '#BC955B'}>
                Cerrar Detalles
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}