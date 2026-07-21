// src/views/FormOficinas.jsx
import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'
import { FaBuilding } from 'react-icons/fa'

export default function FormOficinas({ usuarioActual }) {
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    solicitante: '',
    area_id: '',
    cargo: '',
    email: '',
    telefono: '',
    sede_id: '',
    equipo: '',
    categoria_id: '',
    descripcion_otro: '',
    prioridad: '',
    descripcion: '',
    evidencia: null,
    estado: 'Pendiente',       // ✅ ESTADO POR DEFECTO
    tipo_usuario: 'solicitante'// ✅ PARA QUE EL ADMIN LO VEA
  })

  const [errores, setErrores] = useState({})
  const [valido, setValido] = useState({})
  const [mostrarOtro, setMostrarOtro] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState(null)

  const [listaAreas, setListaAreas] = useState([])
  const [listaCargos, setListaCargos] = useState([])
  const [listaSedes, setListaSedes] = useState([])
  const [listaCategorias, setListaCategorias] = useState([])

  // Cargar catálogos desde el backend al montar el componente
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const resAreas = await fetch(`${API_BASE_URL}/api/catalogos/areas`)
        if (resAreas.ok) {
          const json = await resAreas.json()
          if (json.ok && json.data && json.data.length > 0) setListaAreas(json.data)
        }
        const resSedes = await fetch(`${API_BASE_URL}/api/catalogos/sedes`)
        if (resSedes.ok) {
          const json = await resSedes.json()
          if (json.ok && json.data && json.data.length > 0) setListaSedes(json.data)
        }
        const resCategorias = await fetch(`${API_BASE_URL}/api/catalogos/categorias`)
        if (resCategorias.ok) {
          const json = await resCategorias.json()
          if (json.ok && json.data && json.data.length > 0) setListaCategorias(json.data)
        }
        const resCargos = await fetch(`${API_BASE_URL}/api/catalogos/cargos`)
        if (resCargos.ok) {
          const json = await resCargos.json()
          if (json.ok && json.data && json.data.length > 0) setListaCargos(json.data)
        }
      } catch (err) {
        console.error('Error al cargar catálogos:', err)
      }
    }
    cargarCatalogos()
  }, [])

  // ✅ Solo letras, espacios, acentos. Mínimo 3 caracteres, máximo 100
  const soloLetras = (texto) => {
    return texto.replace(/[^A-Za-zÁáÉéÍíÓóÚúÑñ\s]/g, '').substring(0, 100)
  }

  const validarCampo = (nombre, valor) => {
    let mensajeError = ''
    let esValido = false
    valor = valor?.trim() || ''

    switch (nombre) {
      case 'solicitante':
        if (!valor) mensajeError = 'Campo obligatorio'
        else if (valor.length < 3) mensajeError = 'Mínimo 3 caracteres'
        else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]{3,100}$/.test(valor)) mensajeError = 'Solo letras y espacios'
        else esValido = true
        break

      case 'area_id':
      case 'cargo':
      case 'sede_id':
      case 'equipo':
      case 'categoria_id':
      case 'prioridad':
        if (!valor) mensajeError = 'Campo obligatorio'
        else esValido = true
        break

      case 'email':
        const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!valor) mensajeError = 'Campo obligatorio'
        else if (!regexCorreo.test(valor)) mensajeError = 'Correo inválido (ej: nombre@dominio.com)'
        else esValido = true
        break

      case 'telefono':
        const soloNumeros = valor.replace(/[^0-9]/g, '')
        if (valor !== soloNumeros) {
          setFormData(prev => ({ ...prev, telefono: soloNumeros }))
        }
        if (!soloNumeros) mensajeError = 'Campo obligatorio'
        else if (soloNumeros.length !== 10) mensajeError = 'Debe tener 10 dígitos'
        else esValido = true
        break

      case 'descripcion_otro':
        if (mostrarOtro && !valor) mensajeError = 'Especifique la categoría'
        else esValido = true
        break

      default:
        esValido = true
        break
    }

    setErrores(prev => ({ ...prev, [nombre]: mensajeError }))
    setValido(prev => ({ ...prev, [nombre]: esValido }))
  }

  const comprimirImagen = (archivo) => {
    return new Promise((resolve) => {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(archivo.type)) {
        return resolve(archivo)
      }

      const reader = new FileReader()
      reader.readAsDataURL(archivo)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const MAX_ANCHO_ALTO = 1600
          if (width > MAX_ANCHO_ALTO || height > MAX_ANCHO_ALTO) {
            if (width > height) {
              height = Math.round((height * MAX_ANCHO_ALTO) / width)
              width = MAX_ANCHO_ALTO
            } else {
              width = Math.round((width * MAX_ANCHO_ALTO) / height)
              height = MAX_ANCHO_ALTO
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (!blob) {
              return resolve(archivo)
            }
            const nombreOriginal = archivo.name
            const extension = '.jpg'
            const baseNombre = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.')) || nombreOriginal
            const nuevoArchivo = new File([blob], `${baseNombre}${extension}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(nuevoArchivo)
          }, 'image/jpeg', 0.75)
        }
        img.onerror = () => resolve(archivo)
      }
      reader.onerror = () => resolve(archivo)
    })
  }

  const manejarArchivo = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!tiposPermitidos.includes(archivo.type)) {
      alert('❌ Solo se permiten archivos de imagen (.jpg, .jpeg, .png, .gif, .webp)')
      e.target.value = ''
      setFormData(prev => ({ ...prev, evidencia: null }))
      setVistaPrevia(null)
      return
    }

    if (archivo.size > 10 * 1024 * 1024) {
      alert('❌ La imagen no debe superar los 10 MB')
      e.target.value = ''
      setFormData(prev => ({ ...prev, evidencia: null }))
      setVistaPrevia(null)
      return
    }

    try {
      const archivoComprimido = await comprimirImagen(archivo)
      setFormData(prev => ({ ...prev, evidencia: archivoComprimido }))
      setVistaPrevia(URL.createObjectURL(archivoComprimido))
    } catch (err) {
      console.error('Error al comprimir la imagen:', err)
      setFormData(prev => ({ ...prev, evidencia: archivo }))
      setVistaPrevia(URL.createObjectURL(archivo))
    }
  }

  const eliminarEvidencia = () => {
    setFormData(prev => ({ ...prev, evidencia: null }))
    if (vistaPrevia) {
      URL.revokeObjectURL(vistaPrevia)
      setVistaPrevia(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const enviar = async (e) => {
    e.preventDefault()

    const confirmar = await Swal.fire({
      title: '¿Enviar reporte?',
      text: 'Puede cancelar si desea revisar o editar algo antes de enviarlo.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#BC955B',
      cancelButtonColor: '#9B9B9A',
      confirmButtonText: 'Sí, enviar reporte',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmar.isConfirmed) return

    Object.keys(formData).forEach(campo => {
      if (campo !== 'evidencia' && campo !== 'descripcion') {
        validarCampo(campo, formData[campo])
      }
    })

    const hayErrores = Object.values(valido).some(est => est === false)
    if (hayErrores) {
      alert('❌ Complete todos los campos obligatorios')
      return
    }

    setCargando(true)

    try {
      let descripcionFinal = formData.descripcion || ''
      if (mostrarOtro && formData.descripcion_otro) {
        descripcionFinal = `CATEGORÍA: ${formData.descripcion_otro}. ${descripcionFinal}`
      }

      const datosAEnviar = new FormData()
      datosAEnviar.append('solicitante', formData.solicitante)
      datosAEnviar.append('area_id', Number(formData.area_id))
      datosAEnviar.append('cargo', formData.cargo)
      datosAEnviar.append('email', formData.email)
      datosAEnviar.append('telefono', formData.telefono)
      datosAEnviar.append('sede_id', Number(formData.sede_id))
      datosAEnviar.append('equipo', formData.equipo)
      datosAEnviar.append('categoria_id', Number(formData.categoria_id))
      datosAEnviar.append('prioridad', formData.prioridad.toLowerCase())
      datosAEnviar.append('descripcion', descripcionFinal)
      datosAEnviar.append('usuario_remitente', usuarioActual || 'General')
      datosAEnviar.append('estado', formData.estado)
      datosAEnviar.append('tipo_usuario', formData.tipo_usuario)

      if (formData.evidencia) {
        datosAEnviar.append('evidencia', formData.evidencia)
      }

      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/oficina`, {
        method: 'POST',
        body: datosAEnviar
      })

      const resultado = await respuesta.json()

      if (resultado.ok) {
        const folioCreado = resultado.data?.folio || resultado.data?.id || 'Generado'
        alert(`✅ Reporte registrado en el sistema correctamente.\nFolio: ${folioCreado}`)

        setFormData({ solicitante: '', area_id: '', cargo: '', email: '', telefono: '', sede_id: '', equipo: '', categoria_id: '', descripcion_otro: '', prioridad: '', descripcion: '', evidencia: null, estado: 'abierto', tipo_usuario: 'solicitante' })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setVistaPrevia(null)
        setMostrarOtro(false)
        setErrores({})
        setValido({})
      } else {
        alert('❌ Error al guardar: ' + (resultado.error || resultado.mensaje || 'Desconocido'))
        console.error('Detalles del error:', resultado)
      }
    } catch (error) {
      alert('❌ No se pudo conectar: ' + error.message)
      console.error('Error completo:', error)
    }

    setCargando(false)
  }

  // Estilo helper para bordes de validación
  const getBorderColor = (campo) => {
    if (valido[campo] === true) return '#10B981'
    if (valido[campo] === false) return '#EF4444'
    return '#D1D5DB'
  }

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* HEADER DE FORMULARIO */}
        <div
          style={{
            background: 'linear-gradient(135deg, #691B31 0%, #4e1325 100%)',
            borderRadius: '16px',
            padding: 'clamp(1.25rem, 3.5vw, 2rem)',
            color: 'white',
            boxShadow: '0 8px 20px -4px rgba(105, 27, 49, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              flexShrink: 0,
              color: '#BC955B'
            }}
          >
            <FaBuilding size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: '800', margin: 0 }}>
              Reporte de Incidencia en Oficinas
            </h1>
            <p style={{ color: '#E5E7EB', margin: '0.35rem 0 0 0', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', opacity: 0.9 }}>
              Diligencie los campos a continuación para solicitar soporte técnico o reporte de mantenimiento informático y administrativo.
            </p>
          </div>
        </div>

        {/* TARJETA DE FORMULARIO */}
        <form
          onSubmit={enviar}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
            border: '1px solid #E5E7EB',
            padding: 'clamp(1.25rem, 4vw, 2.25rem)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}
        >
          {/* SECCIÓN 1: DATOS DEL SOLICITANTE */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(105, 27, 49, 0.1)', color: '#691B31', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>1</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Datos del Solicitante
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.15rem'
              }}
            >
              {/* Solicitante */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Nombre Completo <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ingrese nombre completo"
                  value={formData.solicitante}
                  onChange={(e) => {
                    const valor = soloLetras(e.target.value)
                    setFormData({ ...formData, solicitante: valor })
                    validarCampo('solicitante', valor)
                  }}
                  className="premium-input"
                  style={{
                    border: `1.5px solid ${getBorderColor('solicitante')}`
                  }}
                />
                {errores.solicitante && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.solicitante}</span>}
              </div>

              {/* Área */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Área <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.area_id}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, area_id: valor }); validarCampo('area_id', valor) }}
                  className="premium-select"
                  style={{
                    border: `1.5px solid ${getBorderColor('area_id')}`
                  }}
                >
                  <option value="">Seleccione área</option>
                  {listaAreas.map((a, i) => <option key={i} value={a.id}>{a.nombre}</option>)}
                </select>
                {errores.area_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.area_id}</span>}
              </div>

              {/* Cargo */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Cargo <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.cargo}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, cargo: valor }); validarCampo('cargo', valor) }}
                  className="premium-select"
                  style={{
                    border: `1.5px solid ${getBorderColor('cargo')}`
                  }}
                >
                  <option value="">Seleccione cargo</option>
                  {listaCargos.map((cargo) => (
                    <option key={cargo.id} value={cargo.nombre}>{cargo.nombre}</option>
                  ))}
                </select>
                {errores.cargo && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.cargo}</span>}
              </div>

              {/* Correo Electrónico */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Correo Electrónico <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, email: valor }); validarCampo('email', valor) }}
                  className="premium-input"
                  style={{
                    border: `1.5px solid ${getBorderColor('email')}`
                  }}
                />
                {errores.email && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.email}</span>}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: UBICACIÓN Y EQUIPO */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(188, 149, 91, 0.15)', color: '#B45309', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>2</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Ubicación y Equipo Relacionado
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.15rem'
              }}
            >
              {/* Teléfono */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Teléfono (10 dígitos) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="7711234567"
                  value={formData.telefono}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, telefono: valor }); validarCampo('telefono', valor) }}
                  maxLength={10}
                  className="premium-input"
                  style={{
                    border: `1.5px solid ${getBorderColor('telefono')}`
                  }}
                />
                {errores.telefono && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.telefono}</span>}
              </div>

              {/* Sede */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Sede <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.sede_id}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, sede_id: valor }); validarCampo('sede_id', valor) }}
                  className="premium-select"
                  style={{
                    border: `1.5px solid ${getBorderColor('sede_id')}`
                  }}
                >
                  <option value="">Seleccione sede</option>
                  {listaSedes.map((s, i) => <option key={i} value={s.id}>{s.nombre}</option>)}
                </select>
                {errores.sede_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.sede_id}</span>}
              </div>

              {/* Equipo Relacionado */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Equipo Relacionado <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. PC-CCO-02 o Impresora"
                  value={formData.equipo}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, equipo: valor }); validarCampo('equipo', valor) }}
                  className="premium-input"
                  style={{
                    border: `1.5px solid ${getBorderColor('equipo')}`
                  }}
                />
                {errores.equipo && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.equipo}</span>}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLES DE LA INCIDENCIA */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>3</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Detalles de la Incidencia
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.15rem'
                }}
              >
                {/* Categoría */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                    Categoría de Falla <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => {
                      const valor = e.target.value
                      setFormData({ ...formData, categoria_id: valor, descripcion_otro: '' })
                      const selectedCat = listaCategorias.find(c => String(c.id) === String(valor))
                      setMostrarOtro(selectedCat?.nombre?.toLowerCase().includes('otro') || false)
                      validarCampo('categoria_id', valor)
                    }}
                    className="premium-select"
                    style={{
                      border: `1.5px solid ${getBorderColor('categoria_id')}`
                    }}
                  >
                    <option value="">Seleccione una categoría</option>
                    {listaCategorias.map((c, i) => <option key={i} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {errores.categoria_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.categoria_id}</span>}

                  {mostrarOtro && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Especifique qué categoría de falla es..."
                        value={formData.descripcion_otro}
                        onChange={(e) => {
                          const v = soloLetras(e.target.value)
                          setFormData({ ...formData, descripcion_otro: v })
                          validarCampo('descripcion_otro', v)
                        }}
                        className="premium-input"
                        style={{
                          border: `1.5px solid ${errores.descripcion_otro ? '#EF4444' : '#D1D5DB'}`
                        }}
                      />
                      {errores.descripcion_otro && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.descripcion_otro}</span>}
                    </div>
                  )}
                </div>

                {/* Prioridad */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                    Prioridad <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, prioridad: valor }); validarCampo('prioridad', valor) }}
                    className="premium-select"
                    style={{
                      border: `1.5px solid ${getBorderColor('prioridad')}`,
                      backgroundColor: formData.prioridad ? (
                        formData.prioridad === 'Baja' ? '#FEF9C3' :
                          formData.prioridad === 'Media' ? '#FFEDD5' :
                            formData.prioridad === 'Alta' ? '#FEE2E2' : undefined
                      ) : undefined,
                      color: formData.prioridad ? (
                        formData.prioridad === 'Baja' ? '#854D0E' :
                          formData.prioridad === 'Media' ? '#9A3412' :
                            formData.prioridad === 'Alta' ? '#991B1B' : '#374151'
                      ) : '#374151'
                    }}
                  >
                    <option value="" style={{ backgroundColor: 'white', color: '#374151', fontWeight: 'normal' }}>Seleccione prioridad</option>
                    <option value="Baja" style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>🟢 Baja</option>
                    <option value="Media" style={{ backgroundColor: '#FFEDD5', color: '#9A3412' }}>🟡 Media</option>
                    <option value="Alta" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>🔴 Alta</option>
                  </select>
                  {errores.prioridad && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.prioridad}</span>}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Descripción Detallada del Problema <span style={{ color: '#6B7280', fontWeight: 'normal' }}>(Opcional)</span>
                </label>
                <textarea
                  placeholder="Detalle los síntomas del problema, mensajes de error en pantalla o circunstancias en las que ocurre..."
                  value={formData.descripcion}
                  onChange={(e) => {
                    const v = soloLetras(e.target.value)
                    setFormData({ ...formData, descripcion: v })
                  }}
                  className="premium-textarea"
                  style={{
                    minHeight: '110px',
                    resize: 'vertical',
                    border: '1.5px solid #D1D5DB'
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: EVIDENCIA FOTOGRÁFICA */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>4</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Evidencia Fotográfica
              </h2>
            </div>

            <div
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '14px',
                padding: '1.25rem',
                backgroundColor: '#F8FAFC',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.85rem'
              }}
            >
              {!vistaPrevia ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '1.35rem' }}>
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                      Cargar foto o captura del fallo
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                      Formatos permitidos: JPG, PNG, WEBP (Máximo 10 MB)
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={manejarArchivo}
                    style={{ display: 'none' }}
                    id="input-evidencia-oficinas"
                  />
                  <label
                    htmlFor="input-evidencia-oficinas"
                    style={{
                      backgroundColor: '#691B31',
                      color: 'white',
                      padding: '0.55rem 1.15rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '0.4rem'
                    }}
                  >
                    <i className="fa-solid fa-image"></i> Seleccionar Imagen
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #BC955B', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <img
                      src={vistaPrevia}
                      alt="Vista previa evidencia"
                      style={{ maxWidth: '240px', maxHeight: '200px', display: 'block', objectFit: 'cover' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={eliminarEvidencia}
                    style={{
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      border: '1px solid #FCA5A5',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <i className="fa-solid fa-trash"></i> Eliminar Imagen
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div
            style={{
              display: 'flex',
              justify: 'flex-end',
              gap: '1rem',
              borderTop: '1px solid #F3F4F6',
              paddingTop: '1.25rem',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={cargando}
              style={{
                backgroundColor: '#F3F4F6',
                color: '#4B5563',
                border: '1px solid #D1D5DB',
                padding: '0.75rem 1.65rem',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={cargando}
              style={{
                backgroundColor: '#BC955B',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(188, 149, 91, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px'
              }}
            >
              {cargando ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Enviando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> Enviar Reporte Técnico
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}