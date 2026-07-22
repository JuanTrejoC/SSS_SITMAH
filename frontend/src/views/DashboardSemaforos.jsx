// src/views/DashboardSemaforos.jsx
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

  useEffect(() => {
    if (verDetalle || confirmResuelto.visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [verDetalle, confirmResuelto.visible])

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
      const response = await fetch(`${API_BASE_URL}/api/inventario/existencias?tipoInventario=semaforos`, {
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

  const asignarPieza = async () => {
    if (!componenteSeleccionado || cantidadAsignar < 1) return alert('Seleccione un componente e ingrese cantidad válida')
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reportes/semaforo/${verDetalle.id}/piezas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          componente_id: componenteSeleccionado,
          cantidad: cantidadAsignar
        })
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        const nuevaPieza = json.data;
        setVerDetalle({
          ...verDetalle,
          piezasAsignadas: [...(verDetalle.piezasAsignadas || []), nuevaPieza]
        });
        setReportes(prevReportes => 
          prevReportes.map(rep => 
            rep.id === verDetalle.id 
              ? { ...rep, piezasAsignadas: [...(rep.piezasAsignadas || []), nuevaPieza] } 
              : rep
          )
        );
        setComponenteSeleccionado('')
        setCantidadAsignar(1)
        cargarInventario()
      } else {
        alert('❌ Error: ' + (json.error || 'Desconocido'))
      }
    } catch (err) {
      alert('❌ Error de red')
    }
  }

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
          comentario: 'Actualizado desde el panel de semáforos'
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

  const eliminarReporte = async (id) => {
    if (!user?.token) return
    if (confirm('¿Eliminar este reporte de semáforos de forma permanente?')) {
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
      alert('❌ Error al generar el reporte Excel: ' + error.message)
    }
  }

  const reportesFiltrados = reportes.filter(r => {
    const coincideBusqueda =
      r.jefe_turno?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.estacion?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.crucero?.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.tipoFalla?.nombre?.toLowerCase().includes(busqueda.toLowerCase())

    const coincideEstado = estadoFiltro === 'Todos' ||
      (estadoFiltro === 'Pendiente' && r.estado === 'abierto') ||
      (estadoFiltro === 'En Proceso' && r.estado === 'en_proceso') ||
      (estadoFiltro === 'Resuelto' && r.estado === 'resuelto')

    return coincideBusqueda && coincideEstado
  })

  const obtenerNombreEstado = (estado) => {
    switch (estado) {
      case 'abierto': return 'Pendiente'
      case 'en_proceso': return 'En Proceso'
      case 'resuelto': return 'Resuelto'
      default: return estado
    }
  }

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ENCABEZADO CON SWITCHER DE MODULOS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: '#BC955B', fontSize: 'clamp(1.3rem, 3vw, 1.85rem)', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-traffic-light"></i> Panel de Reportes · Semáforos
            </h1>
            <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              Control de averías en intersecciones viales, mantenimiento de controladores y asignación de piezas.
            </p>
          </div>

          {/* Switcher Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#E2E8F0', padding: '0.35rem', borderRadius: '12px' }}>
            <button
              onClick={() => navigate('/dashboard-oficinas')}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#4B5563',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#691B31' }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#4B5563' }}
            >
              <i className="fa-solid fa-building"></i> Reportes Tecnológicos
            </button>

            <button
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: '#BC955B',
                color: 'white',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(188, 149, 91, 0.3)'
              }}
            >
              <i className="fa-solid fa-traffic-light"></i> Semáforos
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div style={{ backgroundColor: 'white', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: '600', color: '#4B5563', display: 'block', marginBottom: '0.35rem' }}>
                <i className="fa-solid fa-calendar-days" style={{ marginRight: '0.35rem', color: '#BC955B' }}></i> Mes y Año
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
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1D5DB', borderRadius: '10px', backgroundColor: 'white', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: '600', color: '#4B5563', display: 'block', marginBottom: '0.35rem' }}>
                Estado del Reporte
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1D5DB', borderRadius: '10px', backgroundColor: 'white', fontSize: '0.875rem', outline: 'none' }}
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Resuelto">Resueltos</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: '600', color: '#4B5563', display: 'block', marginBottom: '0.35rem' }}>
                Buscar por Término
              </label>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  placeholder="Jefe de turno, folio, estación, crucero o falla..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem 0.6rem 2.3rem', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={incluirImagenes} 
                    onChange={(e) => setIncluirImagenes(e.target.checked)}
                    style={{ accentColor: '#BC955B' }}
                  />
                  Incluir fotos en Excel
                </label>
                <label style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={ordenAscendente} 
                    onChange={(e) => setOrdenAscendente(e.target.checked)}
                    style={{ accentColor: '#BC955B' }}
                  />
                  Orden Ascendente
                </label>
              </div>

              <button
                onClick={descargarExcel}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)'
                }}
              >
                <i className="fa-solid fa-file-excel"></i> Exportar a Excel
              </button>
            </div>
          </div>
        </div>

        {/* TABLA DE SEMÁFOROS (RESPONSIVA) */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1.5px solid #E5E7EB' }}>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Folio</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Fecha</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Jefe de Turno</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Estación / Crucero</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Tipo de Falla</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: '700', color: '#374151' }}>Estado</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: '700', color: '#374151' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem', color: '#BC955B' }}></i>
                      Cargando reportes de semáforos...
                    </td>
                  </tr>
                ) : reportesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      No se encontraron reportes que coincidan con la búsqueda o filtros.
                    </td>
                  </tr>
                ) : (
                  reportesFiltrados.map(r => {
                    return (
                      <tr
                        key={r.id}
                        style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s ease' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#B45309' }}>
                          {formatFolio(r.folio, r.id)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#4B5563', whiteSpace: 'nowrap' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#111827' }}>
                          {r.jefe_turno}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#4B5563' }}>
                          <div>{r.estacion?.nombre || '—'}</div>
                          <span style={{ fontSize: '0.775rem', color: '#9CA3AF' }}>{r.crucero?.ubicacion || '—'}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#4B5563' }}>{r.tipoFalla?.nombre || '—'}</td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
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
                              padding: '0.35rem 0.6rem', 
                              border: '1px solid #D1D5DB', 
                              borderRadius: '8px', 
                              backgroundColor: r.estado === 'resuelto' ? '#ECFDF5' : r.estado === 'en_proceso' ? '#EFF6FF' : '#FFFBEB', 
                              color: r.estado === 'resuelto' ? '#065F46' : r.estado === 'en_proceso' ? '#1E40AF' : '#92400E',
                              fontWeight: '700',
                              fontSize: '0.8rem', 
                              outline: 'none', 
                              cursor: r.estado === 'resuelto' ? 'not-allowed' : 'pointer' 
                            }}
                          >
                            <option value="abierto">Pendiente</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="resuelto">Resuelto</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              onClick={() => setVerDetalle(r)}
                              title="Ver detalles"
                              style={{
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                border: 'none',
                                borderRadius: '8px',
                                width: '34px',
                                height: '34px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              onClick={() => eliminarReporte(r.id)}
                              title="Eliminar"
                              style={{
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '8px',
                                width: '34px',
                                height: '34px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <FaTrashAlt size={14} />
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
        </div>

        {/* MODAL DE DETALLES DE SEMÁFOROS */}
        {verDetalle && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '16px', width: '90%', maxWidth: '650px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#BC955B', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                  Detalles del Reporte {formatFolio(verDetalle.folio, verDetalle.id)}
                </h3>
                <button
                  onClick={() => { setVerDetalle(null); setMostrarInventario(false); setComponenteSeleccionado(''); }}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#6B7280', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.9rem', color: '#374151' }}>
                <div><strong>Jefe de Turno:</strong> {verDetalle.jefe_turno}</div>
                <div><strong>Estación:</strong> {verDetalle.estacion?.nombre || '—'}</div>
                <div><strong>Crucero:</strong> {verDetalle.crucero?.ubicacion || '—'}</div>
                <div><strong>Tipo de Falla:</strong> {verDetalle.tipoFalla?.nombre || '—'}</div>
                <div><strong>Hora Estimada:</strong> {verDetalle.hora_dano ? new Date(verDetalle.hora_dano).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                <div><strong>Estado:</strong> {obtenerNombreEstado(verDetalle.estado)}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Fecha Registro:</strong> {new Date(verDetalle.createdAt).toLocaleString()}</div>

                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <strong>Observaciones de la Falla:</strong>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', marginTop: '0.4rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid #E5E7EB', fontSize: '0.875rem' }}>
                    {verDetalle.descripcion || 'Sin observaciones adicionales.'}
                  </div>
                </div>

                {/* EVIDENCIA FOTOGRÁFICA */}
                {verDetalle.evidencias && verDetalle.evidencias.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '1.25rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.95rem', color: '#111827' }}>
                      Evidencia Fotográfica:
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                      {verDetalle.evidencias.map((ev) => (
                        <div key={ev.id} style={{ 
                          border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', 
                          maxWidth: '200px', backgroundColor: 'white'
                        }}>
                          {ev.mimetype?.startsWith('image/') ? (
                            <a
                              href={`${API_BASE_URL}/api/evidencias/${ev.id}?token=${user.token}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={`${API_BASE_URL}/api/evidencias/${ev.id}?token=${user.token}`}
                                alt={ev.filename}
                                style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                              />
                            </a>
                          ) : (
                            <a
                              href={`${API_BASE_URL}/api/evidencias/${ev.id}?token=${user.token}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '0.5rem', color: '#BC955B', textDecoration: 'none', backgroundColor: '#F8FAFC' }}
                            >
                              <i className="fa-solid fa-file" style={{ fontSize: '2rem' }}></i>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REFACCIONES / PIEZAS ASIGNADAS */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#111827' }}>Piezas / Refacciones Utilizadas:</strong>
                    <button
                      type="button"
                      onClick={() => setMostrarInventario(!mostrarInventario)}
                      style={{
                        backgroundColor: mostrarInventario ? '#BC955B' : '#F3F4F6',
                        color: mostrarInventario ? 'white' : '#374151',
                        border: '1px solid #D1D5DB',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {mostrarInventario ? 'Ocultar Catálogo' : '+ Asignar Pieza'}
                    </button>
                  </div>
                  
                  {mostrarInventario && (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #E5E7EB' }}>
                      <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '0.85rem', color: '#4B5563', fontWeight: '700' }}>Seleccionar del Inventario de Existencias</h4>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '180px' }}>
                          <CustomInventorySelect
                            value={componenteSeleccionado}
                            onChange={setComponenteSeleccionado}
                            inventario={inventario}
                          />
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={cantidadAsignar}
                          onChange={(e) => setCantidadAsignar(Number(e.target.value))}
                          style={{ width: '70px', padding: '0.6rem 0.5rem', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                        <button
                          onClick={asignarPieza}
                          style={{
                            padding: '0.65rem 1.25rem',
                            backgroundColor: '#2563EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.875rem'
                          }}
                        >
                          Asignar
                        </button>
                      </div>
                    </div>
                  )}

                  {verDetalle.piezasAsignadas && verDetalle.piezasAsignadas.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {verDetalle.piezasAsignadas.map((p, idx) => (
                        <div key={idx} style={{ 
                          padding: '0.85rem', 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB', 
                          borderRadius: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.85rem',
                          boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0,0,0,0.08)' }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(0,0,0,0.05)' }}
                        >
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                            <i className="fa-solid fa-microchip"></i>
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.componente?.nombre || 'Pieza'}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: '#6B7280' }}>
                              <span style={{ backgroundColor: '#F3F4F6', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600', color: '#374151' }}>
                                Cant: {p.cantidad}
                              </span>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.componente?.marca} {p.componente?.modelo}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF', fontStyle: 'italic' }}>No se han asignado piezas o refacciones.</div>
                  )}
                </div>

              </div>

              <button
                onClick={() => { setVerDetalle(null); setMostrarInventario(false); setComponenteSeleccionado(''); }}
                style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '10px', width: '100%', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE RESOLUCIÓN */}
        {confirmResuelto.visible && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#FEF3C7', color: '#D97706', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem', fontWeight: 'bold' }}>
                ?
              </div>
              <h3 style={{ color: '#111827', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: '800' }}>¿Confirmar Resolución?</h3>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Una vez marcado como <strong>Resuelto</strong>, no podrás volver a cambiar el estado de este reporte.
              </p>
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button 
                  onClick={() => setConfirmResuelto({ visible: false, id: null })} 
                  style={{ flex: 1, padding: '0.65rem', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    cambiarEstado(confirmResuelto.id, 'resuelto');
                    setConfirmResuelto({ visible: false, id: null });
                  }} 
                  style={{ flex: 1, padding: '0.65rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
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

  const filteredOptions = inventario.filter(o => {
    const searchTerm = search.toLowerCase();
    return (
      (o.nombre && o.nombre.toLowerCase().includes(searchTerm)) ||
      (o.categoria && o.categoria.toLowerCase().includes(searchTerm)) ||
      (o.marca && o.marca.toLowerCase().includes(searchTerm)) ||
      (o.modelo && o.modelo.toLowerCase().includes(searchTerm))
    );
  });

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
          padding: '0.65rem 1rem', border: isOpen ? '1.5px solid #2563EB' : '1px solid #D1D5DB', 
          borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white', 
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
          transition: 'all 0.2s'
        }}
      >
        <span>
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', fontWeight: '600' }}>
               {selectedOption.nombre || selectedOption.descripcion} (Disp: {selectedOption.cantidad ?? 'N/A'})
            </span>
          ) : (
            <span style={{ color: '#9CA3AF', fontWeight: '400' }}>-- Seleccionar pieza --</span>
          )}
        </span>
        <FaChevronRight size={12} style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: '0.2s', color: '#6B7280' }} />
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '0.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', zIndex: 50, border: '1px solid #E5E7EB', overflow: 'hidden', width: '100%', minWidth: '320px' }}>
          <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #E5E7EB', backgroundColor: '#ffffff' }}>
            <input
              type="text"
              placeholder="Buscar componente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.85rem' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div style={{ display: 'flex', height: '240px' }}>
            {search ? (
              <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
                {filteredOptions.length > 0 ? filteredOptions.map(opcion => (
                  <div
                    key={opcion.id}
                    onClick={() => { onChange(opcion.id); setIsOpen(false); setSearch(''); }}
                    style={{ padding: '0.65rem 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', backgroundColor: value === opcion.id ? '#FEF3C7' : 'transparent' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#FFFBEB'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = value === opcion.id ? '#FEF3C7' : 'transparent'}
                  >
                    <FaCogs color="#BC955B" size={16} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', color: '#111827' }}>{opcion.nombre || opcion.descripcion}</span>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Disp: {opcion.cantidad ?? 'N/A'} | {opcion.marca || ''} {opcion.modelo || ''}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '2rem', color: '#6B7280', textAlign: 'center', fontSize: '0.85rem' }}>
                    No se encontraron piezas para "{search}"
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ width: '45%', borderRight: '1px solid #E5E7EB', overflowY: 'auto', padding: '0.4rem', backgroundColor: '#ffffff' }}>
                  {Object.keys(gruposOpciones).map((group) => (
                    <div
                      key={group}
                      onMouseEnter={() => setHoveredCategory(group)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.825rem',
                        color: hoveredCategory === group ? '#BC955B' : '#4B5563',
                        backgroundColor: hoveredCategory === group ? '#FEF3C7' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      {group} <FaChevronRight size={9} style={{ opacity: hoveredCategory === group ? 1 : 0.3 }} />
                    </div>
                  ))}
                </div>
                <div style={{ width: '55%', overflowY: 'auto', padding: '0.4rem', backgroundColor: '#F8FAFC' }}>
                  {hoveredCategory ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {gruposOpciones[hoveredCategory].map(opcion => (
                        <div
                          key={opcion.id}
                          onClick={() => { onChange(opcion.id); setIsOpen(false); setSearch(''); }}
                          style={{ padding: '0.6rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem', borderRadius: '8px', backgroundColor: value === opcion.id ? '#FEF3C7' : 'transparent' }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF9C3'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = value === opcion.id ? '#FEF3C7' : 'transparent'}
                        >
                          <FaCogs color={value === opcion.id ? '#BC955B' : '#6B7280'} size={14} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: value === opcion.id ? '#BC955B' : '#374151' }}>
                              {opcion.nombre || opcion.descripcion}
                            </span>
                            <span style={{ fontSize: '0.725rem', color: '#6B7280' }}>
                              Disp: {opcion.cantidad ?? 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem' }}>
                      Pasa el cursor sobre una categoría
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};