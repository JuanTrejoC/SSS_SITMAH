// src/views/FormSemaforos.jsx
import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'
import { FaTrafficLight } from 'react-icons/fa'

export default function FormSemaforos({ usuarioActual }) {
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    jefe_turno: '',
    estacion_id: '',       // ID numérico
    crucero_id: '',        // ID numérico
    tipo_falla_id: '',     // ID numérico
    descripcion_otro: '',
    hora_dano: '',         // Formato: HH:mm
    descripcion: '',       // Notas adicionales
    evidencia: null
  })

  const [errores, setErrores] = useState({})
  const [valido, setValido] = useState({})
  const [mostrarOtro, setMostrarOtro] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState(null)



  const [listaEstaciones, setListaEstaciones] = useState([])
  const [listaCruceros, setListaCruceros] = useState([])
  const [listaTiposFalla, setListaTiposFalla] = useState([])

  // Lista de cruceros filtrados por estación seleccionada
  const [crucerosFiltrados, setCrucerosFiltrados] = useState([])

  // Cargar catálogos desde el backend al montar
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const resEstaciones = await fetch(`${API_BASE_URL}/api/catalogos/estaciones`)
        if (resEstaciones.ok) {
          const json = await resEstaciones.json()
          if (json.ok && json.data && json.data.length > 0) setListaEstaciones(json.data)
        }
        const resCruceros = await fetch(`${API_BASE_URL}/api/catalogos/cruceros`)
        if (resCruceros.ok) {
          const json = await resCruceros.json()
          if (json.ok && json.data && json.data.length > 0) setListaCruceros(json.data)
        }
        const resFallas = await fetch(`${API_BASE_URL}/api/catalogos/tipos-falla`)
        if (resFallas.ok) {
          const json = await resFallas.json()
          if (json.ok && json.data && json.data.length > 0) setListaTiposFalla(json.data)
        }
      } catch (err) {
        console.error('Error al cargar catálogos de semáforos:', err)
      }
    }
    cargarCatalogos()
  }, [])

  // Filtrar cruceros cuando cambia la estación
  useEffect(() => {
    if (formData.estacion_id && listaCruceros.length > 0) {
      const filtrados = listaCruceros.filter(
        c => String(c.estacion_id) === String(formData.estacion_id)
      )
      setCrucerosFiltrados(filtrados.length > 0 ? filtrados : listaCruceros)
    } else {
      setCrucerosFiltrados(listaCruceros)
    }
  }, [formData.estacion_id, listaCruceros])

  // Solo letras, espacios y signos permitidos
  const soloLetras = (texto) => {
    return texto.replace(/[^A-Za-zÁáÉéÍíÓóÚúÑñ\s.,-]/g, '')
  }

  // Validación de cada campo
  const validarCampo = (nombre, valor) => {
    let mensajeError = ''
    let esValido = false
    const valorLimpio = valor?.trim() || ''

    switch (nombre) {
      case 'jefe_turno':
      case 'estacion_id':
      case 'crucero_id':
      case 'tipo_falla_id':
      case 'hora_dano':
        if (!valorLimpio) mensajeError = 'Campo obligatorio'
        else esValido = true
        break

      case 'descripcion_otro':
        if (mostrarOtro && !valorLimpio) mensajeError = 'Especifique cuál es la falla'
        else esValido = true
        break

      default:
        esValido = true
        break
    }

    setErrores(prev => ({ ...prev, [nombre]: mensajeError }))
    setValido(prev => ({ ...prev, [nombre]: esValido }))
  }

  // Compresión de imagen vía Canvas (máx 1600px, calidad 0.75)
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

  // Manejo de archivo
  const manejarArchivo = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!tiposPermitidos.includes(archivo.type)) {
      alert('❌ Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)')
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

  // Envío del formulario
  const enviar = async (e) => {
    e.preventDefault()

    const confirmar = await Swal.fire({
      title: '¿Enviar reporte de semáforo?',
      text: 'Puede cancelar si desea revisar o editar los datos ingresados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#BC955B',
      cancelButtonColor: '#9B9B9A',
      confirmButtonText: 'Sí, enviar reporte',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmar.isConfirmed) return

    setCargando(true)

    Object.keys(formData).forEach(campo => {
      if (campo !== 'descripcion' && campo !== 'evidencia') {
        validarCampo(campo, formData[campo])
      }
    })

    const hayErrores = Object.values(valido).some(esValido => esValido === false)
    if (hayErrores) {
      alert('❌ Por favor complete todos los campos obligatorios correctamente')
      setCargando(false)
      return
    }

    try {
      const fechaActual = new Date().toISOString().slice(0, 10)
      const horaCompleta = formData.hora_dano
        ? `${fechaActual} ${formData.hora_dano}:00`
        : new Date().toISOString().slice(0, 19).replace('T', ' ')

      let descripcionFinal = formData.descripcion?.trim() || ''
      if (mostrarOtro && formData.descripcion_otro?.trim()) {
        descripcionFinal = `TIPO DE FALLA: ${formData.descripcion_otro}. ${descripcionFinal}`
      }

      const datosAEnviar = new FormData()
      datosAEnviar.append('jefe_turno', formData.jefe_turno.trim())
      datosAEnviar.append('estacion_id', Number(formData.estacion_id))
      datosAEnviar.append('crucero_id', Number(formData.crucero_id))
      datosAEnviar.append('tipo_falla_id', Number(formData.tipo_falla_id))
      datosAEnviar.append('descripcion', descripcionFinal)
      datosAEnviar.append('hora_dano', horaCompleta)
      datosAEnviar.append('prioridad', 'alta')
      datosAEnviar.append('usuario_remitente', usuarioActual || 'Usuario General')

      if (formData.evidencia) {
        datosAEnviar.append('evidencia', formData.evidencia)
      }

      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/semaforo`, {
        method: 'POST',
        body: datosAEnviar
      })

      const resultado = await respuesta.json()

      if (resultado.ok) {
        const folioCreado = resultado.data?.folio || resultado.data?.id || 'Generado'
        alert(`✅ Reporte registrado correctamente.\nFolio: ${folioCreado}`)

        setFormData({
          jefe_turno: '', estacion_id: '', crucero_id: '', tipo_falla_id: '',
          descripcion_otro: '', hora_dano: '', descripcion: '', evidencia: null
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setVistaPrevia(null)
        setMostrarOtro(false)
        setErrores({})
        setValido({})
      } else {
        alert(`❌ Error: ${resultado.error || resultado.mensaje || 'Error desconocido'}`)
        console.error('Detalles del error:', resultado)
      }
    } catch (error) {
      alert(`❌ Sin conexión: ${error.message}`)
      console.error('Error completo:', error)
    }

    setCargando(false)
  }

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
            <FaTrafficLight size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: '800', margin: 0 }}>
              Reporte Semafórico de Infraestructura Vial
            </h1>
            <p style={{ color: '#E5E7EB', margin: '0.35rem 0 0 0', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', opacity: 0.9 }}>
              Reporte incidencias operativas, fallas de controlador, focos fundidos o averías en cruceros del sistema de transporte.
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
          {/* SECCIÓN 1: UBICACIÓN Y RESPONSABLE */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(105, 27, 49, 0.1)', color: '#691B31', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>1</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Ubicación y Responsable
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.15rem'
              }}
            >
              {/* Jefe de Turno */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Jefe de Turno<span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre de quien reporta"
                  value={formData.jefe_turno}
                  onChange={(e) => {
                    const v = soloLetras(e.target.value)
                    setFormData({ ...formData, jefe_turno: v })
                    validarCampo('jefe_turno', v)
                  }}
                  className="premium-input"
                  style={{
                    border: `1.5px solid ${getBorderColor('jefe_turno')}`
                  }}
                />
                {errores.jefe_turno && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.jefe_turno}</span>}
              </div>

              {/* Estación */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Estación <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.estacion_id}
                  onChange={(e) => {
                    const v = e.target.value
                    setFormData({ ...formData, estacion_id: v, crucero_id: '' })
                    validarCampo('estacion_id', v)
                  }}
                  className="premium-select"
                  style={{
                    border: `1.5px solid ${getBorderColor('estacion_id')}`
                  }}
                >
                  <option value="">Seleccione estación</option>
                  {listaEstaciones.map((est, i) => (
                    <option key={i} value={est.id}>{est.nombre}</option>
                  ))}
                </select>
                {errores.estacion_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.estacion_id}</span>}
              </div>

              {/* Crucero */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Crucero Afectado <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.crucero_id}
                  onChange={(e) => {
                    const v = e.target.value
                    setFormData({ ...formData, crucero_id: v })
                    validarCampo('crucero_id', v)
                  }}
                  className="premium-select"
                  style={{
                    border: `1.5px solid ${getBorderColor('crucero_id')}`
                  }}
                >
                  <option value="">Seleccione crucero</option>
                  {crucerosFiltrados.map((c, i) => (
                    <option key={i} value={c.id}>{c.ubicacion || c.nombre || `Crucero #${c.id}`}</option>
                  ))}
                </select>
                {errores.crucero_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.crucero_id}</span>}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TIPO DE FALLA Y HORA */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(188, 149, 91, 0.15)', color: '#B45309', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>2</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Detalles del Daño e Incidencia
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.15rem'
              }}
            >
              {/* Tipo de Falla */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Tipo de Falla <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.tipo_falla_id}
                  onChange={(e) => {
                    const v = e.target.value
                    setFormData({ ...formData, tipo_falla_id: v, descripcion_otro: '' })
                    const fallaObj = listaTiposFalla.find(f => String(f.id) === String(v))
                    setMostrarOtro(fallaObj?.nombre?.toLowerCase().includes('otro') || false)
                    validarCampo('tipo_falla_id', v)
                  }}
                  className="premium-select"
                  style={{
                    border: `1.5px solid ${getBorderColor('tipo_falla_id')}`
                  }}
                >
                  <option value="">Seleccione tipo de falla</option>
                  {listaTiposFalla.map((tf, i) => (
                    <option key={i} value={tf.id}>{tf.nombre}</option>
                  ))}
                </select>
                {errores.tipo_falla_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.tipo_falla_id}</span>}

                {mostrarOtro && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Especifique cuál es la falla observada..."
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

              {/* Hora del Daño */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Hora del Siniestro <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="time"
                  value={formData.hora_dano}
                  onChange={(e) => {
                    const v = e.target.value
                    setFormData({ ...formData, hora_dano: v })
                    validarCampo('hora_dano', v)
                  }}
                  className="premium-input"
                  style={{
                    border: `1.5px solid ${getBorderColor('hora_dano')}`
                  }}
                />
                {errores.hora_dano && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.hora_dano}</span>}
              </div>
            </div>

            {/* Notas / Descripción */}
            <div style={{ marginTop: '1.15rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Observaciones o Notas Adicionales <span style={{ color: '#6B7280', fontWeight: 'normal' }}>(Opcional)</span>
              </label>
              <textarea
                placeholder="Indique detalles de tráfico, si hubo impacto de vehículo, gabinete afectado o notas de seguridad..."
                value={formData.descripcion}
                onChange={(e) => {
                  const v = soloLetras(e.target.value)
                  setFormData({ ...formData, descripcion: v })
                }}
                className="premium-textarea"
                style={{
                  minHeight: '100px',
                  resize: 'vertical',
                  border: '1.5px solid #D1D5DB'
                }}
              />
            </div>
          </div>

          {/* SECCIÓN 3: EVIDENCIA FOTOGRÁFICA */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>3</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Fotografía del Crucero
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
                    <i className="fa-solid fa-camera"></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                      Cargar foto de la falla en semáforo
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                      Formatos recomendados: JPG, PNG, WEBP (Máximo 10 MB)
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={manejarArchivo}
                    style={{ display: 'none' }}
                    id="input-evidencia-semaforos"
                  />
                  <label
                    htmlFor="input-evidencia-semaforos"
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
                    <i className="fa-solid fa-upload"></i> Subir Fotografía
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #BC955B', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <img
                      src={vistaPrevia}
                      alt="Vista previa crucero"
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
                  <i className="fa-solid fa-spinner fa-spin"></i> Registrando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> Enviar Reporte de Semáforo
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}