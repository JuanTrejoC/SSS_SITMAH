import { useState, useEffect, useRef } from 'react'

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

  const [listaEstaciones, setListaEstaciones] = useState([
    { id: 1, nombre: "Terminal Téllez" },
    { id: 2, nombre: "Gabriel Mancera" },
    { id: 3, nombre: "Matilde" },
    { id: 4, nombre: "Efrén Rebolledo" },
    { id: 5, nombre: "Tercera Edad" },
    { id: 6, nombre: "San Antonio" },
    { id: 7, nombre: "Ejército Mexicano" },
    { id: 8, nombre: "Felipe Ángeles" },
    { id: 9, nombre: "Centro de Justicia oriente" },
    { id: 10, nombre: "Centro de Justicia poniente" },
    { id: 11, nombre: "Vicente Segura" },
    { id: 12, nombre: "Juan C. Doria" },
    { id: 13, nombre: "Hospitales" },
    { id: 14, nombre: "SEPH" },
    { id: 15, nombre: "Tecnológico" },
    { id: 16, nombre: "Bicentenario oriente" },
    { id: 17, nombre: "Bicentenario poniente" },
    { id: 18, nombre: "Centro Minero" },
    { id: 19, nombre: "Zona Plateada" },
    { id: 20, nombre: "Tecnológico de Monterrey" },
    { id: 21, nombre: "Estadio Hidalgo" },
    { id: 22, nombre: "Central de Autobuses" },
    { id: 23, nombre: "Cuna de Fútbol" },
    { id: 24, nombre: "Santa Julia" },
    { id: 25, nombre: "Prepa 1" },
    { id: 26, nombre: "Revolución" },
    { id: 27, nombre: "Manuel Dublán" },
    { id: 28, nombre: "Presidente Alemán" },
    { id: 29, nombre: "Niños Heroes oriente" },
    { id: 30, nombre: "Niños Heroes poniente" },
    { id: 31, nombre: "Centro Histórico" },
    { id: 32, nombre: "Plaza Juárez" },
    { id: 33, nombre: "Parque del Maestro" },
    { id: 34, nombre: "Bioparque" }
  ])

  const [listaCruceros, setListaCruceros] = useState([
    { id: 1, nombre: "BLVD. TÉLLEZ - SAN ALFONSO" },
    { id: 2, nombre: "FELIPE ÁNGELES - VENTA PRIETA" },
    { id: 3, nombre: "FELIPE ÁNGELES - GALERÍAS" },
    { id: 4, nombre: "FELIPE ÁNGELES - PREPA SIGLO XXI" },
    { id: 5, nombre: "CENTRAL AUTOBUSES" },
    { id: 6, nombre: "F. ÁNGELES - ROJO GÓMEZ" },
    { id: 7, nombre: "F. ÁNGELES - POLIFORUM" },
    { id: 8, nombre: "F. ÁNGELES - RETORNO NISSAN" },
    { id: 9, nombre: "F. ÁNGELES - 5 DE MAYO" },
    { id: 10, nombre: "F. ÁNGELES - ARTICULO 3RO" },
    { id: 11, nombre: "F. ÁNGELES - PREPA 1" },
    { id: 12, nombre: "FELIPE ÁNGELES - GYM PREPA" },
    { id: 13, nombre: "B. JUÁREZ - INSURGENTES" },
    { id: 14, nombre: "REVOLUCIÓN - 16 DE ENERO" },
    { id: 15, nombre: "REVOLUCIÓN - JAIME NUNO" },
    { id: 16, nombre: "REVOLUCIÓN - SAMUEL CARRO" },
    { id: 17, nombre: "REVOLUCIÓN - MANUEL DÚBLAN" },
    { id: 18, nombre: "REVOLUCIÓN - GABRIEL HERNÁNDEZ" },
    { id: 19, nombre: "REVOLUCIÓN - 15 DE SEPTIEMBRE" },
    { id: 20, nombre: "REVOLUCIÓN - 5 DE FEBRERO" },
    { id: 21, nombre: "REVOLUCIÓN - MADERO" },
    { id: 22, nombre: "REVOLUCIÓN - BELISARIO" },
    { id: 23, nombre: "ARISPE - ALLENDE-MATAMOROS" },
    { id: 24, nombre: "MATAMOROS - OCAMPO" },
    { id: 25, nombre: "VILLAGRAN -ALLENDE-ZARAGOZA" },
    { id: 26, nombre: "B. JUÁREZ - BELISARIO DOMINGUEZ" },
    { id: 27, nombre: "B. JUÁREZ - GUERRERO" },
    { id: 28, nombre: "B. JUÁREZ - DANIEL CERECEDO" },
    { id: 29, nombre: "B. JUÁREZ - J M. IGLESIAS" },
    { id: 30, nombre: "B. JUÁREZ - GRAL MEJIA" },
    { id: 31, nombre: "B. JUÁREZ - MANUEL DÚBLAN" },
    { id: 32, nombre: "B. JUÁREZ - SAMUEL CARRO" },
    { id: 33, nombre: "B. JUÁREZ - 12 DE OCTUBRE" },
    { id: 34, nombre: "B. JUÁREZ - BOCANEGRA" },
    { id: 35, nombre: "B. JUÁREZ - 16 DE ENERO" }
  ])

  const [listaTiposFalla, setListaTiposFalla] = useState([
    { id: 1, nombre: 'Luz roja no funciona' },
    { id: 2, nombre: 'Luz amarilla no funciona' },
    { id: 3, nombre: 'Luz verde no funciona' },
    { id: 4, nombre: 'Semaforo peatonal dañado' },
    { id: 5, nombre: 'Poste dañado' },
    { id: 6, nombre: 'Cabezal semaforico dañado' },
    { id: 7, nombre: 'Cabezal semaforico caido' },
    { id: 8, nombre: 'Cableado dañado' },
    { id: 9, nombre: 'Daño por choque vehicular' },
    { id: 10, nombre: 'Daño por vandalismo' },
    { id: 11, nombre: 'Desincronizacion semaforica' },
    { id: 12, nombre: 'Programacion incorrecta de tiempos' },
    { id: 13, nombre: 'Modulo LED dañado' },
    { id: 14, nombre: 'Lente roto' },
    { id: 15, nombre: 'Gabinete de control dañado' },
    { id: 16, nombre: 'Falla CFE' },
    { id: 17, nombre: 'Otro' }
  ])

  // Cargar catálogos desde el backend al montar
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const resEstaciones = await fetch('http://localhost:3000/api/catalogos/estaciones')
        if (resEstaciones.ok) {
          const json = await resEstaciones.json()
          if (json.ok && json.data && json.data.length > 0) setListaEstaciones(json.data)
        }
        const resCruceros = await fetch('http://localhost:3000/api/catalogos/cruceros')
        if (resCruceros.ok) {
          const json = await resCruceros.json()
          if (json.ok && json.data && json.data.length > 0) setListaCruceros(json.data)
        }
        const resFallas = await fetch('http://localhost:3000/api/catalogos/tipos-falla')
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
      return
    }

    // Tamaño máximo: 10MB
    if (archivo.size > 10 * 1024 * 1024) {
      alert('❌ La imagen no debe superar los 10 MB')
      e.target.value = ''
      setFormData(prev => ({ ...prev, evidencia: null }))
      return
    }

    try {
      const archivoComprimido = await comprimirImagen(archivo)
      setFormData(prev => ({ ...prev, evidencia: archivoComprimido }))
    } catch (err) {
      console.error('Error al comprimir la imagen:', err)
      setFormData(prev => ({ ...prev, evidencia: archivo }))
    }
  }

  // ✅ ENVÍO DE FORMULARIO
  const enviar = async (e) => {
    e.preventDefault()
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
      const respuesta = await fetch('http://localhost:3000/api/reportes/semaforo', {
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
          Reporte de Infraestructura Vial (Tuzobús)
        </h2>

        {/* FILA 1: Datos principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginBottom: '1.2rem' }}>
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
              Estación Tuzobús Cercana
            </label>
            <select
              value={formData.estacion_id}
              onChange={(e) => {
                const valor = e.target.value
                setFormData(prev => ({ ...prev, estacion_id: valor }))
                validarCampo('estacion_id', valor)
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
              <option value="">Seleccione intersección</option>
              {listaCruceros.map((crucero) => (
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
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
            backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={manejarArchivo} style={{ fontSize: '0.9rem' }} />
            {formData.evidencia && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✅ Imagen seleccionada</span>}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
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