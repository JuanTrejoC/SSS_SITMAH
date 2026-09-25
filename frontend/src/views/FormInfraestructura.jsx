// src/views/FormInfraestructura.jsx
import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'
import { FaWrench, FaCamera, FaTrashAlt, FaPaperPlane, FaTimes } from 'react-icons/fa'

export default function FormInfraestructura({ usuarioActual }) {
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    solicitante: '',
    area_id: '',
    cargo: '',
    email: '',
    telefono: '',
    sede_id: '',
    equipo: '',
    numero_serie: '',
    tipo_infraestructura: 'Edificación y Obra Civil',
    descripcion_otro: '',
    prioridad: '',
    descripcion: '',
    evidencias: [],
    estado: 'abierto',
    tipo_usuario: 'solicitante'
  })

  const [errores, setErrores] = useState({})
  const [valido, setValido] = useState({})
  const [mostrarOtro, setMostrarOtro] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [vistasPrevias, setVistasPrevias] = useState([])

  const [listaAreas, setListaAreas] = useState([])
  const [listaCargos, setListaCargos] = useState([])
  const [listaSedes, setListaSedes] = useState([])

  const TIPOS_INFRAESTRUCTURA = [
    'Edificación y Obra Civil',
    'Instalaciones Eléctricas e Iluminación',
    'Plomería e Instalaciones Hidráulicas',
    'Cerrajería, Herrería y Cancelaría',
    'Pintura, Impermeabilización y Acabados',
    'Climatización y Ventilación',
    'Mobiliario e Inmuebles Urbanos',
    'Otro'
  ]

  // Cargar catálogos desde el backend
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
      case 'prioridad':
        if (!valor) mensajeError = 'Campo obligatorio'
        else esValido = true
        break

      case 'equipo':
        if (!valor) mensajeError = 'Indique la instalación o elemento afectado'
        else if (valor.length < 3) mensajeError = 'Mínimo 3 caracteres'
        else esValido = true
        break

      case 'email': {
        const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!valor) mensajeError = 'Campo obligatorio'
        else if (!regexCorreo.test(valor)) mensajeError = 'Correo inválido (ej: nombre@dominio.com)'
        else esValido = true
        break
      }

      case 'telefono': {
        const soloNumeros = valor.replace(/[^0-9]/g, '')
        if (valor !== soloNumeros) {
          setFormData(prev => ({ ...prev, telefono: soloNumeros }))
        }
        if (!soloNumeros) mensajeError = 'Campo obligatorio'
        else if (soloNumeros.length !== 10) mensajeError = 'Debe tener 10 dígitos'
        else esValido = true
        break
      }

      case 'descripcion_otro':
        if (mostrarOtro && !valor) mensajeError = 'Especifique el tipo de infraestructura'
        else esValido = true
        break

      case 'descripcion':
        if (!valor) mensajeError = 'Describa la falla o solicitud'
        else if (valor.length < 5) mensajeError = 'Mínimo 5 caracteres'
        else if (valor.length > 500) mensajeError = 'Máximo 500 caracteres'
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
            if (!blob) return resolve(archivo)
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

  const MAX_FOTOS = 3

  const manejarArchivos = async (e) => {
    const archivos = Array.from(e.target.files || [])
    if (archivos.length === 0) return

    const espacioDisponible = MAX_FOTOS - (formData.evidencias?.length || 0)
    if (espacioDisponible <= 0) {
      Swal.fire('Límite alcanzado', `Solo se permite un máximo de ${MAX_FOTOS} fotografías como evidencia.`, 'warning')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    let archivosAProcesar = archivos
    if (archivos.length > espacioDisponible) {
      Swal.fire(
        'Límite de fotos',
        `Solo puedes agregar ${espacioDisponible} foto(s) más (máximo ${MAX_FOTOS} en total).`,
        'info'
      )
      archivosAProcesar = archivos.slice(0, espacioDisponible)
    }

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const archivosValidos = []

    for (const archivo of archivosAProcesar) {
      if (!tiposPermitidos.includes(archivo.type)) {
        Swal.fire('Error', `El archivo "${archivo.name}" no es una imagen válida`, 'error')
        continue
      }
      if (archivo.size > 10 * 1024 * 1024) {
        Swal.fire('Error', `La imagen "${archivo.name}" no debe superar los 10 MB`, 'error')
        continue
      }
      archivosValidos.push(archivo)
    }

    if (archivosValidos.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const procesados = await Promise.all(
      archivosValidos.map(async (arch) => {
        try {
          return await comprimirImagen(arch)
        } catch {
          return arch
        }
      })
    )

    const nuevasVistas = procesados.map((arch) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: URL.createObjectURL(arch),
      name: arch.name,
      size: (arch.size / (1024 * 1024)).toFixed(2)
    }))

    setFormData((prev) => ({
      ...prev,
      evidencias: [...(prev.evidencias || []), ...procesados]
    }))

    setVistasPrevias((prev) => [...prev, ...nuevasVistas])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const eliminarEvidencia = (index) => {
    setFormData((prev) => {
      const nuevas = [...(prev.evidencias || [])]
      nuevas.splice(index, 1)
      return { ...prev, evidencias: nuevas }
    })

    setVistasPrevias((prev) => {
      const nuevas = [...prev]
      if (nuevas[index]?.url) {
        URL.revokeObjectURL(nuevas[index].url)
      }
      nuevas.splice(index, 1)
      return nuevas
    })
  }

  const enviar = async (e) => {
    e.preventDefault()

    const camposObligatorios = ['solicitante', 'area_id', 'cargo', 'email', 'telefono', 'sede_id', 'equipo', 'prioridad', 'descripcion']
    camposObligatorios.forEach(campo => {
      validarCampo(campo, formData[campo])
    })

    if (mostrarOtro) {
      validarCampo('descripcion_otro', formData.descripcion_otro)
    }

    // Comprobar si hay errores
    const hayIncompletos = camposObligatorios.some(campo => !formData[campo] || errores[campo])
    if (hayIncompletos || (mostrarOtro && !formData.descripcion_otro)) {
      Swal.fire('Campos incompletos', 'Por favor revise y complete todos los campos obligatorios.', 'warning')
      return
    }

    const confirmar = await Swal.fire({
      title: '¿Enviar reporte de infraestructura?',
      text: 'Se enviará el ticket para programación y atención de mantenimiento.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#691B31',
      cancelButtonColor: '#9B9B9A',
      confirmButtonText: 'Sí, enviar reporte',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmar.isConfirmed) return

    setCargando(true)

    try {
      let descripcionFinal = formData.descripcion || ''
      const tipoInfra = mostrarOtro ? formData.descripcion_otro : formData.tipo_infraestructura
      descripcionFinal = `[TIPO: ${tipoInfra}] ${descripcionFinal}`

      const datosAEnviar = new FormData()
      datosAEnviar.append('solicitante', formData.solicitante)
      datosAEnviar.append('area_id', Number(formData.area_id))
      datosAEnviar.append('cargo', formData.cargo)
      datosAEnviar.append('email', formData.email)
      datosAEnviar.append('telefono', formData.telefono)
      datosAEnviar.append('sede_id', Number(formData.sede_id))
      datosAEnviar.append('equipo', formData.equipo)
      datosAEnviar.append('numero_serie', formData.numero_serie || 'S/N')
      datosAEnviar.append('prioridad', formData.prioridad.toLowerCase())
      datosAEnviar.append('descripcion', descripcionFinal)
      datosAEnviar.append('estado', formData.estado)
      datosAEnviar.append('tipo_usuario', formData.tipo_usuario)

      if (formData.evidencias && formData.evidencias.length > 0) {
        formData.evidencias.forEach((arch) => {
          datosAEnviar.append('evidencia', arch)
        })
      }

      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/infraestructura`, {
        method: 'POST',
        body: datosAEnviar
      })

      const resultado = await respuesta.json()

      if (resultado.ok) {
        const folioCreado = resultado.data?.folio || resultado.data?.id || 'Generado'
        Swal.fire({
          title: '¡Reporte Registrado!',
          html: `Su solicitud de infraestructura ha sido registrada con éxito.<br><br><strong style="font-size: 1.25rem; color: #691B31;">Folio: ${folioCreado}</strong><br><br>Se ha enviado una confirmación a su correo electrónico.`,
          icon: 'success',
          confirmButtonColor: '#691B31'
        })

        vistasPrevias.forEach((vp) => {
          if (vp.url) URL.revokeObjectURL(vp.url)
        })
        setVistasPrevias([])

        setFormData({
          solicitante: '',
          area_id: '',
          cargo: '',
          email: '',
          telefono: '',
          sede_id: '',
          equipo: '',
          numero_serie: '',
          tipo_infraestructura: 'Edificación y Obra Civil',
          descripcion_otro: '',
          prioridad: '',
          descripcion: '',
          evidencias: [],
          estado: 'abierto',
          tipo_usuario: 'solicitante'
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
        setMostrarOtro(false)
        setErrores({})
        setValido({})
      } else {
        Swal.fire('Error', 'Error al guardar: ' + (resultado.error || 'Desconocido'), 'error')
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el servidor: ' + error.message, 'error')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* HEADER / BANNER INSTITUCIONAL */}
        <div
          style={{
            background: 'linear-gradient(135deg, #691B31 0%, #4a1322 100%)',
            borderRadius: '16px',
            padding: '2rem',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(105, 27, 49, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                flexShrink: 0
              }}
            >
              <FaWrench />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fcd3d3', fontWeight: '700' }}>
                Sistema de Atención a Incidencias · SITMAH
              </span>
              <h1 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.85rem)', fontWeight: '800', margin: '0.2rem 0 0.4rem 0' }}>
                Crear Reporte de Infraestructura
              </h1>
              <p style={{ color: '#E5E7EB', margin: 0, fontSize: '0.9rem', opacity: 0.95, lineHeight: 1.4 }}>
                Reporte de incidencias en inmuebles, estaciones, instalaciones eléctricas, sanitarias, herrería y mantenimiento general.
              </p>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={enviar}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem'
          }}
        >
          {/* SECCIÓN 1: DATOS DEL SOLICITANTE */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: '0 0 1rem 0', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '18px', backgroundColor: '#691B31', borderRadius: '4px', display: 'inline-block' }}></span>
              1. Datos del Solicitante
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Solicitante */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Nombre Completo <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez Trejo"
                  value={formData.solicitante}
                  onChange={(e) => {
                    const val = soloLetras(e.target.value)
                    setFormData(prev => ({ ...prev, solicitante: val }))
                    validarCampo('solicitante', val)
                  }}
                  onBlur={(e) => validarCampo('solicitante', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.solicitante ? '1.5px solid #DC2626' : (valido.solicitante ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                {errores.solicitante && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.solicitante}</span>}
              </div>

              {/* Área / Dirección */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Dirección o Área <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={formData.area_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, area_id: e.target.value }))
                    validarCampo('area_id', e.target.value)
                  }}
                  onBlur={(e) => validarCampo('area_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.area_id ? '1.5px solid #DC2626' : (valido.area_id ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Seleccionar Área --</option>
                  {listaAreas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
                {errores.area_id && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.area_id}</span>}
              </div>

              {/* Cargo */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Cargo / Puesto <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  list="cargos-list"
                  placeholder="Ej. Supervisor de Estaciones"
                  value={formData.cargo}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, cargo: e.target.value }))
                    validarCampo('cargo', e.target.value)
                  }}
                  onBlur={(e) => validarCampo('cargo', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.cargo ? '1.5px solid #DC2626' : (valido.cargo ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                <datalist id="cargos-list">
                  {listaCargos.map(c => <option key={c.id} value={c.nombre} />)}
                </datalist>
                {errores.cargo && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.cargo}</span>}
              </div>

              {/* Correo Electrónico */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Correo Electrónico <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="correo@sitmah.gob.mx"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                    validarCampo('email', e.target.value)
                  }}
                  onBlur={(e) => validarCampo('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.email ? '1.5px solid #DC2626' : (valido.email ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                {errores.email && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.email}</span>}
              </div>

              {/* Teléfono */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Teléfono (10 dígitos) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="7711234567"
                  value={formData.telefono}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setFormData(prev => ({ ...prev, telefono: val }))
                    validarCampo('telefono', val)
                  }}
                  onBlur={(e) => validarCampo('telefono', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.telefono ? '1.5px solid #DC2626' : (valido.telefono ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                {errores.telefono && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.telefono}</span>}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: UBICACIÓN Y ELEMENTO AFECTADO */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: '0 0 1rem 0', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '18px', backgroundColor: '#BC955B', borderRadius: '4px', display: 'inline-block' }}></span>
              2. Ubicación e Incidencia de Infraestructura
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Sede / Instalación */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Sede / Estación / Inmueble <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={formData.sede_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, sede_id: e.target.value }))
                    validarCampo('sede_id', e.target.value)
                  }}
                  onBlur={(e) => validarCampo('sede_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.sede_id ? '1.5px solid #DC2626' : (valido.sede_id ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Seleccionar Sede / Inmueble --</option>
                  {listaSedes.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                {errores.sede_id && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.sede_id}</span>}
              </div>

              {/* Elemento / Falla */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Instalación o Elemento Afectado <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Lámparas principales de andén / Fuga en sanitarios"
                  value={formData.equipo}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, equipo: e.target.value }))
                    validarCampo('equipo', e.target.value)
                  }}
                  onBlur={(e) => validarCampo('equipo', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.equipo ? '1.5px solid #DC2626' : (valido.equipo ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                {errores.equipo && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.equipo}</span>}
              </div>

              {/* Categoría de Infraestructura */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Tipo de Infraestructura <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={formData.tipo_infraestructura}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData(prev => ({ ...prev, tipo_infraestructura: val }))
                    if (val === 'Otro') setMostrarOtro(true)
                    else setMostrarOtro(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    outline: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: 'white'
                  }}
                >
                  {TIPOS_INFRAESTRUCTURA.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Campo adicional si seleccionó 'Otro' */}
              {mostrarOtro && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                    Especifique el Tipo de Infraestructura <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Especifique..."
                    value={formData.descripcion_otro}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, descripcion_otro: e.target.value }))
                      validarCampo('descripcion_otro', e.target.value)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: errores.descripcion_otro ? '1.5px solid #DC2626' : '1px solid #D1D5DB',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                  {errores.descripcion_otro && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.descripcion_otro}</span>}
                </div>
              )}

              {/* Referencia o Ubicación Específica */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  No. de Inventario o Ubicación Específica (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Andén sur / Tablero B / Sin número"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Prioridad */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Nivel de Prioridad <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, prioridad: e.target.value }))
                    validarCampo('prioridad', e.target.value)
                  }}
                  onBlur={(e) => validarCampo('prioridad', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: errores.prioridad ? '1.5px solid #DC2626' : (valido.prioridad ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                    outline: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Seleccionar Prioridad --</option>
                  <option value="baja">Baja (Mantenimiento preventivo / Estético)</option>
                  <option value="media">Media (Afectación parcial sin riesgo)</option>
                  <option value="alta">Alta (Urgencia operativa / Riesgo)</option>
                </select>
                {errores.prioridad && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.prioridad}</span>}
              </div>
            </div>

            {/* Descripción Detallada */}
            <div style={{ marginTop: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                Descripción Detallada de la Incidencia <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describa con precisión la situación observada, los daños visibles o requerimientos de reparación..."
                value={formData.descripcion}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, descripcion: e.target.value }))
                  validarCampo('descripcion', e.target.value)
                }}
                onBlur={(e) => validarCampo('descripcion', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '8px',
                  border: errores.descripcion ? '1.5px solid #DC2626' : (valido.descripcion ? '1.5px solid #10B981' : '1px solid #D1D5DB'),
                  outline: 'none',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
              {errores.descripcion && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.descripcion}</span>}
            </div>
          </div>

          {/* SECCIÓN 3: EVIDENCIA FOTOGRÁFICA */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: '0 0 0.5rem 0', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '18px', backgroundColor: '#059669', borderRadius: '4px', display: 'inline-block' }}></span>
              3. Evidencia Fotográfica (Máximo {MAX_FOTOS} fotografías)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 0 1rem 0' }}>
              Adjunta imágenes claras de la afectación física o elemento dañado.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {vistasPrevias.length < MAX_FOTOS && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #D1D5DB',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#F9FAFB',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.backgroundColor = '#FFF1F2' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                >
                  <FaCamera size={28} color="#691B31" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>
                    Haz clic para seleccionar imágenes
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                    JPG, PNG o WEBP (máx. 10 MB cada una) · {MAX_FOTOS - vistasPrevias.length} disponible(s)
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={manejarArchivos}
                    style={{ display: 'none' }}
                  />
                </div>
              )}

              {/* Miniaturas de imágenes */}
              {vistasPrevias.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {vistasPrevias.map((vp, index) => (
                    <div
                      key={vp.id}
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#F3F4F6'
                      }}
                    >
                      <img
                        src={vp.url}
                        alt={`Evidencia ${index + 1}`}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => eliminarEvidencia(index)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(220, 38, 38, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                      >
                        <FaTimes size={12} />
                      </button>
                      <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#4B5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vp.name} ({vp.size} MB)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN DE ENVÍO */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            <button
              type="submit"
              disabled={cargando}
              style={{
                backgroundColor: cargando ? '#9CA3AF' : '#691B31',
                color: 'white',
                border: 'none',
                padding: '0.85rem 2rem',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: cargando ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: '0 4px 12px rgba(105, 27, 49, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {cargando ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Registrando reporte...
                </>
              ) : (
                <>
                  <FaPaperPlane /> Enviar Reporte de Infraestructura
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
