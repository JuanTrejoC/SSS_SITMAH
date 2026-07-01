import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'

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

  // ✅ SOLO LETRAS, ESPACIOS Y SIGNOS PERMITIDOS
  const soloLetras = (texto) => {
    return texto.replace(/[^A-Za-zÁáÉéÍíÓóÚúÑñ\s.,-]/g, '')
  }

  // ✅ VALIDACIÓN DE CADA CAMPO
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

  // ✅ COMPRESIÓN DE IMAGEN VÍA CANVAS (MÁX 1600px, CALIDAD 0.75)
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

  // ✅ VALIDACIÓN DE ARCHIVOS DE IMAGEN Y COMPRESIÓN
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

    // Tamaño máximo: 10MB
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

  // ✅ ENVÍO DE FORMULARIO
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

    setCargando(true)

    // 🔍 VALIDACIÓN COMPLETA ANTES DE ENVIAR
    Object.keys(formData).forEach(campo => {
      if (campo !== 'descripcion' && campo !== 'evidencia') {
        validarCampo(campo, formData[campo])
      }
    })

    // ⚠️ VERIFICAR SI HAY ERRORES
    const hayErrores = Object.values(valido).some(esValido => esValido === false)
    if (hayErrores) {
      alert('❌ Por favor complete todos los campos obligatorios correctamente')
      setCargando(false)
      return
    }

    try {
      // 📅 FORMATO FECHA-HORA PARA BASE DE DATOS
      const fechaActual = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const horaCompleta = formData.hora_dano
        ? `${fechaActual} ${formData.hora_dano}:00`
        : new Date().toISOString().slice(0, 19).replace('T', ' ')

      // 📝 CONSTRUIR DESCRIPCIÓN FINAL
      let descripcionFinal = formData.descripcion?.trim() || ''
      if (mostrarOtro && formData.descripcion_otro?.trim()) {
        descripcionFinal = `TIPO DE FALLA: ${formData.descripcion_otro}. ${descripcionFinal}`
      }

      // 🚀 DATOS A ENVIAR (IDs convertidos a número)
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

      // 📡 PETICIÓN AL SERVIDOR
      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/semaforo`, {
        method: 'POST',
        body: datosAEnviar
      })

      const resultado = await respuesta.json()

      // ✅ PROCESO EXITOSO
      if (resultado.ok) {
        const folioCreado = resultado.data?.folio || resultado.data?.id || 'Generado'
        alert(`✅ Reporte guardado correctamente.\nFolio: ${folioCreado}`)

        // 🔄 REINICIAR FORMULARIO
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
      }
      // ❌ ERROR DEL SERVIDOR
      else {
        alert(`❌ Error: ${resultado.error || resultado.mensaje || 'Error desconocido'}`)
        console.error('Detalles del error:', resultado)
      }
    }
    // ❌ ERROR DE CONEXIÓN
    catch (error) {
      alert(`❌ Sin conexión: ${error.message}`)
      console.error('Error completo:', error)
    }

    setCargando(false)
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgb(0,0,0)', padding: '2.5rem' }}>
        <h2 style={{ color: '#BC955B', fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.8rem' }}>
          Reporte de Infraestructura Vial
        </h2>

        {/* FILA 1: Datos principales */}
        <div className="form-responsive-grid grid-4" style={{ marginBottom: '1.2rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#1f2937', display: 'block', marginBottom: '0.4rem' }}>
              Jefe de Turno Operativo
            </label>
            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.jefe_turno}
              onChange={(e) => {
                const valor = soloLetras(e.target.value)
                setFormData(prev => ({ ...prev, jefe_turno: valor }))
                validarCampo('jefe_turno', valor)
              }}
              style={{
                width: '100%', padding: '0.65rem',
                border: `1px solid ${valido.jefe_turno ? '#22c55e' : valido.jefe_turno === false ? '#ef4444' : '#9B9B9A'
                  }`,
                borderRadius: '8px'
              }}
            />
            {errores.jefe_turno && <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errores.jefe_turno}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#1f2937', display: 'block', marginBottom: '0.4rem' }}>
              Estación Cercana
            </label>
            <select
              value={formData.estacion_id}
              onChange={(e) => {
                const valor = e.target.value
                setFormData(prev => ({ ...prev, estacion_id: valor, crucero_id: '' }))
                validarCampo('estacion_id', valor)

                // Filtrar cruceros por estación seleccionada
                if (valor) {
                  const estacion = listaEstaciones.find(est => String(est.id) === String(valor))
                  if (estacion && estacion.cruceros && estacion.cruceros.length > 0) {
                    const crucerosDeEstacion = estacion.cruceros
                      .map(ec => ec.crucero)
                      .filter(c => c && c.activo !== false)
                    setCrucerosFiltrados(crucerosDeEstacion)
                  } else {
                    // Sin asignaciones: mostrar todos los cruceros
                    setCrucerosFiltrados(listaCruceros)
                  }
                } else {
                  setCrucerosFiltrados([])
                }
              }}
              style={{
                width: '100%', padding: '0.65rem',
                border: `1px solid ${valido.estacion_id ? '#22c55e' : valido.estacion_id === false ? '#ef4444' : '#9B9B9A'
                  }`,
                borderRadius: '8px', backgroundColor: 'white'
              }}
            >
              <option value="">Seleccione estación</option>
              {listaEstaciones.map((estacion) => (
                <option key={estacion.id} value={estacion.id}>{estacion.nombre}</option>
              ))}
            </select>
            {errores.estacion_id && <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errores.estacion_id}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>
              Crucero Semafórico
            </label>
            <select
              value={formData.crucero_id}
              onChange={(e) => {
                const valor = e.target.value
                setFormData(prev => ({ ...prev, crucero_id: valor }))
                validarCampo('crucero_id', valor)
              }}
              style={{
                width: '100%', padding: '0.65rem',
                border: `1px solid ${valido.crucero_id ? '#22c55e' : valido.crucero_id === false ? '#ef4444' : '#9B9B9A'
                  }`,
                borderRadius: '8px', backgroundColor: 'white'
              }}
            >
              <option value="">{formData.estacion_id ? 'Seleccione crucero' : 'Primero seleccione una estación'}</option>
              {(formData.estacion_id ? crucerosFiltrados : []).map((crucero) => (
                <option key={crucero.id} value={crucero.id}>{crucero.nombre}</option>
              ))}
            </select>
            {errores.crucero_id && <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errores.crucero_id}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>
              Tipo de Falla Detectada
            </label>
            <select
              value={formData.tipo_falla_id}
              onChange={(e) => {
                const valor = e.target.value
                setFormData(prev => ({ ...prev, tipo_falla_id: valor, descripcion_otro: '' }))
                const selectedFalla = listaTiposFalla.find(f => String(f.id) === String(valor))
                setMostrarOtro(selectedFalla?.nombre?.toLowerCase().includes('otro') || false)
                validarCampo('tipo_falla_id', valor)
              }}
              style={{
                width: '100%', padding: '0.65rem',
                border: `1px solid ${valido.tipo_falla_id ? '#22c55e' : valido.tipo_falla_id === false ? '#ef4444' : '#9B9B9A'
                  }`,
                borderRadius: '8px', backgroundColor: 'white'
              }}
            >
              <option value="">Seleccione anomalía</option>
              {listaTiposFalla.map((falla) => (
                <option key={falla.id} value={falla.id}>{falla.nombre}</option>
              ))}
            </select>

            {mostrarOtro && (
              <div style={{ marginTop: '0.8rem' }}>
                <input
                  type="text"
                  placeholder="Especifique la falla..."
                  value={formData.descripcion_otro}
                  onChange={(e) => {
                    const valor = soloLetras(e.target.value)
                    setFormData(prev => ({ ...prev, descripcion_otro: valor }))
                    validarCampo('descripcion_otro', valor)
                  }}
                  style={{
                    width: '100%', padding: '0.5rem',
                    border: `1px solid ${errores.descripcion_otro ? '#ef4444' : '#9B9B9A'}`,
                    borderRadius: '6px'
                  }}
                />
                {errores.descripcion_otro && <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errores.descripcion_otro}</small>}
              </div>
            )}
            {errores.tipo_falla_id && <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errores.tipo_falla_id}</small>}
          </div>
        </div>

        {/* FILA 2: Hora y Prioridad */}
        <div className="form-responsive-grid grid-2" style={{ marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>
              Hora Exacta del Siniestro
            </label>
            <input
              type="time"
              value={formData.hora_dano}
              onChange={(e) => {
                const valor = e.target.value
                setFormData(prev => ({ ...prev, hora_dano: valor }))
                validarCampo('hora_dano', valor)
              }}
              style={{
                width: '100%', padding: '0.65rem',
                border: `1px solid ${valido.hora_dano ? '#22c55e' : valido.hora_dano === false ? '#ef4444' : '#9B9B9A'
                  }`,
                borderRadius: '8px'
              }}
            />
            {errores.hora_dano && <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errores.hora_dano}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>
              Prioridad Asignada
            </label>
            <div style={{
              padding: '0.65rem 0.8rem', backgroundColor: '#fee2e2',
              color: '#dc2626', fontWeight: 'bold', borderRadius: '8px',
              textAlign: 'center'
            }}>
              ALTA
            </div>
          </div>
        </div>

        {/* NOTAS ADICIONALES */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>
            Notas
          </label>
          <textarea
            placeholder="Detalles de afectación, observaciones, etc..."
            value={formData.descripcion}
            onChange={(e) => {
              const valor = soloLetras(e.target.value)
              setFormData(prev => ({ ...prev, descripcion: valor }))
            }}
            style={{
              width: '100%', minHeight: '90px', padding: '0.8rem',
              border: '1px solid #9B9B9A', borderRadius: '8px',
              fontSize: '0.9rem', resize: 'vertical'
            }}
          ></textarea>
        </div>

        {/* EVIDENCIA FOTOGRÁFICA */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>
            Fotografía del Estado Vial (Solo imágenes)
          </label>
          <div style={{
            border: '1px solid #9B9B9A', borderRadius: '8px', padding: '0.65rem',
            backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={manejarArchivo} style={{ fontSize: '0.9rem', width: '100%' }} />
            {vistaPrevia && (
              <div style={{ position: 'relative', display: 'inline-block', width: 'fit-content', marginTop: '0.5rem' }}>
                <img 
                  src={vistaPrevia} 
                  alt="Vista previa" 
                  style={{ maxWidth: '180px', maxHeight: '180px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                />
                <button
                  type="button"
                  onClick={eliminarEvidencia}
                  title="Eliminar imagen"
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="form-responsive-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem', backgroundColor: '#9B9B9A', color: '#ffffffff',
              border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer'
            }}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            style={{
              padding: '0.75rem 2rem', backgroundColor: '#BC955B', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer'
            }}
            disabled={cargando}
          >
            {cargando ? 'Enviando...' : 'Enviar Reporte Técnico'}
          </button>
        </div>
      </div>
    </div>
  )
}