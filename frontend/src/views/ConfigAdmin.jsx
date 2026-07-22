import { useState, useEffect } from 'react'
import {
  FaUsersCog, FaBuilding, FaMapMarkerAlt, FaTags,
  FaEnvelope, FaPlus, FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff,
  FaIdBadge, FaBus, FaTrafficLight, FaExclamationTriangle, FaLink
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'

export default function ConfigAdmin() {
  const { user } = useAuth()

  // Control de Modal de Gestión
  const [modalAbierto, setModalAbierto] = useState(false)
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState(null) // 'usuarios', 'areas', 'sedes', 'categorias', 'correos'
  const [tituloModal, setTituloModal] = useState('')

  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalAbierto])

  // Datos y formulario
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  // Campos del formulario
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [correoDestino, setCorreoDestino] = useState('')

  // Estado para modal de asignaciones estación-crucero
  const [modalAsignaciones, setModalAsignaciones] = useState(false)
  const [estacionesConCruceros, setEstacionesConCruceros] = useState([])
  const [todosLosCruceros, setTodosLosCruceros] = useState([])
  const [estacionSeleccionada, setEstacionSeleccionada] = useState(null)
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(false)

  const opciones = [
    {
      tipo: 'usuarios',
      icono: <FaUsersCog size={28} />,
      titulo: 'Usuarios',
      descripcion: 'Administrar responsables técnicos del sistema.'
    },
    {
      tipo: 'correos',
      icono: <FaEnvelope size={28} />,
      titulo: 'Correos',
      descripcion: 'Gestionar correos de notificación automática.'
    },
    {
      tipo: 'areas',
      icono: <FaBuilding size={28} />,
      titulo: 'Áreas',
      descripcion: 'Registrar y configurar las áreas operativas.'
    },
      {
      tipo: 'cargos',
      icono: <FaIdBadge size={28} />,
      titulo: 'Cargos',
      descripcion: 'Administrar los cargos y puestos de las oficinas.'
    },
    {
      tipo: 'sedes',
      icono: <FaMapMarkerAlt size={28} />,
      titulo: 'Sedes',
      descripcion: 'Configurar ubicaciones físicas y edificios.'
    },
    {
      tipo: 'categorias',
      icono: <FaTags size={28} />,
      titulo: 'Categorías',
      descripcion: 'Modificar categorías de incidencias y fallas.'
    },
  
    {
      tipo: 'estaciones',
      icono: <FaBus size={28} />,
      titulo: 'Estaciones de Tuzobus',
      descripcion: 'Gestionar las estaciones del sistema Tuzobus.'
    },
    {
      tipo: 'cruceros',
      icono: <FaTrafficLight size={28} />,
      titulo: 'Cruces Semaforizados',
      descripcion: 'Configurar los cruceros semaforicos del sistema.'
    },
    {
      tipo: 'tipos-falla',
      icono: <FaExclamationTriangle size={28} />,
      titulo: 'Tipos de Falla',
      descripcion: 'Administrar los tipos de falla de semáforos.'
    },
    {
      tipo: 'asignar-cruceros',
      icono: <FaLink size={28} />,
      titulo: 'Asignar Cruceros',
      descripcion: 'Vincular cruceros semafóricos a estaciones de Tuzobus.'
    }
  ]

  // Cargar elementos del catálogo seleccionado
  const cargarItems = async (tipo) => {
    if (!user?.token) return
    setCargando(true)
    try {
      let url = ''
      if (tipo === 'usuarios') url = `${API_BASE_URL}/api/admin/usuarios`
      else if (tipo === 'correos') url = `${API_BASE_URL}/api/admin/correos`
      else url = `${API_BASE_URL}/api/admin/catalogos/${tipo}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        setItems(json.data || [])
      } else {
        console.error('Error al cargar catálogo:', json.error)
      }
    } catch (err) {
      console.error('Error de red al cargar catálogo:', err)
    } finally {
      setCargando(false)
    }
  }

  const abrirGestor = (opcion) => {
    if (opcion.deshabilitado) {
      alert('Esta función estará disponible en la próxima actualización.')
      return
    }
    if (opcion.tipo === 'asignar-cruceros') {
      abrirModalAsignaciones()
      return
    }
    setCatalogoSeleccionado(opcion.tipo)
    setTituloModal(opcion.titulo)
    setModalAbierto(true)
    setEditandoId(null)
    limpiarFormulario()
    cargarItems(opcion.tipo)
  }

  // ── Funciones para modal de asignaciones ──
  const abrirModalAsignaciones = async () => {
    setModalAsignaciones(true)
    setCargandoAsignaciones(true)
    try {
      const [resEstaciones, resCruceros] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/estaciones-cruceros`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/catalogos/cruceros`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ])
      const jsonEstaciones = await resEstaciones.json()
      const jsonCruceros = await resCruceros.json()
      if (jsonEstaciones.ok) setEstacionesConCruceros(jsonEstaciones.data || [])
      if (jsonCruceros.ok) setTodosLosCruceros(jsonCruceros.data || [])
    } catch (err) {
      console.error('Error al cargar asignaciones:', err)
    } finally {
      setCargandoAsignaciones(false)
    }
  }

  const cruceroEstaAsignado = (cruceroId) => {
    if (!estacionSeleccionada) return false
    const estacion = estacionesConCruceros.find(e => e.id === estacionSeleccionada)
    if (!estacion || !estacion.cruceros) return false
    return estacion.cruceros.some(ec => ec.cruceroId === cruceroId)
  }

  const toggleAsignacion = async (cruceroId) => {
    if (!estacionSeleccionada || !user?.token) return
    try {
      if (cruceroEstaAsignado(cruceroId)) {
        await fetch(`${API_BASE_URL}/api/admin/estaciones/${estacionSeleccionada}/cruceros/${cruceroId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      } else {
        await fetch(`${API_BASE_URL}/api/admin/estaciones/${estacionSeleccionada}/cruceros`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ cruceroId })
        })
      }
      // Recargar datos
      const res = await fetch(`${API_BASE_URL}/api/admin/estaciones-cruceros`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await res.json()
      if (json.ok) setEstacionesConCruceros(json.data || [])
    } catch (err) {
      console.error('Error al cambiar asignación:', err)
      alert('❌ Error al cambiar asignación')
    }
  }

  const contarCrucerosAsignados = (estacionId) => {
    const estacion = estacionesConCruceros.find(e => e.id === estacionId)
    return estacion?.cruceros?.length || 0
  }

  const limpiarFormulario = () => {
    setNombre('')
    setUsername('')
    setEmail('')
    setPassword('')
    setCorreoDestino('')
    setEditandoId(null)
  }

  // Guardar (Crear o Actualizar)
  const guardarItem = async (e) => {
    e.preventDefault()
    if (!user?.token) return

    let url = ''
    let metodo = editandoId ? 'PUT' : 'POST'
    let payload = {}

    // Validación y construcción de payload
    if (catalogoSeleccionado === 'usuarios') {
      if (!username || !email || !nombre || (!editandoId && !password)) {
        alert('Complete todos los campos obligatorios')
        return
      }
      payload = { username, email, nombre }
      if (password) payload.password = password

      url = editandoId
        ? `${API_BASE_URL}/api/admin/usuarios/${editandoId}`
        : `${API_BASE_URL}/api/admin/usuarios`
    } else if (catalogoSeleccionado === 'correos') {
      if (!nombre || !correoDestino) {
        alert('Complete todos los campos')
        return
      }
      payload = { nombre, correo: correoDestino }
      url = editandoId
        ? `${API_BASE_URL}/api/admin/correos/${editandoId}`
        : `${API_BASE_URL}/api/admin/correos`
    } else {
      if (!nombre) {
        alert('El nombre es requerido')
        return
      }
      payload = { nombre }
      url = editandoId
        ? `${API_BASE_URL}/api/admin/catalogos/${catalogoSeleccionado}/${editandoId}`
        : `${API_BASE_URL}/api/admin/catalogos/${catalogoSeleccionado}`
    }

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        alert(editandoId ? '✅ Modificado con éxito' : '✅ Creado con éxito')
        limpiarFormulario()
        cargarItems(catalogoSeleccionado)
      } else {
        alert('❌ Error: ' + (json.error || 'Operación fallida'))
      }
    } catch (err) {
      console.error('Error al guardar:', err)
      alert('❌ Error de conexión al guardar')
    }
  }

  // Cargar para editar
  const prepararEdicion = (item) => {
    setEditandoId(item.id)
    if (catalogoSeleccionado === 'usuarios') {
      setUsername(item.username || '')
      setEmail(item.email || '')
      setNombre(item.nombre || '')
      setPassword('')
    } else if (catalogoSeleccionado === 'correos') {
      setNombre(item.nombre || '')
      setCorreoDestino(item.correo || '')
    } else {
      setNombre(item.nombre || '')
    }
  }

  // Eliminar o Dar de Baja
  const eliminarItem = async (id) => {
    if (!user?.token) return
    const mensaje = catalogoSeleccionado === 'usuarios'
      ? '¿Eliminar este usuario de forma permanente?'
      : '¿Dar de baja este registro? (Se marcará como inactivo)'

    if (confirm(mensaje)) {
      try {
        let url = ''
        let metodo = 'DELETE'

        if (catalogoSeleccionado === 'usuarios') url = `${API_BASE_URL}/api/admin/usuarios/${id}`
        else if (catalogoSeleccionado === 'correos') url = `${API_BASE_URL}/api/admin/correos/${id}`
        else url = `${API_BASE_URL}/api/admin/catalogos/${catalogoSeleccionado}/${id}`

        const response = await fetch(url, {
          method: metodo,
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const json = await response.json()
        if (response.ok && json.ok) {
          alert('✅ Operación exitosa')
          cargarItems(catalogoSeleccionado)
        } else {
          alert('❌ Error: ' + (json.error || 'No se pudo realizar la acción'))
        }
      } catch (err) {
        console.error('Error al dar de baja:', err)
        alert('❌ Error de red al eliminar item')
      }
    }
  }

  // Reactivar Item
  const reactivarItem = async (id) => {
    if (!user?.token) return
    try {
      let url = catalogoSeleccionado === 'correos'
        ? `${API_BASE_URL}/api/admin/correos/${id}`
        : `${API_BASE_URL}/api/admin/catalogos/${catalogoSeleccionado}/${id}`

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ activo: true })
      })
      const json = await response.json()
      if (response.ok && json.ok) {
        alert('✅ Registro reactivado con éxito')
        cargarItems(catalogoSeleccionado)
      } else {
        alert('❌ Error: ' + (json.error || 'No se pudo reactivar'))
      }
    } catch (err) {
      console.error('Error al reactivar:', err)
      alert('❌ Error de conexión al reactivar')
    }
  }

  return (
    <div className="main-content-padding" style={{
      backgroundColor: '#F8FAFC',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* TÍTULO */}
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          color: '#000000',
          marginBottom: '0.5rem'
        }}>
          Configuraciones del Sistema
        </h1>
        <p style={{ color: '#6F7271', marginBottom: '3rem' }}>Gestiona los catálogos primarios de la base de datos, usuarios administradores y notificaciones automáticas.</p>

        {/* ✅ CUADRADITOS BONITOS EN GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.8rem',
          maxWidth: '100%'
        }}>
        {opciones.map((item, i) => (
          <div
            key={i}
            onClick={() => abrirGestor(item)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
              textAlign: 'center',
              border: '2px solid transparent',
              transition: 'all 0.3s ease',
              cursor: item.deshabilitado ? 'not-allowed' : 'pointer',
              opacity: item.deshabilitado ? 0.65 : 1
            }}
            onMouseOver={(e) => {
              if (!item.deshabilitado) {
                e.currentTarget.style.borderColor = '#BC955B'
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(185, 138, 70, 0.2)'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)'
            }}
          >
            {/* ✅ ICONO EN COLOR GUINDA */}
            <div style={{
              color: '#691B31',
              marginBottom: '1rem'
            }}>
              {item.icono}
            </div>

            {/* TÍTULO */}
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#000000',
              margin: '0 0 0.5rem 0'
            }}>
              {item.titulo}
            </h3>

            {/* DESCRIPCIÓN */}
            <p style={{
              fontSize: '0.8rem',
              color: '#6F7271',
              lineHeight: '1.4',
              margin: '0 0 1.2rem 0',
              minHeight: '40px'
            }}>
              {item.descripcion}
            </p>

            {/* ✅ BOTÓN DORADO */}
            <button style={{
              padding: '0.5rem 1.2rem',
              backgroundColor: item.deshabilitado ? '#94a3b8' : '#BC955B',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: item.deshabilitado ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            >
              {item.deshabilitado ? 'Próximamente' : 'Gestionar'}
            </button>
          </div>
        ))}
      </div>

      {/* ✅ MODAL GESTOR CRUD */}
      {modalAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2000, padding: '1rem'
        }}>
          <div className="card-padding" style={{
            backgroundColor: 'white', borderRadius: '12px',
            width: '90%', maxWidth: '900px', maxHeight: '90vh', display: 'flex',
            flexDirection: 'column', boxShadow: '0 5px 25px rgba(0,0,0,0.2)'
          }}>

            {/* Encabezado */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #6F7271', paddingBottom: '1rem', marginBottom: '1.5rem'
            }}>
              <h2 style={{ color: '#691B31', fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>
                Gestión de {tituloModal}
              </h2>
              <button
                onClick={() => { setModalAbierto(false); setCatalogoSeleccionado(null) }}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '1.3rem', cursor: 'pointer', color: '#6F7271' }}
              >
                ✕
              </button>
            </div>

            {/* Contenido en dos columnas: Izquierda Formulario, Derecha Tabla */}
            <div className="form-responsive-grid grid-2" style={{
              flex: 1, overflowY: 'auto'
            }}>

              {/* COLUMNA IZQUIERDA: FORMULARIO */}
              <div>
                <h3 style={{ fontSize: '1rem', color: '#000000', marginBottom: '1rem', fontWeight: '600' }}>
                  {editandoId ? 'Modificar Registro' : 'Agregar Nuevo'}
                </h3>

                <form onSubmit={guardarItem}>

                  {/* Campos dinámicos según el tipo de catálogo */}
                  {catalogoSeleccionado === 'usuarios' && (
                    <>
                      <div style={{ marginBottom: '0.8rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>Nombre Completo</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #9B9B9A', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.2rem' }} required />
                      </div>
                      <div style={{ marginBottom: '0.8rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>Usuario (Login)</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #9B9B9A', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.2rem' }} required />
                      </div>
                      <div style={{ marginBottom: '0.8rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #9B9B9A', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.2rem' }} required />
                      </div>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>Contraseña {editandoId && <small style={{ color: '#6F7271' }}>(dejar vacío para no cambiar)</small>}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid #9B9B9A', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.2rem' }} required={!editandoId} />
                      </div>
                    </>
                  )}

                  {catalogoSeleccionado === 'correos' && (
                    <>
                      <div style={{ marginBottom: '0.8rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>Nombre Responsable</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Admin Sistemas" style={{ width: '100%', padding: '0.55rem', border: '1px solid #9B9B9A', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.2rem' }} required />
                      </div>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>Correo de Notificaciones</label>
                        <input type="email" value={correoDestino} onChange={(e) => setCorreoDestino(e.target.value)} placeholder="ejemplo@sitmah.gob.mx" style={{ width: '100%', padding: '0.55rem', border: '1px solid #9B9B9A', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.2rem' }} required />
                      </div>
                    </>
                  )}

                  {catalogoSeleccionado !== 'usuarios' && catalogoSeleccionado !== 'correos' && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>Nombre</label>
                      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={`Ingrese nombre del ${catalogoSeleccionado}`} style={{ width: '100%', padding: '0.55rem', border: '1px solid #9B9B9A', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.2rem' }} required />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button type="submit" style={{ flex: 1, padding: '0.6rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                      {editandoId ? 'Guardar Cambios' : 'Registrar'}
                    </button>
                    {editandoId && (
                      <button type="button" onClick={limpiarFormulario} style={{ padding: '0.6rem 1rem', backgroundColor: '#6F7271', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    )}
                  </div>

                </form>
              </div>

              {/* COLUMNA DERECHA: TABLA LISTADO */}
              <div>
                <h3 style={{ fontSize: '1rem', color: '#000000', marginBottom: '1rem', fontWeight: '600' }}>
                  Registros Activos
                </h3>

                {cargando ? (
                  <p style={{ color: '#6F7271', fontSize: '0.9rem', textAlign: 'center', paddingTop: '2rem' }}>Cargando catálogo...</p>
                ) : items.length === 0 ? (
                  <p style={{ color: '#6F7271', fontSize: '0.9rem', textAlign: 'center', paddingTop: '2rem' }}>No hay registros activos en la base de datos.</p>
                ) : (
                  <div className="overflow-x-auto" style={{ overflowY: 'auto', maxHeight: '360px', border: '1px solid #6F7271', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #6F7271', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>ID</th>
                          {catalogoSeleccionado === 'usuarios' ? (
                            <>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Usuario</th>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Nombre</th>
                            </>
                          ) : catalogoSeleccionado === 'correos' ? (
                            <>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Nombre</th>
                              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Correo</th>
                            </>
                          ) : (
                            <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Nombre</th>
                          )}
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Estado</th>
                          <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem 0.8rem', color: '#6F7271' }}>{item.id}</td>

                            {catalogoSeleccionado === 'usuarios' && (
                              <>
                                <td style={{ padding: '0.6rem 0.8rem', fontWeight: '500' }}>{item.username}</td>
                                <td style={{ padding: '0.6rem 0.8rem' }}>{item.nombre}</td>
                              </>
                            )}

                            {catalogoSeleccionado === 'correos' && (
                              <>
                                <td style={{ padding: '0.6rem 0.8rem', fontWeight: '500' }}>{item.nombre}</td>
                                <td style={{ padding: '0.6rem 0.8rem' }}>{item.correo}</td>
                              </>
                            )}

                            {catalogoSeleccionado !== 'usuarios' && catalogoSeleccionado !== 'correos' && (
                              <td style={{ padding: '0.6rem 0.8rem', fontWeight: '500' }}>{item.nombre}</td>
                            )}

                            <td style={{ padding: '0.6rem 0.8rem' }}>
                              <span style={{
                                padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                                backgroundColor: item.activo !== false ? '#dcfce7' : '#fee2e2',
                                color: item.activo !== false ? '#15803d' : '#b91c1c'
                              }}>
                                {item.activo !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>

                            <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => prepararEdicion(item)}
                                  title="Editar"
                                  style={{ border: 'none', background: 'transparent', color: '#BC955B', cursor: 'pointer', fontSize: '14px' }}
                                >
                                  <FaEdit />
                                </button>
                                {item.activo !== false ? (
                                  <button
                                    onClick={() => eliminarItem(item.id)}
                                    title="Dar de baja / Eliminar"
                                    style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                                  >
                                    <FaTrashAlt />
                                  </button>
                                ) : (
                                  catalogoSeleccionado !== 'usuarios' && (
                                    <button
                                      onClick={() => reactivarItem(item.id)}
                                      title="Reactivar registro"
                                      style={{ border: 'none', background: 'transparent', color: '#22c55e', cursor: 'pointer', fontSize: '14px' }}
                                    >
                                      <FaToggleOff />
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ✅ MODAL DE ASIGNACIONES ESTACIÓN ↔ CRUCERO */}
      {modalAsignaciones && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2000, padding: '1rem'
        }}>
          <div className="card-padding" style={{
            backgroundColor: 'white', borderRadius: '12px',
            width: '90%', maxWidth: '900px', maxHeight: '90vh', display: 'flex',
            flexDirection: 'column', boxShadow: '0 5px 25px rgba(0,0,0,0.2)'
          }}>

            {/* Encabezado */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #6F7271', paddingBottom: '1rem', marginBottom: '1.5rem'
            }}>
              <h2 style={{ color: '#691B31', fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>
                Asignar Cruceros a Estaciones
              </h2>
              <button
                onClick={() => { setModalAsignaciones(false); setEstacionSeleccionada(null) }}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '1.3rem', cursor: 'pointer', color: '#6F7271' }}
              >
                ✕
              </button>
            </div>

            {cargandoAsignaciones ? (
              <p style={{ color: '#6F7271', fontSize: '0.9rem', textAlign: 'center', paddingTop: '2rem' }}>Cargando datos...</p>
            ) : (
              <div className="form-responsive-grid grid-2" style={{ flex: 1, overflowY: 'auto' }}>

                {/* COLUMNA IZQUIERDA: Lista de estaciones */}
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#000000', marginBottom: '1rem', fontWeight: '600' }}>
                    Seleccione una Estación
                  </h3>
                  <div style={{ overflowY: 'auto', maxHeight: '400px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    {estacionesConCruceros.map((est) => (
                      <div
                        key={est.id}
                        onClick={() => setEstacionSeleccionada(est.id)}
                        style={{
                          padding: '0.7rem 1rem',
                          cursor: 'pointer',
                          backgroundColor: estacionSeleccionada === est.id ? '#f0e6d6' : 'white',
                          borderBottom: '1px solid #f1f5f9',
                          borderLeft: estacionSeleccionada === est.id ? '3px solid #BC955B' : '3px solid transparent',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: estacionSeleccionada === est.id ? '600' : '400' }}>
                          {est.nombre}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          backgroundColor: contarCrucerosAsignados(est.id) > 0 ? '#dcfce7' : '#f1f5f9',
                          color: contarCrucerosAsignados(est.id) > 0 ? '#15803d' : '#6F7271',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}>
                          {contarCrucerosAsignados(est.id)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA DERECHA: Cruceros con checkboxes */}
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#000000', marginBottom: '1rem', fontWeight: '600' }}>
                    {estacionSeleccionada
                      ? `Cruceros de: ${estacionesConCruceros.find(e => e.id === estacionSeleccionada)?.nombre || ''}`
                      : 'Seleccione una estación'}
                  </h3>
                  {estacionSeleccionada ? (
                    <div style={{ overflowY: 'auto', maxHeight: '400px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      {todosLosCruceros.filter(c => c.activo !== false).map((crucero) => {
                        const asignado = cruceroEstaAsignado(crucero.id)
                        return (
                          <label
                            key={crucero.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.6rem 1rem',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              backgroundColor: asignado ? '#f0fdf4' : 'white',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={asignado}
                              onChange={() => toggleAsignacion(crucero.id)}
                              style={{ accentColor: '#BC955B', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: asignado ? '500' : '400',
                              color: asignado ? '#15803d' : '#374151'
                            }}>
                              {crucero.nombre}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#6F7271', fontSize: '0.85rem', textAlign: 'center', paddingTop: '3rem' }}>
                      ← Seleccione una estación de la lista para ver y asignar sus cruceros.
                    </p>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      </div>
    </div>
  )
}