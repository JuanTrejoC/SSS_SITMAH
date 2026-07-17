import { useState, useEffect, useRef } from 'react'
import { FaEye, FaTrashAlt, FaChevronRight, FaCogs } from 'react-icons/fa'
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
  const [incluirImagenes, setIncluirImagenes] = useState(false)
  const [ordenAscendente, setOrdenAscendente] = useState(false)
  const [confirmResuelto, setConfirmResuelto] = useState({ visible: false, id: null })
  const [inventario, setInventario] = useState([])
  const [mostrarInventario, setMostrarInventario] = useState(false)
  const [componenteSeleccionado, setComponenteSeleccionado] = useState('')
  const [cantidadAsignar, setCantidadAsignar] = useState(1)

  // CARGAR DATOS DESDE EL BACKEND
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

  const cargarInventario = async () => {
    if (!user?.token) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventario/existencias`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        setInventario(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error('Error al cargar inventario', err)
    }
  }

  useEffect(() => {
    cargarReportes()
    cargarInventario()
  }, [user, mesFiltro, anioFiltro])

  // Bloquear scroll de la página cuando el modal está abierto
  useEffect(() => {
    if (verDetalle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [verDetalle]);


  const asignarPieza = async () => {
    if (!componenteSeleccionado || cantidadAsignar < 1) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reportes/semaforo/${verDetalle.id}/piezas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ componente_id: componenteSeleccionado, cantidad: cantidadAsignar })
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        alert('Pieza asignada correctamente')
        setComponenteSeleccionado('')
        setCantidadAsignar(1)
        cargarReportes()
        cargarInventario()
        setVerDetalle(prev => {
          const comp = inventario.find(i => i.id === Number(componenteSeleccionado))
          return {
            ...prev,
            piezasAsignadas: [...(prev.piezasAsignadas || []), { componente: comp, cantidad: cantidadAsignar }]
          }
        })
      } else {
        alert('Error al asignar pieza: ' + (json.error || 'Desconocido'))
      }
    } catch (err) {
      console.error(err)
      alert('Error de red al asignar pieza')
    }
  }

  // CAMBIAR ESTADO EN BACKEND
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

  // ELIMINAR REPORTE EN BACKEND
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

  // DESCARGAR / GENERAR REPORTE EXCEL CON FILTROS DE MES/AÑO
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
      if (incluirImagenes) url += `incluirImagenes=true&`
      if (ordenAscendente) url += `orden=asc&`
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

  // FILTRAR DATOS
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

  // ESTILO DE PRIORIDAD (Todos los semáforos son alta prioridad)
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

        {/* ENCABEZADO CON TABS DE NAVEGACIÓN */}
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

        {/* BARRA DE FILTROS */}
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
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#6F7271', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input 
                    type="checkbox" 
                    checked={incluirImagenes} 
                    onChange={(e) => setIncluirImagenes(e.target.checked)} 
                  />
                  Incluir imágenes
                </label>
                <label style={{ fontSize: '0.8rem', color: '#6F7271', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input 
                    type="checkbox" 
                    checked={ordenAscendente} 
                    onChange={(e) => setOrdenAscendente(e.target.checked)} 
                  />
                  Ascendente (ID)
                </label>
              </div>
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
                          disabled={r.estado === 'resuelto'}
                          onChange={(e) => {
                            const nuevoEstado = e.target.value;
                            if (nuevoEstado === 'resuelto') {
                              setConfirmResuelto({ visible: true, id: r.id });
                            } else {
                              cambiarEstado(r.id, nuevoEstado);
                            }
                          }}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            border: '1px solid #9B9B9A', 
                            borderRadius: '6px', 
                            backgroundColor: r.estado === 'resuelto' ? '#f1f5f9' : 'white', 
                            color: r.estado === 'resuelto' ? '#6F7271' : '#000',
                            fontSize: '0.85rem', 
                            outline: 'none', 
                            cursor: r.estado === 'resuelto' ? 'not-allowed' : 'pointer' 
                          }}
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

                {/* ✅ PIEZAS ASIGNADAS E INVENTARIO */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong><i className="fa-solid fa-tools" style={{ marginRight: '0.4rem', color: '#691B31' }}></i> Componentes Asignados:</strong>
                    <button onClick={() => setMostrarInventario(!mostrarInventario)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>
                      {mostrarInventario ? 'Ocultar Inventario' : 'Asignar Componente'}
                    </button>
                  </div>
                  
                  {mostrarInventario && (
                    <div style={{ backgroundColor: '#fdf8f6', padding: '1rem', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#9f1239' }}>Inventario Disponible</h4>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <CustomInventorySelect 
                          value={componenteSeleccionado}
                          onChange={setComponenteSeleccionado}
                          inventario={inventario}
                        />
                        <input 
                          type="number" 
                          min="1" 
                          value={cantidadAsignar} 
                          onChange={e => setCantidadAsignar(Number(e.target.value))}
                          style={{ width: '70px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                        />
                        <button onClick={asignarPieza} style={{ padding: '0.75rem 1.25rem', backgroundColor: '#e11d48', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(225, 29, 72, 0.2)' }}>
                          Asignar
                        </button>
                      </div>
                    </div>
                  )}

                  {verDetalle.piezasAsignadas && verDetalle.piezasAsignadas.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0', fontSize: '0.9rem' }}>
                      {verDetalle.piezasAsignadas.map((pieza, idx) => (
                        <li key={idx} style={{ padding: '0.4rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{pieza.componente?.nombre || 'Desconocido'} <strong style={{color: '#691B31'}}>(x{pieza.cantidad})</strong></span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '1rem' }}>No hay componentes asignados.</div>
                  )}
                </div>

              </div>
              <button onClick={() => { setVerDetalle(null); setMostrarInventario(false); setComponenteSeleccionado(''); }} style={{ marginTop: '1.8rem', padding: '0.65rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '6px', width: '100%', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#a07238'} onMouseOut={(e) => e.target.style.backgroundColor = '#BC955B'}>
                Cerrar Detalles
              </button>
            </div>
          </div>
        )}

        {/* ✅ MODAL DE CONFIRMACIÓN DE RESOLUCIÓN */}
        {confirmResuelto.visible && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ backgroundColor: '#fef3c7', color: '#d97706', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem', fontWeight: 'bold' }}>
                ?
              </div>
              <h3 style={{ color: '#1e293b', marginBottom: '0.8rem', fontSize: '1.3rem', fontWeight: 'bold' }}>¿Confirmar Resolución?</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                Una vez marcado como <strong>Resuelto</strong>, no podrás volver a cambiar el estado de este reporte.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={() => setConfirmResuelto({ visible: false, id: null })} 
                  style={{ flex: 1, padding: '0.7rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    cambiarEstado(confirmResuelto.id, 'resuelto');
                    setConfirmResuelto({ visible: false, id: null });
                  }} 
                  style={{ flex: 1, padding: '0.7rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#a07238'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#BC955B'}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Componente Customizado para el Inventario
const CustomInventorySelect = ({ value, onChange, inventario }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = inventario.find(o => o.id === Number(value));

  const filteredOptions = inventario.filter(o =>
    o.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (o.categoria && o.categoria.toLowerCase().includes(search.toLowerCase()))
  );

  const gruposOpciones = inventario.reduce((acc, curr) => {
    const group = curr.categoria || 'Sin Categoría';
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {});

  return (
    <div ref={selectRef} style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.75rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px',
          fontSize: '1rem', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem'
        }}
      >
        <span>
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '600' }}>
              <FaCogs color="#691B31" size={16} /> {selectedOption.nombre}
            </span>
          ) : (
            <span style={{ color: '#475569', fontWeight: '500' }}>-- Seleccionar componente --</span>
          )}
        </span>
        <FaChevronRight size={12} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', color: '#64748b' }} />
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 50, border: '1px solid #e2e8f0', overflow: 'hidden', width: '100%', minWidth: '300px' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <input
                type="text"
                placeholder="Buscar componente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div style={{ display: 'flex', height: '240px' }}>
              {search ? (
                <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto', overscrollBehavior: 'contain' }}>
                  {filteredOptions.length > 0 ? filteredOptions.map(opcion => (
                    <div
                      key={opcion.id}
                      onClick={() => { if(opcion.cantidad > 0) { onChange(opcion.id); setIsOpen(false); setSearch(''); } }}
                      style={{ padding: '0.7rem 1rem', cursor: opcion.cantidad > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s', backgroundColor: value === opcion.id ? '#fdf2f8' : 'transparent', opacity: opcion.cantidad > 0 ? 1 : 0.5 }}
                      onMouseOver={e => { if(opcion.cantidad > 0) e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                      onMouseOut={e => { if(opcion.cantidad > 0) e.currentTarget.style.backgroundColor = value === opcion.id ? '#fdf2f8' : 'transparent' }}
                    >
                      <FaCogs color={opcion.cantidad > 0 ? "#691B31" : "#94a3b8"} size={16} />
                      <span style={{ fontWeight: '500', color: '#334155' }}>{opcion.nombre} <small style={{color: '#64748b'}}>(x{opcion.cantidad})</small></span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto', backgroundColor: '#e2e8f0', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>{opcion.categoria}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center' }}>
                      No se encontraron componentes para "{search}"
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ width: '45%', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#ffffff', overscrollBehavior: 'contain' }}>
                    {Object.keys(gruposOpciones).map((group) => (
                      <div
                        key={group}
                        onMouseEnter={() => setHoveredCategory(group)}
                        style={{
                          padding: '0.75rem 0.85rem',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: hoveredCategory === group ? '#691B31' : '#475569',
                          backgroundColor: hoveredCategory === group ? '#fdf2f8' : 'transparent',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.2rem',
                          transition: 'background-color 0.2s, color 0.2s'
                        }}
                      >
                        {group} <FaChevronRight size={9} style={{ opacity: hoveredCategory === group ? 1 : 0.3 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ width: '55%', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#f8fafc', overscrollBehavior: 'contain' }}>
                    {hoveredCategory ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {hoveredCategory}
                        </div>
                        {gruposOpciones[hoveredCategory].map(opcion => (
                          <div
                            key={opcion.id}
                            onClick={() => { if(opcion.cantidad > 0) { onChange(opcion.id); setIsOpen(false); setSearch(''); } }}
                            style={{ padding: '0.65rem 0.85rem', cursor: opcion.cantidad > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.65rem', borderRadius: '8px', transition: 'background-color 0.15s', backgroundColor: value === opcion.id ? '#fdf2f8' : 'transparent', opacity: opcion.cantidad > 0 ? 1 : 0.5 }}
                            onMouseOver={e => { if(opcion.cantidad > 0) e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                            onMouseOut={e => { if(opcion.cantidad > 0) e.currentTarget.style.backgroundColor = value === opcion.id ? '#fdf2f8' : 'transparent'; }}
                          >
                            <FaCogs color={value === opcion.id ? '#691B31' : '#64748b'} size={15} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: value === opcion.id ? '#691B31' : '#475569' }}>
                              {opcion.nombre} <small style={{color: '#64748b'}}>(x{opcion.cantidad})</small>
                            </span>
                            {value === opcion.id && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#691B31', fontWeight: '700' }}>✓</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <FaCogs size={28} color="#cbd5e1" />
                        Pasa el cursor sobre una categoría
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};