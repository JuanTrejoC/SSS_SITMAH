import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import {
  FaRoad, FaPlus, FaEdit, FaTrashAlt, FaBoxes,
  FaChevronLeft, FaChevronRight, FaTimes,
  FaCogs, FaWrench, FaHdd, FaTools,
  FaWalking, FaVolumeUp, FaDesktop, FaCreditCard,
  FaPowerOff, FaMicrochip, FaNetworkWired, FaProjectDiagram,
  FaMapMarkerAlt, FaHandPointer, FaSign, FaCheckSquare,
  FaCalendarAlt, FaUpload, FaHistory
} from 'react-icons/fa'

// ==================================================
// CONFIGURACIONES PREDEFINIDAS POR MODELO DE POSTE
// Ajusta los valores segun los postes de tu municipio
// ==================================================
const MODELOS_POSTE = {
  'PS-3C': {
    label: 'PS-3C — Poste Simple 3 Caras',
    semaforos3Luces: 3,
    semaforos4Luces: 0,
    totalLedsVerdes: 48,
    totalFlechasVerdes: 0,
    totalLedsRojos: 48,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 16
  },
  'PS-4C': {
    label: 'PS-4C — Poste Simple 4 Caras',
    semaforos3Luces: 0,
    semaforos4Luces: 4,
    totalLedsVerdes: 64,
    totalFlechasVerdes: 0,
    totalLedsRojos: 64,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 24
  },
  'PD-3C': {
    label: 'PD-3C — Poste Doble 3 Caras',
    semaforos3Luces: 6,
    semaforos4Luces: 0,
    totalLedsVerdes: 96,
    totalFlechasVerdes: 16,
    totalLedsRojos: 96,
    totalFlechasRojas: 16,
    totalLedsAmarillos: 32
  },
  'PD-4C': {
    label: 'PD-4C — Poste Doble 4 Caras',
    semaforos3Luces: 0,
    semaforos4Luces: 8,
    totalLedsVerdes: 128,
    totalFlechasVerdes: 24,
    totalLedsRojos: 128,
    totalFlechasRojas: 24,
    totalLedsAmarillos: 48
  }
}

const getCategoriaLabel = (cat) => {
  const categories = {
    componente: 'Componente',
    accesorio: 'Accesorio',
    periferico: 'Periférico',
    equipo: 'Equipo',
    herramienta: 'Herramienta'
  };
  return categories[cat] || cat;
};

const getCategoriaIcon = (cat) => {
  switch (cat) {
    case 'componente': return <FaCogs style={{ color: '#4f46e5' }} />;
    case 'accesorio': return <FaWrench style={{ color: '#0d9488' }} />;
    case 'periferico': return <FaHdd style={{ color: '#ea580c' }} />;
    case 'equipo': return <FaTools style={{ color: '#eab308' }} />;
    default: return <FaBoxes style={{ color: '#64748b' }} />;
  }
};

