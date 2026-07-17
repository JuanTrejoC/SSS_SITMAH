import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import {
  FaRoad, FaPlus, FaEdit, FaTrashAlt, FaBoxes,
  FaChevronLeft, FaChevronRight, FaTimes
} from 'react-icons/fa'

// ==================================================
// CONFIGURACIONES PREDEFINIDAS POR MODELO DE POSTE
// Ajusta los valores segun los postes de tu municipio
// ==================================================
const MODELOS_POSTE = {
  'PS-3C': {
    label: 'PS-3C — Poste Simple 3 Caras',
    totalCabezales: 3,
    totalLedsVerdes: 48,
    totalFlechasVerdes: 0,
    totalLedsRojos: 48,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 16
  },
  'PS-4C': {
    label: 'PS-4C — Poste Simple 4 Caras',
    totalCabezales: 4,
    totalLedsVerdes: 64,
    totalFlechasVerdes: 0,
    totalLedsRojos: 64,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 24
  },
  'PD-3C': {
    label: 'PD-3C — Poste Doble 3 Caras',
    totalCabezales: 3,
    totalLedsVerdes: 96,
    totalFlechasVerdes: 16,
    totalLedsRojos: 96,
    totalFlechasRojas: 16,
    totalLedsAmarillos: 32
  },
  'PD-4C': {
    label: 'PD-4C — Poste Doble 4 Caras',
    totalCabezales: 4,
    totalLedsVerdes: 128,
    totalFlechasVerdes: 24,
    totalLedsRojos: 128,
    totalFlechasRojas: 24,
    totalLedsAmarillos: 48
  }
}

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
    cantidad: 1
  })

  // ==========================================
  // ESTADOS - CONTROLADORES INSTALADOS
  // ==========================================
  const [controladores, setControladores] = useState([])
  const [cargandoControladores, setCargandoControladores] = useState(false)
  const [totalControladores, setTotalControladores] = useState(0)
  const [paginaControladores, setPaginaControladores] = useState(1)
  const [limiteControladores] = useState(10)
  const [modalControladorAbierto, setModalControladorAbierto] = useState(false)
  const [editandoControladorId, setEditandoControladorId] = useState(null)

  const [controladorForm, setControladorForm] = useState({
    modelo: '',
    cruceroId: '',
    totalCabezales: 0,
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
  useEffect(() => {
    cargarCatalogos()
  }, [])

  useEffect(() => {
    if (tabActiva === 'existencias') {
      cargarExistencias()
    } else {
      cargarControladores()
    }
  }, [tabActiva, paginaControladores])

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

  const cargarExistencias = async () => {
    if (!user?.token) return
    setCargandoExistencias(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/existencias`, {
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
        }
      }
    } catch (err) {
      console.error('Error al cargar controladores:', err)
    } finally {
      setCargandoControladores(false)
    }
  }

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
      cantidad: item.cantidad
    })
    setModalStockAbierto(true)
  }

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
    setStockForm({ nombre: '', categoria: 'componente', cantidad: 1 })
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
      totalCabezales: item.totalCabezales,
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
      totalCabezales: 0,
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
                      backgroundColor: 'white', border: '1px solid #DDC9A3', borderRadius: '12px', padding: '1.25rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column',
                      justifyContent: 'space-between', transition: 'all 0.25s', position: 'relative', overflow: 'hidden'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.06)' }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#BC955B' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6F7271', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {item.categoria}
                        </span>
                        <h3 style={{ fontSize: '1.15rem', margin: '0.4rem 0 0.75rem', fontWeight: '700', textTransform: 'capitalize' }}>
                          <span style={{ backgroundColor: '#BC955B', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '6px', display: 'inline-block', boxShadow: '0 2px 4px rgba(188,149,91,0.2)' }}>
                            {item.nombre}
                          </span>
                        </h3>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleEditarStock(item)}
                          title="Editar refacción"
                          style={{ backgroundColor: 'transparent', color: '#BC955B', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleEliminarStock(item.id)}
                          title="Eliminar refacción"
                          style={{ backgroundColor: 'transparent', color: '#A02142', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#9B9B9A', display: 'block' }}>Cantidad en existencia</span>
                        <strong style={{ fontSize: '1.5rem', color: item.cantidad > 0 ? '#691B31' : '#A02142' }}>
                          {item.cantidad} uds
                        </strong>
                      </div>

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
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>{item.totalCabezales}</td>
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
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem 1rem',
                marginBottom: '1.5rem', backgroundColor: '#fcfbf9', padding: '1rem',
                borderRadius: '8px', border: '1px solid #DDC9A3'
              }}>
                {/* Fila 1: Cabezales | Leds Verdes | Leds Rojos */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                    Cabezales
                  </label>
                  <select
                    value={controladorForm.totalCabezales}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalCabezales: Number(e.target.value) })}
                    style={{
                      width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1',
                      borderRadius: '6px', fontSize: '0.9rem', backgroundColor: '#fff',
                      cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value={0}>-- Seleccionar --</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#16a34a', marginBottom: '0.25rem' }}>
                    Leds Verdes
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalLedsVerdes}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalLedsVerdes: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.25rem' }}>
                    Leds Rojos
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalLedsRojos}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalLedsRojos: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Fila 2: Leds Amarillos | Flecha Verde | Flecha Roja */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#d97706', marginBottom: '0.25rem' }}>
                    Leds Amarillos
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalLedsAmarillos}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalLedsAmarillos: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#16a34a', marginBottom: '0.25rem' }}>
                    Flecha Verde
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalFlechasVerdes}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalFlechasVerdes: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.25rem' }}>
                    Flecha Roja
                  </label>
                  <input
                    type="number" min="0"
                    value={controladorForm.totalFlechasRojas}
                    onChange={(e) => setControladorForm({ ...controladorForm, totalFlechasRojas: Math.max(0, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
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
                    backgroundColor: '#f8fafc', border: '1px solid #CBD5E1', padding: '0.3rem 0.6rem',
                    borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#64748b',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#334155' }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b' }}
                >
                  {[
                      'pasoPeatonal', 'audible', 'pantallaLed', 'tarjetaRelevadora',
                      'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera', 'poste'
                  ].every(key => controladorForm[key]) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { key: 'pasoPeatonal', label: 'Paso Peatonal' },
                  { key: 'audible', label: 'Audible' },
                  { key: 'pantallaLed', label: 'Pantalla LED' },
                  { key: 'tarjetaRelevadora', label: 'Tarjeta Relevadora' },
                  { key: 'fuentePoder', label: 'Fuente de Poder' },
                  { key: 'cpu', label: 'Módulo CPU' },
                  { key: 'switch', label: 'Switch de Red' },
                  { key: 'fibraOptica', label: 'Fibra Óptica' },
                  { key: 'gps', label: 'Módulo GPS' },
                  { key: 'botonera', label: 'Botonera Peatonal' },
                  { key: 'poste', label: 'Poste' }
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem',
                      color: controladorForm[item.key] ? '#691B31' : '#6F7271',
                      cursor: 'pointer', padding: '0.4rem', borderRadius: '6px',
                      backgroundColor: controladorForm[item.key] ? '#fdf6ec' : '#f8fafc',
                      border: `1px solid ${controladorForm[item.key] ? '#BC955B' : '#E2E8F0'}`,
                      fontWeight: controladorForm[item.key] ? '700' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={controladorForm[item.key]}
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
                      style={{ cursor: 'pointer', accentColor: '#691B31' }}
                    />
                    {item.label}
                  </label>
                ))}
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
                          totalCabezales: preset.totalCabezales,
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
    </main>
  )
}
