import { useState, useEffect, useRef } from 'react'
import { FaEye, FaTrashAlt, FaChevronRight, FaCogs, FaFileExcel, FaWrench } from 'react-icons/fa'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'
import { formatFolio } from '../utils/formatFolio'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import AtencionReporte from '../components/AtencionReporte'

export default function DashboardInfraestructura() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
  const [estadoPiezaReemplazada, setEstadoPiezaReemplazada] = useState('reparacion')

  useEffect(() => {
    if (verDetalle || confirmResuelto.visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [verDetalle, confirmResuelto.visible])

  // Abrir reporte automáticamente si se accede desde notificación (?id=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const reportId = params.get('id')
    const folioParam = params.get('folio')
    if (!reportId && !folioParam) return

    if (reportes.length > 0) {
      const encontrado = reportes.find(r =>
        (reportId && String(r.id) === String(reportId)) ||
        (folioParam && String(r.folio).toLowerCase() === folioParam.toLowerCase())
      )
      if (encontrado) {
        setVerDetalle(encontrado)
        setEstadoFiltro('Todos')
        return
      }
    }

    if (reportId && user?.token) {
      fetch(`${API_BASE_URL}/api/admin/reportes/infraestructura/${reportId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(json => {
        if (json.ok && json.data) {
          setVerDetalle(json.data)
          setEstadoFiltro('Todos')
        }
      })
      .catch(err => console.error('Error al cargar reporte de infraestructura:', err))
    }
  }, [location.search, reportes, user?.token])

  // Cargar reportes de infraestructura
  const cargarReportes = async () => {
    if (!user?.token) return
    setCargando(true)
    try {
      let url = `${API_BASE_URL}/api/admin/reportes/infraestructura?limit=100`
      if (mesFiltro) url += `&mes=${mesFiltro}`
      if (anioFiltro) url += `&anio=${anioFiltro}`
      if (ordenAscendente) url += `&orden=asc`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        const lista = json.data?.items || json.data?.reportes || (Array.isArray(json.data) ? json.data : [])
        setReportes(lista)
      } else {
        console.error('Error al obtener reportes de infraestructura:', json.error)
      }
    } catch (err) {
      console.error('Error de red al obtener reportes de infraestructura:', err)
    } finally {
      setCargando(false)
    }
  }

  const cargarInventario = async () => {
    if (!user?.token) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventario/existencias?soloBuenEstado=true&limit=1000`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        const soloDisponibles = (json.data || []).filter(item => {
          const estado = item.estadoFisico || 'Buen Estado'
          const esBuenEstado = estado === 'Buen Estado' || (!item.estadoFisico && !item.nombre?.includes('Reemplazada'))
          return esBuenEstado && Number(item.cantidad) > 0 && !item.nombre?.includes('Reemplazada') && !item.nombre?.includes('Retirada')
        })
        setInventario(soloDisponibles)
      }
    } catch (err) {
      console.error('Error al cargar inventario', err)
    }
  }

  useEffect(() => {
    cargarReportes()
    cargarInventario()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mesFiltro, anioFiltro, ordenAscendente])

  const asignarPieza = async () => {
    if (!componenteSeleccionado) {
      Swal.fire('Atención', 'Seleccione un componente o refacción', 'warning')
      return
    }

    const yaAsignada = verDetalle?.piezasAsignadas?.some(
      p => p.componenteId === Number(componenteSeleccionado) || p.componente?.id === Number(componenteSeleccionado)
    )
    if (yaAsignada) {
      Swal.fire('Pieza duplicada', 'Esta refacción ya fue asignada a este reporte.', 'warning')
      return
    }

    const estadoTexto = estadoPiezaReemplazada === 'reparacion' ? 'En Reparación' : 'Dañada / Para baja'
    const result = await Swal.fire({
      title: '¿Confirmar asignación?',
      html: `Se asignará 1 unidad de esta refacción nueva para el reemplazo.<br><br><strong>Destino de la pieza reemplazada:</strong> <span style="color: ${estadoPiezaReemplazada === 'reparacion' ? '#2563EB' : '#DC2626'}">${estadoTexto}</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#691B31'
    })
    if (!result.isConfirmed) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reportes/infraestructura/${verDetalle.id}/piezas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          componente_id: Number(componenteSeleccionado),
          cantidad: 1,
          estado_pieza_reemplazada: estadoPiezaReemplazada
        })
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        const nuevaPieza = json.data
        setVerDetalle({
          ...verDetalle,
          piezasAsignadas: [...(verDetalle.piezasAsignadas || []), nuevaPieza]
        })
        setReportes(prevReportes =>
          prevReportes.map(rep =>
            rep.id === verDetalle.id
              ? { ...rep, piezasAsignadas: [...(rep.piezasAsignadas || []), nuevaPieza] }
              : rep
          )
        )
        setComponenteSeleccionado('')
        setEstadoPiezaReemplazada('reparacion')
        cargarInventario()
        Swal.fire('Asignada', 'Refacción asignada correctamente al reporte.', 'success')
      } else {
        Swal.fire('Error', json.error || 'Desconocido', 'error')
      }
    } catch {
      Swal.fire('Error', 'Error de red al asignar pieza', 'error')
    }
  }

  const cambiarEstadoPiezaReemplazada = async (piezaId, nuevoEstado) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reportes/infraestructura/${verDetalle.id}/piezas/${piezaId}/estado-reemplazo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ estado_pieza_reemplazada: nuevoEstado })
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        setVerDetalle(prev => ({
          ...prev,
          piezasAsignadas: (prev.piezasAsignadas || []).map(p => p.id === piezaId ? { ...p, estadoPiezaReemplazada: nuevoEstado } : p)
        }))
        setReportes(prevReportes =>
          prevReportes.map(rep =>
            rep.id === verDetalle.id
              ? { ...rep, piezasAsignadas: (rep.piezasAsignadas || []).map(p => p.id === piezaId ? { ...p, estadoPiezaReemplazada: nuevoEstado } : p) }
              : rep
          )
        )
      } else {
        Swal.fire('Error', json.error || 'No se pudo actualizar el estado', 'error')
      }
    } catch {
      Swal.fire('Error', 'Error de red al actualizar estado de la refacción', 'error')
    }
  }

  const desasignarPieza = async (piezaId, nombrePieza) => {
    const result = await Swal.fire({
      title: '¿Desasignar pieza?',
      text: `¿Deseas remover "${nombrePieza || 'la pieza'}" de este reporte? La pieza será devuelta al stock disponible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reportes/infraestructura/${verDetalle.id}/piezas/${piezaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        setVerDetalle({
          ...verDetalle,
          piezasAsignadas: verDetalle.piezasAsignadas.filter(p => p.id !== piezaId)
        })
        setReportes(prevReportes =>
          prevReportes.map(rep =>
            rep.id === verDetalle.id
              ? { ...rep, piezasAsignadas: rep.piezasAsignadas?.filter(p => p.id !== piezaId) }
              : rep
          )
        )
        cargarInventario()
        Swal.fire('Desasignada', 'La pieza ha sido removida y el stock fue restaurado.', 'success')
      } else {
        Swal.fire('Error', json.error || 'Desconocido', 'error')
      }
    } catch {
      Swal.fire('Error', 'Error de red al desasignar pieza', 'error')
    }
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reportes/infraestructura/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        Swal.fire('Actualizado', `El estado ha cambiado a ${obtenerNombreEstado(nuevoEstado)}`, 'success')
        cargarReportes()
        if (verDetalle && verDetalle.id === id) {
          setVerDetalle(json.data)
        }
      } else {
        Swal.fire('Error', 'Error al cambiar estado: ' + (json.error || 'Desconocido'), 'error')
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err)
      Swal.fire('Error', 'Error de red al actualizar estado', 'error')
    }
  }

  const eliminarReporte = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar reporte?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reportes/infraestructura/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const json = await response.json()
        if (response.ok && json.ok) {
          Swal.fire('Eliminado', 'Reporte eliminado correctamente', 'success')
          cargarReportes()
        } else {
          Swal.fire('Error', 'Error al eliminar reporte: ' + (json.error || 'Desconocido'), 'error')
        }
      } catch (err) {
        console.error('Error al eliminar:', err)
        Swal.fire('Error', 'Error de red al eliminar reporte', 'error')
      }
    }
  }

  const descargarExcel = async () => {
    if (!user?.token) return
    try {
      let url = `${API_BASE_URL}/api/admin/reportes/infraestructura/export?`
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
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (!response.ok) throw new Error('Error al descargar archivo')
      const blob = await response.blob()
      const urlObj = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = `reportes_infraestructura_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
      a.click()
      URL.revokeObjectURL(urlObj)
    } catch (error) {
      Swal.fire('Error', 'Error al generar el reporte Excel: ' + error.message, 'error')
    }
  }

  const reportesFiltrados = reportes.filter(r => {
    const coincideBusqueda =
      r.solicitante?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.area?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.sede?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.equipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.descripcion?.toLowerCase().includes(busqueda.toLowerCase())

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

  // Contadores para KPIs
  const totalInfra = reportes.length
  const pendientesInfra = reportes.filter(r => r.estado === 'abierto').length
  const enProcesoInfra = reportes.filter(r => r.estado === 'en_proceso').length
  const resueltosInfra = reportes.filter(r => r.estado === 'resuelto').length

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ENCABEZADO INDEPENDIENTE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: '#059669', fontSize: 'clamp(1.3rem, 3vw, 1.85rem)', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FaWrench /> Panel de Reportes de Infraestructura
            </h1>
            <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              Gestión y seguimiento de averías en instalaciones, estaciones, edificios y mantenimiento general.
            </p>
          </div>
        </div>

        {/* TARJETAS KPI DE MÉTRICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              <FaWrench />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Total Reportes</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827' }}>{totalInfra}</div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Pendientes</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#DC2626' }}>{pendientesInfra}</div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              <i className="fa-solid fa-spinner"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>En Proceso</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#D97706' }}>{enProcesoInfra}</div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Resueltos</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#16A34A' }}>{resueltosInfra}</div>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div style={{ backgroundColor: 'white', padding: '1.35rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Input de Búsqueda */}
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
              <input
                type="text"
                placeholder="Buscar por folio, solicitante, sede o elemento..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.25rem', borderRadius: '10px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.875rem' }}
              />
            </div>

            {/* Selector de Estado */}
            <div>
              <select
                value={estadoFiltro}
                onChange={e => setEstadoFiltro(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Resuelto">Resueltos</option>
              </select>
            </div>

            {/* Filtro Mes */}
            <div>
              <select
                value={mesFiltro}
                onChange={e => setMesFiltro(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="">Todos los Meses</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>

            {/* Filtro Año */}
            <div>
              <select
                value={anioFiltro}
                onChange={e => setAnioFiltro(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="">Todos los Años</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          {/* Opciones Adicionales y Exportar a Excel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #F3F4F6', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4B5563', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ordenAscendente}
                  onChange={e => setOrdenAscendente(e.target.checked)}
                />
                Orden cronológico más antiguo primero
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4B5563', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={incluirImagenes}
                  onChange={e => setIncluirImagenes(e.target.checked)}
                />
                Incluir evidencias fotográficas en Excel
              </label>
            </div>

            <button
              onClick={descargarExcel}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <FaFileExcel /> Exportar a Excel
            </button>
          </div>
        </div>

        {/* TABLA DE REPORTES */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Folio</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Solicitante</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Área / Sede</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Elemento / Falla</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Prioridad</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#059669', marginBottom: '0.5rem', display: 'block' }}></i>
                      Cargando reportes de infraestructura...
                    </td>
                  </tr>
                ) : reportesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      No se encontraron reportes de infraestructura con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  reportesFiltrados.map((rep) => {
                    const esResuelto = rep.estado === 'resuelto'
                    const esProceso = rep.estado === 'en_proceso'

                    return (
                      <tr
                        key={rep.id}
                        style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#059669' }}>
                          {formatFolio(rep.folio, rep.id)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: '600', color: '#111827' }}>{rep.solicitante}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{rep.cargo?.nombre || rep.email}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ color: '#374151' }}>{rep.area?.nombre || 'Área no asignada'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{rep.sede?.nombre || 'Sede general'}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', maxWidth: '220px' }}>
                          <div style={{ fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rep.equipo || 'Infraestructura General'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rep.descripcion || 'Sin descripción'}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: rep.prioridad === 'alta' ? '#FEE2E2' : (rep.prioridad === 'media' ? '#FEF3C7' : '#D1FAE5'),
                              color: rep.prioridad === 'alta' ? '#991B1B' : (rep.prioridad === 'media' ? '#92400E' : '#065F46')
                            }}
                          >
                            {rep.prioridad?.toUpperCase() || 'MEDIA'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <select
                            value={rep.estado}
                            onChange={(e) => {
                              const nuevo = e.target.value
                              if (nuevo === 'resuelto') {
                                setConfirmResuelto({ visible: true, id: rep.id })
                              } else {
                                cambiarEstado(rep.id, nuevo)
                              }
                            }}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              border: '1px solid #D1D5DB',
                              cursor: 'pointer',
                              backgroundColor: esResuelto ? '#D1FAE5' : (esProceso ? '#FEF3C7' : '#FEE2E2'),
                              color: esResuelto ? '#065F46' : (esProceso ? '#92400E' : '#991B1B')
                            }}
                          >
                            <option value="abierto">Pendiente</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="resuelto">Resuelto</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                          {new Date(rep.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                            <button
                              onClick={() => setVerDetalle(rep)}
                              title="Ver detalles completos y gestionar atención"
                              style={{
                                backgroundColor: '#059669',
                                color: 'white',
                                border: 'none',
                                padding: '0.45rem',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <FaEye size={14} />
                            </button>
                            {user?.rol === 'administrador' && (
                              <button
                                onClick={() => eliminarReporte(rep.id)}
                                title="Eliminar reporte"
                                style={{
                                  backgroundColor: '#FEE2E2',
                                  color: '#DC2626',
                                  border: 'none',
                                  padding: '0.45rem',
                                  borderRadius: '7px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <FaTrashAlt size={14} />
                              </button>
                            )}
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

        {/* MODAL DE DETALLES Y RESOLUCIÓN */}
        {verDetalle && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '1rem'
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '780px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '800', textTransform: 'uppercase' }}>
                    Reporte de Infraestructura
                  </span>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#111827', margin: '0.2rem 0 0 0' }}>
                    Folio: {formatFolio(verDetalle.folio, verDetalle.id)}
                  </h2>
                </div>
                <button
                  onClick={() => { setVerDetalle(null); setMostrarInventario(false); setComponenteSeleccionado(''); }}
                  style={{ backgroundColor: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div><strong>Solicitante:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563' }}>{verDetalle.solicitante}</p></div>
                <div><strong>Cargo:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563' }}>{verDetalle.cargo?.nombre || 'General'}</p></div>
                <div><strong>Área / Dirección:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563' }}>{verDetalle.area?.nombre || 'N/A'}</p></div>
                <div><strong>Sede / Inmueble:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563' }}>{verDetalle.sede?.nombre || 'N/A'}</p></div>
                <div><strong>Correo:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563' }}>{verDetalle.email}</p></div>
                <div><strong>Teléfono:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563' }}>{verDetalle.telefono || 'N/A'}</p></div>
                <div><strong>Elemento / Falla:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563' }}>{verDetalle.equipo || 'Infraestructura General'}</p></div>
                <div><strong>Prioridad:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563', textTransform: 'capitalize' }}>{verDetalle.prioridad}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Descripción de la Incidencia:</strong> <p style={{ margin: '0.2rem 0 0 0', color: '#4B5563', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>{verDetalle.descripcion}</p></div>

                {/* EVIDENCIAS FOTOGRÁFICAS INICIALES */}
                {verDetalle.evidencias && verDetalle.evidencias.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <strong>Evidencia Fotográfica Adjunta:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {verDetalle.evidencias.map((ev, idx) => (
                        <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                          {ev.mimetype?.startsWith('image/') ? (
                            <a href={`${API_BASE_URL}/uploads/${ev.filepath}`} target="_blank" rel="noreferrer">
                              <img src={`${API_BASE_URL}/uploads/${ev.filepath}`} alt={`Evidencia ${idx + 1}`} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                            </a>
                          ) : (
                            <a href={`${API_BASE_URL}/uploads/${ev.filepath}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px', backgroundColor: '#F3F4F6', color: '#059669', textDecoration: 'none' }}>
                              <i className="fa-solid fa-file fa-2x"></i>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ASIGNACIÓN DE REFACCIONES / PIEZAS */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#111827' }}>Piezas / Refacciones Utilizadas:</strong>
                    <button
                      type="button"
                      onClick={() => setMostrarInventario(!mostrarInventario)}
                      style={{
                        backgroundColor: mostrarInventario ? '#059669' : '#F3F4F6',
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
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <div style={{ flex: '1', minWidth: '180px' }}>
                          <CustomInventorySelect
                            value={componenteSeleccionado}
                            onChange={setComponenteSeleccionado}
                            inventario={inventario}
                            piezasAsignadas={verDetalle.piezasAsignadas || []}
                          />
                        </div>
                        <button
                          onClick={asignarPieza}
                          style={{
                            padding: '0.65rem 1.25rem',
                            backgroundColor: '#059669',
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', paddingTop: '0.6rem', borderTop: '1px dashed #D1D5DB' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4B5563' }}>Destino de la refacción retirada:</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => setEstadoPiezaReemplazada('reparacion')}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              border: estadoPiezaReemplazada === 'reparacion' ? '1.5px solid #2563EB' : '1px solid #D1D5DB',
                              backgroundColor: estadoPiezaReemplazada === 'reparacion' ? '#EFF6FF' : 'white',
                              color: estadoPiezaReemplazada === 'reparacion' ? '#1D4ED8' : '#6B7280',
                              fontSize: '0.78rem',
                              fontWeight: estadoPiezaReemplazada === 'reparacion' ? '700' : '500',
                              cursor: 'pointer'
                            }}
                          >
                            🔧 A Reparación
                          </button>
                          <button
                            type="button"
                            onClick={() => setEstadoPiezaReemplazada('danada')}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              border: estadoPiezaReemplazada === 'danada' ? '1.5px solid #DC2626' : '1px solid #D1D5DB',
                              backgroundColor: estadoPiezaReemplazada === 'danada' ? '#FEF2F2' : 'white',
                              color: estadoPiezaReemplazada === 'danada' ? '#B91C1C' : '#6B7280',
                              fontSize: '0.78rem',
                              fontWeight: estadoPiezaReemplazada === 'danada' ? '700' : '500',
                              cursor: 'pointer'
                            }}
                          >
                            ⚠️ Dañada / Para baja
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {verDetalle.piezasAsignadas && verDetalle.piezasAsignadas.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                      {verDetalle.piezasAsignadas.map((p, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111827' }}>{p.componente?.nombre || 'Pieza'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Cant: {p.cantidad} | {p.componente?.marca} {p.componente?.modelo}</div>
                          </div>
                          <button
                            onClick={() => desasignarPieza(p.id, p.componente?.nombre)}
                            style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF', fontStyle: 'italic' }}>No se han asignado piezas.</div>
                  )}
                </div>

                {/* ATENCIÓN Y CIERRE DEL REPORTE */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <AtencionReporte
                    reporte={verDetalle}
                    tipo="infraestructura"
                    user={user}
                    apiBaseUrl={API_BASE_URL}
                    onActualizado={(reporteActualizado) => {
                      setVerDetalle(reporteActualizado)
                      cargarReportes()
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => { setVerDetalle(null); setMostrarInventario(false); setComponenteSeleccionado(''); }}
                style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '10px', width: '100%', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE RESOLUCIÓN */}
        {confirmResuelto.visible && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2050, padding: '1rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '16px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#D1FAE5', color: '#059669', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1.25rem' }}>
                ✓
              </div>
              <h3 style={{ color: '#111827', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: '800' }}>¿Confirmar Resolución?</h3>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Marcar este reporte de infraestructura como <strong>Resuelto</strong>.
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
                    cambiarEstado(confirmResuelto.id, 'resuelto')
                    setConfirmResuelto({ visible: false, id: null })
                  }}
                  style={{ flex: 1, padding: '0.65rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
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

// Selector customizado para inventario
const CustomInventorySelect = ({ value, onChange, inventario, piezasAsignadas = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selectRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const assignedIds = new Set(
    piezasAsignadas.map(p => Number(p.componenteId || p.componente?.id)).filter(Boolean)
  )

  const selectedOption = inventario.find(o => o.id === Number(value))

  const filteredOptions = inventario.filter(o => {
    const searchTerm = search.toLowerCase()
    return (
      (o.nombre && o.nombre.toLowerCase().includes(searchTerm)) ||
      (o.categoria && o.categoria.toLowerCase().includes(searchTerm)) ||
      (o.marca && o.marca.toLowerCase().includes(searchTerm)) ||
      (o.modelo && o.modelo.toLowerCase().includes(searchTerm))
    )
  })

  return (
    <div ref={selectRef} style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.65rem 1rem', border: isOpen ? '1.5px solid #059669' : '1px solid #D1D5DB',
          borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem'
        }}
      >
        <span>
          {selectedOption ? (
            <span style={{ color: '#111827', fontWeight: '600' }}>
              {selectedOption.nombre || selectedOption.descripcion} (Disp: {selectedOption.cantidad ?? 'N/A'})
            </span>
          ) : (
            <span style={{ color: '#9CA3AF' }}>-- Seleccionar pieza o herramienta --</span>
          )}
        </span>
        <FaChevronRight size={12} style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: '0.2s', color: '#6B7280' }} />
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '0.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', zIndex: 50, border: '1px solid #E5E7EB', overflow: 'hidden', width: '100%', minWidth: '300px' }}>
          <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #E5E7EB' }}>
            <input
              type="text"
              placeholder="Buscar pieza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '0.85rem' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.4rem' }}>
            {filteredOptions.length > 0 ? filteredOptions.map(opcion => {
              const yaAsignada = assignedIds.has(opcion.id)
              const sinStock = Number(opcion.cantidad) <= 0
              const deshabilitada = yaAsignada || sinStock

              return (
                <div
                  key={opcion.id}
                  onClick={() => {
                    if (deshabilitada) return
                    onChange(opcion.id)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  style={{
                    padding: '0.6rem 0.85rem',
                    cursor: deshabilitada ? 'not-allowed' : 'pointer',
                    opacity: deshabilitada ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: value === opcion.id ? '#D1FAE5' : 'transparent'
                  }}
                  onMouseOver={e => { if (!deshabilitada) e.currentTarget.style.backgroundColor = '#ECFDF5' }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = value === opcion.id ? '#D1FAE5' : 'transparent' }}
                >
                  <FaCogs color="#059669" size={14} />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem' }}>{opcion.nombre || opcion.descripcion}</span>
                      {yaAsignada && (
                        <span style={{ fontSize: '0.65rem', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '700' }}>
                          Ya asignada
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Disp: {opcion.cantidad ?? 'N/A'} | {opcion.marca || ''} {opcion.modelo || ''}</span>
                  </div>
                </div>
              )
            }) : (
              <div style={{ padding: '1rem', color: '#6B7280', textAlign: 'center', fontSize: '0.85rem' }}>
                No se encontraron piezas
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