export default function InventarioSemaforos() {
  const { user } = useAuth()
  const [tabActiva, setTabActiva] = useState('existencias') // 'existencias' o 'controladores'

  // ==========================================
  // ESTADOS - CATALOGOS
  // ==========================================
  const [listaCruceros, setListaCruceros] = useState([])

  // ==========================================
  // ESTADOS - EXISTENCIAS / REFACCIONES
  // ==========================================
  const [existencias, setExistencias] = useState([])
  const [cargandoExistencias, setCargandoExistencias] = useState(false)
  const [modalStockAbierto, setModalStockAbierto] = useState(false)
  const [modoAjusteDirecto, setModoAjusteDirecto] = useState(false)
  const [editandoStockId, setEditandoStockId] = useState(null)
  const [busquedaExistencias, setBusquedaExistencias] = useState('')
  const [stockForm, setStockForm] = useState({
    nombre: '',
    categoria: 'componente',
    cantidad: 1,
    tipoInventario: 'semaforos'
  })

  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false)
  const [historialData, setHistorialData] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [componenteHistorialActual, setComponenteHistorialActual] = useState(null)
  const [filtroMesHistorial, setFiltroMesHistorial] = useState('')

  // ==========================================
  // ESTADOS - CONTROLADORES INSTALADOS
  // ==========================================
  const [controladores, setControladores] = useState([])
  const [todosLosControladores, setTodosLosControladores] = useState([])
  const [dbSemaforosTipo, setDbSemaforosTipo] = useState(null)
  const [dbSemaforosItem, setDbSemaforosItem] = useState(null)
  const [dbSemaforosExpandido, setDbSemaforosExpandido] = useState(false)
  const [cargandoControladores, setCargandoControladores] = useState(false)
  const [totalControladores, setTotalControladores] = useState(0)
  const [paginaControladores, setPaginaControladores] = useState(1)
  const [limiteControladores] = useState(10)
  const [modalControladorAbierto, setModalControladorAbierto] = useState(false)
  const [editandoControladorId, setEditandoControladorId] = useState(null)
  const [mostrarProgramacion, setMostrarProgramacion] = useState(false)
  const [archivoProgramacion, setArchivoProgramacion] = useState(null)

  const [controladorForm, setControladorForm] = useState({
    modelo: '',
    cruceroId: '',
    semaforos3Luces: 0,
    semaforos4Luces: 0,
    totalLedsVerdes: 0,
    totalFlechasVerdes: 0,
    totalLedsRojos: 0,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 0,
    pasoPeatonal: false,
    audible: false,
    pantallaLed: false,
    tarjetaRelevadora: false,
    tarjetaRelevadoraDetalle: '',
    fuentePoder: false,
    cpu: false,
    cpuDetalle: '',
    switch: false,
    fibraOptica: false,
    gps: false,
    gpsDetalle: '',
    botonera: false,
    poste: false,
    modeloPoste: ''
  })

  const [controladorErrores, setControladorErrores] = useState({})

  // ==========================================
  // EFECTOS Y CARGA DE DATOS
  // ==========================================
  // ==========================================
  const cargarCatalogos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogos/cruceros`)
      if (res.ok) {
        const json = await res.json()
        if (json.ok) setListaCruceros(json.data)
      }
    } catch (err) {
      console.error('Error al cargar catálogo de cruceros:', err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCatalogos()
  }, [])

  const cargarExistencias = async () => {
    if (!user?.token) return
    setCargandoExistencias(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/existencias?tipoInventario=semaforos`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.ok) setExistencias(json.data)
      }
    } catch (err) {
      console.error('Error al cargar existencias:', err)
    } finally {
      setCargandoExistencias(false)
    }
  }

  const cargarTodosLosControladores = async () => {
    if (!user?.token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores?page=1&limit=1000`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.ok) {
          setTodosLosControladores(json.data.items)
        }
      }
    } catch (err) {
      console.error('Error al cargar todos los controladores:', err)
    }
  }

  const cargarControladores = async () => {
    if (!user?.token) return
    setCargandoControladores(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/inventario/controladores?page=${paginaControladores}&limit=${limiteControladores}`,
        { headers: { 'Authorization': `Bearer ${user.token}` } }
      )
      if (res.ok) {
        const json = await res.json()
        if (json.ok) {
          setControladores(json.data.items)
          setTotalControladores(json.data.total)
          cargarTodosLosControladores()
        }
      }
    } catch (err) {
      console.error('Error al cargar controladores:', err)
    } finally {
      setCargandoControladores(false)
    }
  }

  useEffect(() => {
    if (tabActiva === 'existencias') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarExistencias()
    } else {
      cargarControladores()
      cargarTodosLosControladores()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva, paginaControladores])

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (modalStockAbierto || modalHistorialAbierto || modalControladorAbierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalStockAbierto, modalHistorialAbierto, modalControladorAbierto])


  // ==========================================
  // ACCIONES - EXISTENCIAS / REFACCIONES
  // ==========================================
  const handleGuardarStock = async (e) => {
    e.preventDefault()
    if (!stockForm.nombre.trim()) {
      Swal.fire('Error', 'El nombre del componente es obligatorio.', 'error')
      return
    }

    const url = editandoStockId
      ? `${API_BASE_URL}/api/inventario/existencias/${editandoStockId}`
      : `${API_BASE_URL}/api/inventario/existencias`
    const method = editandoStockId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(stockForm)
      })

      if (res.ok) {
        const json = await res.json()
        if (json.ok) {
          Swal.fire({
            title: 'Éxito',
            text: editandoStockId ? 'Existencias actualizadas correctamente.' : 'Existencias ingresadas correctamente.',
            icon: 'success',
            confirmButtonColor: '#691B31'
          })
          setModalStockAbierto(false)
          resetStockForm()
          cargarExistencias()
        } else {
          Swal.fire('Error', json.error || 'No se pudo guardar la refacción.', 'error')
        }
      }
    } catch (err) {
      console.error('Error al guardar existencias:', err)
      Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error')
    }
  }

  const handleEditarStock = (item) => {
    setEditandoStockId(item.id)
    setModoAjusteDirecto(false)
    setStockForm({
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad,
      tipoInventario: 'semaforos'
    })
    setModalStockAbierto(true)
  }

  // eslint-disable-next-line no-unused-vars
  const handleEliminarStock = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Se eliminará esta refacción por completo del stock.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/existencias/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        })

        const json = await res.json()
        if (res.ok && json.ok) {
          Swal.fire('Eliminado', 'La refacción ha sido eliminada del inventario.', 'success')
          cargarExistencias()
        } else {
          Swal.fire('Error', json.error || 'No se pudo eliminar.', 'error')
        }
      } catch (err) {
        console.error('Error al eliminar existencia:', err)
      }
    }
  }

  const handleAjustarStockDirecto = (item) => {
    setEditandoStockId(item.id)
    setModoAjusteDirecto(true)
    setStockForm({
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad
    })
    setModalStockAbierto(true)
  }

  const resetStockForm = () => {
    setEditandoStockId(null)
    setModoAjusteDirecto(false)
    setStockForm({
      nombre: '',
      categoria: 'componente',
      cantidad: 1,
      tipoInventario: 'semaforos'
    })
  }

  const abrirHistorial = async (item) => {
    setComponenteHistorialActual(item)
    setFiltroMesHistorial('')
    setModalHistorialAbierto(true)
    setCargandoHistorial(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/existencias/${item.id}/historial`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.ok) setHistorialData(json.data)
      }
    } catch (err) {
      console.error('Error al cargar historial:', err)
    } finally {
      setCargandoHistorial(false)
    }
  }

  const cerrarHistorial = () => {
    setModalHistorialAbierto(false)
    setHistorialData([])
    setComponenteHistorialActual(null)
  }

  // ==========================================
  // ACCIONES - CONTROLADORES INSTALADOS
  // ==========================================
  const validarControlador = () => {
    const errores = {}
    if (!controladorForm.modelo.trim()) errores.modelo = 'El modelo es obligatorio.'
    if (!controladorForm.cruceroId) errores.cruceroId = 'El crucero es obligatorio.'
    setControladorErrores(errores)
    return Object.keys(errores).length === 0
  }

  const handleGuardarControlador = async (e) => {
    e.preventDefault()
    if (!validarControlador()) return

    const url = editandoControladorId
      ? `${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}`
      : `${API_BASE_URL}/api/inventario/controladores`
    const metodo = editandoControladorId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(controladorForm)
      })

      if (res.ok) {
        const json = await res.json()
        if (json.ok) {
          Swal.fire({
            title: 'Éxito',
            text: editandoControladorId ? 'Controlador actualizado.' : 'Controlador registrado.',
            icon: 'success',
            confirmButtonColor: '#691B31'
          })
          setModalControladorAbierto(false)
          resetControladorForm()
          cargarControladores()
        } else {
          Swal.fire('Error', json.error || 'Ocurrió un problema.', 'error')
        }
      }
    } catch (err) {
      console.error('Error al guardar controlador:', err)
      Swal.fire('Error', 'Error en el servidor.', 'error')
    }
  }

  const handleEditarControlador = (item) => {
    setEditandoControladorId(item.id)
    setControladorForm({
      modelo: item.modelo,
      cruceroId: item.cruceroId,
      semaforos3Luces: item.semaforos3Luces || 0,
      semaforos4Luces: item.semaforos4Luces || 0,
      totalLedsVerdes: item.totalLedsVerdes,
      totalFlechasVerdes: item.totalFlechasVerdes || 0,
      totalLedsRojos: item.totalLedsRojos,
      totalFlechasRojas: item.totalFlechasRojas || 0,
      totalLedsAmarillos: item.totalLedsAmarillos,
      pasoPeatonal: item.pasoPeatonal,
      audible: item.audible,
      pantallaLed: item.pantallaLed,
      tarjetaRelevadora: item.tarjetaRelevadora,
      tarjetaRelevadoraDetalle: item.tarjetaRelevadoraDetalle || '',
      fuentePoder: item.fuentePoder,
      cpu: item.cpu,
      cpuDetalle: item.cpuDetalle || '',
      switch: item.switch,
      fibraOptica: item.fibraOptica,
      gps: item.gps,
      gpsDetalle: item.gpsDetalle || '',
      botonera: item.botonera,
      poste: item.poste || false,
      modeloPoste: item.modeloPoste || ''
    })
    setControladorErrores({})
    setModalControladorAbierto(true)
  }

  const handleEliminarControlador = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'No podrá deshacer esta acción. El controlador se eliminará del inventario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        })

        if (res.ok) {
          Swal.fire('Eliminado', 'El controlador ha sido eliminado del inventario.', 'success')
          cargarControladores()
        }
      } catch (err) {
        console.error('Error al eliminar controlador:', err)
      }
    }
  }

  const resetControladorForm = () => {
    setEditandoControladorId(null)
    setControladorForm({
      modelo: '',
      cruceroId: '',
      semaforos3Luces: 0,
      semaforos4Luces: 0,
      totalLedsVerdes: 0,
      totalFlechasVerdes: 0,
      totalLedsRojos: 0,
      totalFlechasRojas: 0,
      totalLedsAmarillos: 0,
      pasoPeatonal: false,
      audible: false,
      pantallaLed: false,
      tarjetaRelevadora: false,
      tarjetaRelevadoraDetalle: '',
      fuentePoder: false,
      cpu: false,
      cpuDetalle: '',
      switch: false,
      fibraOptica: false,
      gps: false,
      gpsDetalle: '',
      botonera: false,
      poste: false,
      modeloPoste: ''
    })
    setControladorErrores({})
  }

  return (
    <main style={{ padding: '2rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>

      {/* HEADER DE LA SECCIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaRoad /> Inventario de Semáforos
          </h1>
          <p style={{ color: '#6F7271', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Gestione controladores semafóricos instalados y existencias de refacciones en stock.
          </p>
        </div>

        {/* BOTONES DE CREACIÓN SEGÚN TAB */}
        {tabActiva === 'existencias' ? (
          <button
            onClick={() => { resetStockForm(); setModalStockAbierto(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
              border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
              transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(105,27,49,0.15)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A02142'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#691B31'}
          >
            <FaPlus /> Ingresar Existencias
          </button>
        ) : (
          <button
            onClick={() => { resetControladorForm(); setModalControladorAbierto(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
              border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
              transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(105,27,49,0.15)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A02142'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#691B31'}
          >
            <FaPlus /> Registrar Controlador
          </button>
        )}
      </div>

      {/* ================= SEMÁFOROS DASHBOARD INTERACTIVO DRILL-DOWN ================= */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setDbSemaforosExpandido(!dbSemaforosExpandido)}>
          <h2 style={{ fontSize: '1.15rem', color: '#1E293B', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#691B31' }}></span> Dashboard Rápido e Interactivo de {tabActiva === 'existencias' ? 'Existencias' : 'Controladores'}
          </h2>
          <button style={{ background: 'none', border: 'none', color: '#691B31', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
            {dbSemaforosExpandido ? '▲ Ocultar' : '▼ Mostrar'}
          </button>
        </div>

        {dbSemaforosExpandido && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            {/* BREADCRUMBS Y VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B', fontWeight: '500' }}>
                <span style={{ cursor: 'pointer', color: '#691B31' }} onClick={() => { setDbSemaforosTipo(null); setDbSemaforosItem(null); }}>Inicio</span>
                {dbSemaforosTipo && (
                  <>
                    <span>/</span>
                    <span
                      style={{ cursor: dbSemaforosItem ? 'pointer' : 'default', color: dbSemaforosItem ? '#691B31' : '#475569', fontWeight: !dbSemaforosItem ? 'bold' : '500' }}
                      onClick={() => { setDbSemaforosItem(null); }}
                    >
                      {tabActiva === 'existencias' ? getCategoriaLabel(dbSemaforosTipo) : dbSemaforosTipo}
                    </span>
                  </>
                )}
                {dbSemaforosItem && (
                  <>
                    <span>/</span>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>{dbSemaforosItem}</span>
                  </>
                )}
              </div>

              {(dbSemaforosTipo || dbSemaforosItem) && (
                <button
                  onClick={() => {
                    if (dbSemaforosItem) {
                      setDbSemaforosItem(null);
                    } else if (dbSemaforosTipo) {
                      setDbSemaforosTipo(null);
                    }
                  }}
                  style={{
                    backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px',
                    padding: '0.35rem 0.75rem', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer',
                    color: '#475569', transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                >
                  Volver Atrás
                </button>
              )}
            </div>

            {/* TAB: EXISTENCIAS (REFACCIONES) */}
            {tabActiva === 'existencias' && (
              <>
                {/* NIVEL 1: POR CATEGORIA */}
                {!dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>Selecciona una categoría de componentes para ver las piezas en stock:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                      {Object.entries(
                        existencias.reduce((acc, curr) => {
                          const c = curr.categoria || 'componente';
                          acc[c] = (acc[c] || 0) + curr.cantidad;
                          return acc;
                        }, {})
                      ).map(([cat, totalStock]) => (
                        <div
                          key={cat}
                          onClick={() => setDbSemaforosTipo(cat)}
                          style={{
                            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                            padding: '1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{ fontSize: '1.5rem' }}>{getCategoriaIcon(cat)}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{getCategoriaLabel(cat)}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{totalStock} unidades</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NIVEL 2: LISTADO DE PIEZAS */}
                {dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>
                      Listado de existencias de la categoría <strong>{getCategoriaLabel(dbSemaforosTipo)}</strong>:
                    </p>
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Artículo</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Marca / Modelo</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Detalles</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {existencias
                            .filter(item => item.categoria === dbSemaforosTipo)
                            .map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#1E293B', textTransform: 'capitalize' }}>
                                  {item.nombre}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                  {item.marca || '—'} {item.modelo || '—'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.8rem' }}>
                                  {item.numeroSerie && <div>S/N: {item.numeroSerie}</div>}
                                  {item.numeroInventario && <div>Inv: {item.numeroInventario}</div>}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', color: item.cantidad > 5 ? '#0f766e' : '#b45309', fontSize: '1.1rem' }}>
                                  {item.cantidad}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB: CONTROLADORES INSTALADOS */}
            {tabActiva === 'controladores' && (
              <>
                {/* NIVEL 1: POR MODELO */}
                {!dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>Selecciona un modelo de controlador para ver sus cruceros instalados:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                      {Object.entries(
                        todosLosControladores.reduce((acc, curr) => {
                          const m = curr.modelo || 'Otro';
                          acc[m] = (acc[m] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([modelo, count]) => (
                        <div
                          key={modelo}
                          onClick={() => setDbSemaforosTipo(modelo)}
                          style={{
                            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                            padding: '1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{ color: '#691B31', fontSize: '1.5rem' }}><FaRoad /></div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{modelo}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{count} instalados</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NIVEL 2: CRUCEROS CON EL MODELO */}
                {dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>
                      Desglose de controladores modelo <strong>{dbSemaforosTipo}</strong> instalados en cruceros:
                    </p>
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Crucero / Ubicación</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Semáforos (3 L / 4 L)</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>LEDs (V / R / A)</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Accesorios Activos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todosLosControladores
                            .filter(ctrl => ctrl.modelo === dbSemaforosTipo)
                            .map(ctrl => (
                              <tr key={ctrl.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#1E293B' }}>
                                  {ctrl.crucero?.nombre || `Crucero #${ctrl.cruceroId}`}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                  3 luces: {ctrl.semaforos3Luces} | 4 luces: {ctrl.semaforos4Luces}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155', fontSize: '0.85rem' }}>
                                  🟢 {ctrl.totalLedsVerdes} | 🔴 {ctrl.totalLedsRojos} | 🟡 {ctrl.totalLedsAmarillos}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {ctrl.pasoPeatonal && <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Paso Peatonal</span>}
                                    {ctrl.audible && <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Audible</span>}
                                    {ctrl.pantallaLed && <span style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Pantalla LED</span>}
                                    {ctrl.gps && <span style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>GPS</span>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* CONTROLES DE PESTAÑA (TABS) */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #E2E8F0', marginBottom: '2rem' }}>
        <button
          onClick={() => setTabActiva('existencias')}
          style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', fontSize: '1rem', fontWeight: '700',
            color: tabActiva === 'existencias' ? '#691B31' : '#9B9B9A', cursor: 'pointer',
            borderBottom: tabActiva === 'existencias' ? '3px solid #BC955B' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaBoxes /> Existencias (Refacciones)
          </div>
        </button>

        <button
          onClick={() => setTabActiva('controladores')}
          style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', fontSize: '1rem', fontWeight: '700',
            color: tabActiva === 'controladores' ? '#691B31' : '#9B9B9A', cursor: 'pointer',
            borderBottom: tabActiva === 'controladores' ? '3px solid #BC955B' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaRoad /> Controladores Instalados
          </div>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TABA: EXISTENCIAS / STOCK                                    */}
      {/* ============================================================ */}
      {tabActiva === 'existencias' && (
        <div>
          {/* BUSCADOR DE REFACCIONES */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Buscar refacción por nombre..."
                value={busquedaExistencias}
                onChange={(e) => setBusquedaExistencias(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1.5rem',
                  border: '2px solid #E2E8F0',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1E293B',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#BC955B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(188,149,91,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#BC955B', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                </svg>
              </span>
            </div>
          </div>

          {cargandoExistencias ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando existencias de componentes...</div>
          ) : existencias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#6F7271' }}>
              No se han encontrado registros en el stock.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {existencias
                .filter((item) => item.nombre.toLowerCase().includes(busquedaExistencias.toLowerCase()))
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#475569',
                          textTransform: 'uppercase',
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px'
                        }}>
                          {getCategoriaIcon(item.categoria)}
                          {getCategoriaLabel(item.categoria)}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', margin: '0.75rem 0 0.25rem', fontWeight: '800', color: '#1e293b', textTransform: 'capitalize' }}>
                          {item.nombre}
                        </h3>
                        {(item.marca || item.modelo) && (
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {item.marca && <span style={{ fontWeight: '600' }}>{item.marca}</span>}
                            {item.marca && item.modelo && ' - '}
                            {item.modelo && <span>{item.modelo}</span>}
                          </div>
                        )}
                        {(item.numeroSerie || item.numeroInventario) && (
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                            {item.numeroSerie && <span>S/N: {item.numeroSerie}</span>}
                            {item.numeroInventario && <span>Inv: {item.numeroInventario}</span>}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => abrirHistorial(item)}
                          title="Ver historial de asignación"
                          style={{
                            backgroundColor: '#e0f2fe', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#bae6fd'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                        >
                          <FaHistory size={14} />
                        </button>
                        <button
                          onClick={() => handleEditarStock(item)}
                          title="Editar existencias"
                          style={{
                            backgroundColor: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                        >
                          <FaEdit size={14} />
                        </button>
                        {/* Botón de eliminar deshabilitado según requerimiento (solo se permite ajustar stock) */}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleAjustarStockDirecto(item)}
                        style={{
                          backgroundColor: '#f1f5f9', color: '#691B31', border: 'none', borderRadius: '6px',
                          padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#691B31'; e.currentTarget.style.color = 'white' }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#691B31' }}
                      >
                        Ajustar Stock
                      </button>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: item.cantidad > 5 ? '#0f766e' : item.cantidad > 0 ? '#b45309' : '#be123c',
                        backgroundColor: item.cantidad > 5 ? '#f0fdf4' : item.cantidad > 0 ? '#fffbeb' : '#fdf2f2',
                        padding: '0.1rem 0.8rem',
                        borderRadius: '8px'
                      }}>
                        {item.cantidad}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB B: CONTROLADORES INSTALADOS                              */}
      {/* ============================================================ */}
      {tabActiva === 'controladores' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {cargandoControladores ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando controladores...</div>
          ) : controladores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>No se han registrado controladores en el sistema.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#691B31' }}>Modelo</th>
                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271' }}>Ubicación (Crucero)</th>
                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271', textAlign: 'center' }}>Cabezales</th>
                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271', textAlign: 'center' }}>Leds (V / R / A)</th>
                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271' }}>Componentes</th>
                    <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {controladores.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #E2E8F0',
                        backgroundColor: index % 2 === 0 ? 'white' : '#fcfbf9',
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fcfbf9'}
                    >
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#691B31' }}>{item.modelo}</td>
                      <td style={{ padding: '1rem', color: '#6F7271', fontWeight: '500' }}>{item.crucero?.nombre || 'Sin Crucero'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ color: '#16a34a' }}>3 leds: {item.semaforos3Luces || 0}</span>
                          <span style={{ color: '#0284c7' }}>4 leds: {item.semaforos4Luces || 0}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="Verdes">
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 4px rgba(16,185,129,0.4)' }}></span>
                            <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.9rem' }}>{item.totalLedsVerdes}</span>
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="Rojos">
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 4px rgba(239,68,68,0.4)' }}></span>
                            <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.9rem' }}>{item.totalLedsRojos}</span>
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="Amarillos">
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 4px rgba(245,158,11,0.4)' }}></span>
                            <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.9rem' }}>{item.totalLedsAmarillos}</span>
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {item.pasoPeatonal && <span style={{ backgroundColor: '#DDC9A3', color: '#691B31', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Paso Peatonal</span>}
                          {item.audible && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Audible</span>}
                          {item.pantallaLed && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Pantalla LED</span>}
                          {item.tarjetaRelevadora && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Relés</span>}
                          {item.fuentePoder && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Fuente</span>}
                          {item.cpu && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>CPU</span>}
                          {item.switch && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Switch</span>}
                          {item.fibraOptica && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Fibra</span>}
                          {item.gps && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>GPS</span>}
                          {item.botonera && <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>Botonera</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEditarControlador(item)}
                            title="Editar"
                            style={{ backgroundColor: '#BC955B', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d4ae73'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#BC955B'}
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleEliminarControlador(item.id)}
                            title="Eliminar"
                            style={{ backgroundColor: '#A02142', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#691B31'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#A02142'}
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINACIÓN */}
              {totalControladores > limiteControladores && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.85rem', color: '#6F7271' }}>
                    Mostrando controladores {((paginaControladores - 1) * limiteControladores) + 1} a {Math.min(paginaControladores * limiteControladores, totalControladores)} de {totalControladores}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      disabled={paginaControladores === 1}
                      onClick={() => setPaginaControladores(p => Math.max(1, p - 1))}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '0.4rem 0.8rem', border: '1px solid #CBD5E1',
                        borderRadius: '6px', backgroundColor: paginaControladores === 1 ? '#F1F5F9' : 'white',
                        cursor: paginaControladores === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <FaChevronLeft size={10} />
                    </button>
                    <button
                      disabled={paginaControladores * limiteControladores >= totalControladores}
                      onClick={() => setPaginaControladores(p => p + 1)}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '0.4rem 0.8rem', border: '1px solid #CBD5E1',
                        borderRadius: '6px', backgroundColor: paginaControladores * limiteControladores >= totalControladores ? '#F1F5F9' : 'white',
                        cursor: paginaControladores * limiteControladores >= totalControladores ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL - INGRESAR / EDITAR EXISTENCIAS                        */}
      {/* ============================================================ */}
      {modalStockAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 2000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%',
            maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            <button
              onClick={() => setModalStockAbierto(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', color: '#9B9B9A' }}
            >
              <FaTimes size={18} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#691B31', marginBottom: '1.5rem' }}>
              {editandoStockId ? 'Editar Refacción / Componente' : 'Ingresar Existencias de Refacción'}
            </h2>

            <form onSubmit={handleGuardarStock}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                  Nombre del componente/pieza
                </label>
                <input
                  type="text"
                  placeholder="Ej. cabezales, led verdes..."
                  value={stockForm.nombre}
                  onChange={(e) => setStockForm({ ...stockForm, nombre: e.target.value })}
                  disabled={modoAjusteDirecto}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: modoAjusteDirecto ? '#f1f5f9' : 'white', color: modoAjusteDirecto ? '#94a3b8' : 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                  Categoría
                </label>
                <select
                  value={stockForm.categoria}
                  onChange={(e) => setStockForm({ ...stockForm, categoria: e.target.value })}
                  disabled={modoAjusteDirecto}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: modoAjusteDirecto ? '#f1f5f9' : 'white', color: modoAjusteDirecto ? '#94a3b8' : 'inherit' }}
                >
                  <option value="componente">Componente</option>
                  <option value="accesorio">Accesorio</option>
                  <option value="periferico">Periférico</option>
                  <option value="equipo">Equipo</option>
                  <option value="herramienta">Herramienta</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                  Cantidad disponible
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockForm.cantidad}
                  onChange={(e) => setStockForm({ ...stockForm, cantidad: Math.max(0, Number(e.target.value)) })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalStockAbierto(false)}
                  style={{
                    padding: '0.6rem 1.2rem', border: '1px solid #CBD5E1', borderRadius: '8px',
                    backgroundColor: 'white', color: '#6F7271', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.2rem', border: 'none', borderRadius: '8px',
                    backgroundColor: '#691B31', color: 'white', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL - REGISTRAR / EDITAR CONTROLADOR                       */}
      {/* ============================================================ */}
      {modalControladorAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 2000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%',
            maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            <button
              onClick={() => setModalControladorAbierto(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', color: '#9B9B9A' }}
            >
              <FaTimes size={18} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#691B31', marginBottom: '1.5rem' }}>
              {editandoControladorId ? 'Actualizar Controlador Semafórico' : 'Registrar Nuevo Controlador Semafórico'}
            </h2>

            <form onSubmit={handleGuardarControlador}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                    Modelo *
                  </label>
                  <select
                    value={controladorForm.modelo}
                    onChange={(e) => setControladorForm({ ...controladorForm, modelo: e.target.value })}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#BC955B'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(188,149,91,0.15)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = controladorErrores.modelo ? '#A02142' : '#CBD5E1'; e.currentTarget.style.boxShadow = 'none' }}
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem',
                      border: `1px solid ${controladorErrores.modelo ? '#A02142' : '#CBD5E1'}`,
                      borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', color: '#1E293B',
                      backgroundColor: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box', cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Seleccionar Modelo --</option>
                    <option value="C-3000">C-3000</option>
                    <option value="C-5000">C-5000</option>
                  </select>
                  {controladorErrores.modelo && <span style={{ fontSize: '0.75rem', color: '#A02142' }}>{controladorErrores.modelo}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                    Crucero (Ubicación) *
                  </label>
                  <select
                    value={controladorForm.cruceroId}
                    onChange={(e) => setControladorForm({ ...controladorForm, cruceroId: e.target.value })}
                    style={{
                      width: '100%', padding: '0.6rem', border: `1px solid ${controladorErrores.cruceroId ? '#A02142' : '#CBD5E1'}`,
                      borderRadius: '8px', fontSize: '0.9rem'
                    }}
                  >
                    <option value="">-- Seleccionar Crucero --</option>
                    {listaCruceros.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  {controladorErrores.cruceroId && <span style={{ fontSize: '0.75rem', color: '#A02142' }}>{controladorErrores.cruceroId}</span>}
                </div>
              </div>

              {/* CONTADORES (LEDS Y CABEZALES) */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem 1rem', alignItems: 'end',
                marginBottom: '1.5rem', backgroundColor: '#fcfbf9', padding: '1rem',
                borderRadius: '8px', border: '1px solid #DDC9A3'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem', textAlign: 'center' }}>
                    Cabezales
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#0284c7', marginBottom: '0.15rem', textAlign: 'center' }}>
                        3 leds
                      </label>
                      <input
                        type="number" min="0"
                        value={controladorForm.semaforos3Luces}
                        onChange={(e) => setControladorForm({ ...controladorForm, semaforos3Luces: Math.max(0, Number(e.target.value)) })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#0284c7', marginBottom: '0.15rem', textAlign: 'center' }}>
                        4 leds
                      </label>
                      <input
                        type="number" min="0"
                        value={controladorForm.semaforos4Luces}
                        onChange={(e) => setControladorForm({ ...controladorForm, semaforos4Luces: Math.max(0, Number(e.target.value)) })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#16a34a', marginBottom: '0.25rem', textAlign: 'center' }}>
                    Leds Verdes
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalLedsVerdes}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalLedsVerdes: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.25rem', textAlign: 'center' }}>
                    Leds Rojos
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalLedsRojos}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalLedsRojos: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#d97706', marginBottom: '0.25rem', textAlign: 'center' }}>
                    Leds Amarillos
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalLedsAmarillos}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalLedsAmarillos: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#16a34a', marginBottom: '0.25rem', textAlign: 'center' }}>
                    Flecha Verde
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalFlechasVerdes}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalFlechasVerdes: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.25rem', textAlign: 'center' }}>
                    Flecha Roja
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalFlechasRojas}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalFlechasRojas: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* CHECKBOXES / SWITCHES DE CARACTERÍSTICAS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#691B31', margin: 0 }}>
                  Accesorios y Equipamiento Interno
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const keys = [
                      'pasoPeatonal', 'audible', 'pantallaLed', 'tarjetaRelevadora',
                      'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera', 'poste'
                    ];
                    const todosSeleccionados = keys.every(key => controladorForm[key]);
                    const nuevoEstado = !todosSeleccionados;
                    const updates = {};
                    keys.forEach(key => { updates[key] = nuevoEstado; });

                    if (!nuevoEstado) {
                      updates.cpuDetalle = '';
                      updates.gpsDetalle = '';
                      updates.tarjetaRelevadoraDetalle = '';
                      updates.modeloPoste = '';
                    }

                    setControladorForm({ ...controladorForm, ...updates });
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    backgroundColor: 'transparent', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem',
                    borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b',
                    cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  <FaCheckSquare size={16} />
                  {[
                    'pasoPeatonal', 'audible', 'pantallaLed', 'tarjetaRelevadora',
                    'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera', 'poste'
                  ].every(key => controladorForm[key]) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { key: 'pasoPeatonal', label: 'Paso Peatonal', icon: <FaWalking /> },
                  { key: 'audible', label: 'Audible', icon: <FaVolumeUp /> },
                  { key: 'pantallaLed', label: 'Pantalla LED', icon: <FaDesktop /> },
                  { key: 'tarjetaRelevadora', label: 'Tarjeta Relevadora', icon: <FaCreditCard /> },
                  { key: 'fuentePoder', label: 'Fuente de Poder', icon: <FaPowerOff /> },
                  { key: 'cpu', label: 'Módulo CPU', icon: <FaMicrochip /> },
                  { key: 'switch', label: 'Switch de Red', icon: <FaNetworkWired /> },
                  { key: 'fibraOptica', label: 'Fibra Óptica', icon: <FaProjectDiagram /> },
                  { key: 'gps', label: 'Módulo GPS', icon: <FaMapMarkerAlt /> },
                  { key: 'botonera', label: 'Botonera Peatonal', icon: <FaHandPointer /> },
                  { key: 'poste', label: 'Poste', icon: <FaSign /> }
                ].map((item) => (
                  <label key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                    border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer',
                    backgroundColor: controladorForm[item.key] ? '#f8fafc' : 'white',
                    transition: 'background-color 0.2s', fontSize: '0.85rem', color: '#475569'
                  }}>
                    <input
                      type="checkbox"
                      checked={!!controladorForm[item.key]}
                      onChange={(e) => {
                        const updates = { [item.key]: e.target.checked }
                        // Limpiar detalle si se desmarca
                        if (!e.target.checked) {
                          if (item.key === 'cpu') updates.cpuDetalle = ''
                          if (item.key === 'gps') updates.gpsDetalle = ''
                          if (item.key === 'tarjetaRelevadora') updates.tarjetaRelevadoraDetalle = ''
                          if (item.key === 'poste') updates.modeloPoste = ''
                        }
                        setControladorForm({ ...controladorForm, ...updates })
                      }}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#691B31' }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#691B31', fontSize: '1.1rem' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </label>
                ))}
                {/* BOTON DE PROGRAMACION EN EL ESPACIO VACIO */}
                <button
                  type="button"
                  onClick={() => setMostrarProgramacion(!mostrarProgramacion)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.75rem', border: '1px dashed #BC955B', borderRadius: '8px',
                    backgroundColor: mostrarProgramacion ? '#fdf8f6' : 'transparent',
                    color: '#BC955B', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fdf8f6' }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = mostrarProgramacion ? '#fdf8f6' : 'transparent' }}
                >
                  <FaCalendarAlt size={16} /> Programación
                </button>
              </div>

              {/* SUB-SELECCIÓN DE MODELO DE POSTE */}
              {controladorForm.poste && (
                <div style={{
                  backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px',
                  padding: '1rem', marginBottom: '1rem'
                }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#0369a1', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Modelo de Poste Semafórico
                  </label>
                  <select
                    value={controladorForm.modeloPoste}
                    onChange={(e) => {
                      const key = e.target.value
                      if (key && MODELOS_POSTE[key]) {
                        const preset = MODELOS_POSTE[key]
                        setControladorForm(prev => ({
                          ...prev,
                          modeloPoste: key,
                          semaforos3Luces: preset.semaforos3Luces,
                          semaforos4Luces: preset.semaforos4Luces,
                          totalLedsVerdes: preset.totalLedsVerdes,
                          totalFlechasVerdes: preset.totalFlechasVerdes,
                          totalLedsRojos: preset.totalLedsRojos,
                          totalFlechasRojas: preset.totalFlechasRojas,
                          totalLedsAmarillos: preset.totalLedsAmarillos
                        }))
                      } else {
                        setControladorForm(prev => ({ ...prev, modeloPoste: '' }))
                      }
                    }}
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #7dd3fc',
                      borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', color: '#0c4a6e',
                      backgroundColor: '#fff', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Seleccionar modelo de poste --</option>
                    {Object.entries(MODELOS_POSTE).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>

                  {controladorForm.modeloPoste && (
                    <div style={{
                      marginTop: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '6px',
                      padding: '0.6rem 0.9rem', fontSize: '0.8rem', color: '#075985',
                      display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem'
                    }}>
                      <span>✓ Se aplicaron valores del poste <strong>{controladorForm.modeloPoste}</strong> a los campos de LEDs y cabezales.</span>
                      <span style={{ color: '#9B9B9A', fontSize: '0.75rem' }}>Puede ajustarlos manualmente si es necesario.</span>
                    </div>
                  )}
                </div>
              )}

              {/* CAMPOS DE DETALLE CONDICIONALES: CPU, GPS, Tarjeta Relevadora */}
              {(controladorForm.cpu || controladorForm.gps || controladorForm.tarjetaRelevadora) && (
                <div style={{
                  backgroundColor: '#fdf6ec', border: '1px solid #DDC9A3', borderRadius: '8px',
                  padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#BC955B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Detalles de módulos seleccionados
                  </p>

                  {controladorForm.cpu && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                        Módulo CPU — Marca / Modelo / No. Serie
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Intel NUC, Serie A12345..."
                        value={controladorForm.cpuDetalle}
                        onChange={(e) => setControladorForm({ ...controladorForm, cpuDetalle: e.target.value })}
                        style={{
                          width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #BC955B',
                          borderRadius: '6px', fontSize: '0.9rem', outline: 'none',
                          boxShadow: '0 0 0 2px rgba(188,149,91,0.15)'
                        }}
                      />
                    </div>
                  )}

                  {controladorForm.gps && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                        Módulo GPS — Marca / Modelo / No. Serie
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Ublox NEO-M8N, Serie G98765..."
                        value={controladorForm.gpsDetalle}
                        onChange={(e) => setControladorForm({ ...controladorForm, gpsDetalle: e.target.value })}
                        style={{
                          width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #BC955B',
                          borderRadius: '6px', fontSize: '0.9rem', outline: 'none',
                          boxShadow: '0 0 0 2px rgba(188,149,91,0.15)'
                        }}
                      />
                    </div>
                  )}

                  {controladorForm.tarjetaRelevadora && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                        Tarjeta Relevadora — Marca / Modelo / No. Serie
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Siemens SIRIUS, Serie R00123..."
                        value={controladorForm.tarjetaRelevadoraDetalle}
                        onChange={(e) => setControladorForm({ ...controladorForm, tarjetaRelevadoraDetalle: e.target.value })}
                        style={{
                          width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #BC955B',
                          borderRadius: '6px', fontSize: '0.9rem', outline: 'none',
                          boxShadow: '0 0 0 2px rgba(188,149,91,0.15)'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {mostrarProgramacion && (
                <div style={{
                  backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px',
                  padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.2s ease-out'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCalendarAlt size={16} color="#BC955B" /> Horario Programado
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Sube el archivo con los horarios y configuración de tiempos del semáforo.
                  </p>
                  <label
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '1.5rem', border: '2px dashed #94a3b8', borderRadius: '8px',
                      backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#BC955B'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
                  >
                    <FaUpload size={24} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500', textAlign: 'center' }}>
                      {archivoProgramacion ? archivoProgramacion.name : 'Haz clic para seleccionar un archivo o arrástralo aquí'}
                    </span>
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setArchivoProgramacion(e.target.files[0])
                        }
                      }}
                    />
                  </label>
                  {archivoProgramacion && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setArchivoProgramacion(null)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Remover archivo
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setModalControladorAbierto(false)}
                  style={{
                    padding: '0.6rem 1.2rem', border: '1px solid #CBD5E1', borderRadius: '8px',
                    backgroundColor: 'white', color: '#6F7271', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.2rem', border: 'none', borderRadius: '8px',
                    backgroundColor: '#691B31', color: 'white', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  {editandoControladorId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalHistorialAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#691B31', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaHistory /> Historial de Asignación
                </h2>
                {componenteHistorialActual && (
                  <p style={{ margin: '0.25rem 0 0', color: '#6F7271', fontSize: '0.95rem' }}>
                    Componente: <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{componenteHistorialActual.nombre}</strong>
                  </p>
                )}
              </div>
              <button onClick={cerrarHistorial} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem' }}>
                <FaTimes size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Filtrar por Mes:</label>
                <input
                  type="month"
                  value={filtroMesHistorial}
                  onChange={(e) => setFiltroMesHistorial(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px',
                    fontSize: '0.9rem', color: '#334155', outline: 'none'
                  }}
                />
                {filtroMesHistorial && (
                  <button
                    onClick={() => setFiltroMesHistorial('')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {cargandoHistorial ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Cargando historial...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#334155', fontWeight: '700' }}>Fecha</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#334155', fontWeight: '700' }}>Reporte</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#334155', fontWeight: '700' }}>Estación / Crucero</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#334155', fontWeight: '700' }}>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialData
                      .filter(h => {
                        if (!filtroMesHistorial) return true;
                        const fecha = new Date(h.fecha);
                        const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                        return mesAnio === filtroMesHistorial;
                      })
                      .map((h, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569', whiteSpace: 'nowrap' }}>
                            {new Date(h.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#0284c7', fontWeight: '600' }}>{h.reporte?.folio || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                            <div><strong style={{ color: '#334155' }}>Estación:</strong> {h.reporte?.estacion || 'N/A'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Crucero: {h.reporte?.crucero || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: '#ef4444' }}>
                            -{h.cantidad}
                          </td>
                        </tr>
                      ))}
                    {historialData.filter(h => {
                      if (!filtroMesHistorial) return true;
                      const fecha = new Date(h.fecha);
                      const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                      return mesAnio === filtroMesHistorial;
                    }).length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            No hay registros de historial {filtroMesHistorial ? 'para el mes seleccionado' : ''}.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
