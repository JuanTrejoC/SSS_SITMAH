// src/views/FormInfraestructura.jsx
import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'
import { mostrarAlertaError, verificarConexion } from '../utils/conexionUtils'
import { FaWrench, FaCamera, FaTrashAlt, FaPaperPlane, FaTimes, FaImages } from 'react-icons/fa'
import PersonalAutocomplete from '../components/PersonalAutocomplete'
import { CARGOS_NORMALIZADOS } from '../data/personalSitmah'
import ModalCamara from '../components/ModalCamara'

export default function FormInfraestructura({ usuarioActual }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [camaraAbierta, setCamaraAbierta] = useState(false)
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

  const getBorderColor = (campo) => {
    if (errores[campo]) return '#EF4444'
    if (valido[campo]) return '#10B981'
    return '#CBD5E1'
  }

  // Cerrar modal de cámara con tecla Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (camaraAbierta) {
          setCamaraAbierta(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [camaraAbierta])

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

  const abrirCamara = () => {
    const espacioDisponible = MAX_FOTOS - (formData.evidencias?.length || 0)
    if (espacioDisponible <= 0) {
      Swal.fire('Límite alcanzado', `Solo se permite un máximo de ${MAX_FOTOS} fotografías como evidencia.`, 'warning')
      return
    }
    setCamaraAbierta(true)
  }

  const cerrarCamara = () => {
    setCamaraAbierta(false)
  }

  const onFotoCapturada = async (archivo) => {
    let procesado = archivo
    try {
      procesado = await comprimirImagen(archivo)
    } catch {
      procesado = archivo
    }

    const nuevaVista = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: URL.createObjectURL(procesado),
      name: procesado.name,
      size: (procesado.size / (1024 * 1024)).toFixed(2)
    }

    setFormData((prev) => ({
      ...prev,
      evidencias: [...(prev.evidencias || []), procesado]
    }))

    setVistasPrevias((prev) => [...prev, nuevaVista])
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const manejarArchivos = async (e) => {
    const archivos = Array.from(e.target.files || [])
    if (archivos.length === 0) return

    const espacioDisponible = MAX_FOTOS - (formData.evidencias?.length || 0)
    if (espacioDisponible <= 0) {
      Swal.fire('Límite alcanzado', `Solo se permite un máximo de ${MAX_FOTOS} fotografías como evidencia.`, 'warning')
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
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
    if (!verificarConexion()) return

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
        mostrarAlertaError(resultado.error, 'Error', 'No se pudo registrar el reporte.')
      }
    } catch (error) {
      mostrarAlertaError(error, 'Error', 'No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* HEADER MODERNO */}
      <div
        style={{
          background: 'linear-gradient(135deg, #691B31 0%, #4e1325 60%, #390d1b 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: 'white',
          boxShadow: '0 8px 24px -4px rgba(105, 27, 49, 0.25)',
          marginBottom: '1.75rem',
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
          <FaWrench size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: '800', margin: 0 }}>
            Reportes de Infraestructura
          </h1>
          <p style={{ color: '#E5E7EB', margin: '0.35rem 0 0 0', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', opacity: 0.9 }}>
            Complete los campos a continuación para solicitar soporte o reporte de mantenimiento en infraestructura.
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
              <PersonalAutocomplete
                value={formData.solicitante}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, solicitante: val }))
                  validarCampo('solicitante', val)
                }}
                onSelect={(emp) => {
                  const matchArea = listaAreas.find(a => 
                    a.nombre.toLowerCase().trim() === (emp.direccion || '').toLowerCase().trim()
                  )
                  setFormData(prev => ({
                    ...prev,
                    solicitante: emp.nombre,
                    cargo: emp.cargo || prev.cargo,
                    area_id: matchArea ? String(matchArea.id) : prev.area_id
                  }))
                  if (emp.nombre) validarCampo('solicitante', emp.nombre)
                  if (emp.cargo) validarCampo('cargo', emp.cargo)
                  if (matchArea) validarCampo('area_id', String(matchArea.id))
                }}
                placeholder="-- Seleccionar Solicitante --"
              />
              {errores.solicitante && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.solicitante}</span>}
            </div>

            {/* Área / Dirección */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Área <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.area_id}
                onChange={(e) => {
                  const valor = e.target.value
                  setFormData(prev => ({ ...prev, area_id: valor }))
                  validarCampo('area_id', valor)
                }}
                className="premium-select"
                style={{
                  border: `1.5px solid ${getBorderColor('area_id')}`
                }}
              >
                <option value="">Seleccione área</option>
                {listaAreas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
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
                onChange={(e) => {
                  const valor = e.target.value
                  setFormData(prev => ({ ...prev, cargo: valor }))
                  validarCampo('cargo', valor)
                }}
                className="premium-select"
                style={{
                  border: `1.5px solid ${getBorderColor('cargo')}`
                }}
              >
                <option value="">Seleccione cargo</option>
                {CARGOS_NORMALIZADOS.map((cargo, idx) => (
                  <option key={idx} value={cargo}>{cargo}</option>
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
                onChange={(e) => {
                  const valor = e.target.value
                  setFormData(prev => ({ ...prev, email: valor }))
                  validarCampo('email', valor)
                }}
                className="premium-input"
                style={{
                  border: `1.5px solid ${getBorderColor('email')}`
                }}
              />
              {errores.email && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.email}</span>}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: UBICACIÓN E INCIDENCIA */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
            <span style={{ backgroundColor: 'rgba(188, 149, 91, 0.15)', color: '#BC955B', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>2</span>
            <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
              Ubicación e Incidencia de Infraestructura
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
                maxLength={10}
                placeholder="7711234567"
                value={formData.telefono}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setFormData(prev => ({ ...prev, telefono: val }))
                  validarCampo('telefono', val)
                }}
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
                onChange={(e) => {
                  const valor = e.target.value
                  setFormData(prev => ({ ...prev, sede_id: valor }))
                  validarCampo('sede_id', valor)
                }}
                className="premium-select"
                style={{
                  border: `1.5px solid ${getBorderColor('sede_id')}`
                }}
              >
                <option value="">Seleccione sede</option>
                {listaSedes.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              {errores.sede_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.sede_id}</span>}
            </div>

            {/* Instalación o Elemento Afectado */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Instalación o Elemento Afectado <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Lámparas principales / Fuga en sanitarios"
                value={formData.equipo}
                onChange={(e) => {
                  const valor = e.target.value
                  setFormData(prev => ({ ...prev, equipo: valor }))
                  validarCampo('equipo', valor)
                }}
                className="premium-input"
                style={{
                  border: `1.5px solid ${getBorderColor('equipo')}`
                }}
              />
              {errores.equipo && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.equipo}</span>}
            </div>

            {/* Tipo de Infraestructura */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Tipo de Infraestructura <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.tipo_infraestructura}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData(prev => ({ ...prev, tipo_infraestructura: val }))
                  if (val === 'Otro') setMostrarOtro(true)
                  else setMostrarOtro(false)
                }}
                className="premium-select"
                style={{
                  border: `1.5px solid ${getBorderColor('tipo_infraestructura')}`
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
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Especifique el Tipo de Infraestructura <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Especifique..."
                  value={formData.descripcion_otro}
                  onChange={(e) => {
                    const valor = e.target.value
                    setFormData(prev => ({ ...prev, descripcion_otro: valor }))
                    validarCampo('descripcion_otro', valor)
                  }}
                  className="premium-input"
                  style={{
                    border: `1.5px solid ${getBorderColor('descripcion_otro')}`
                  }}
                />
                {errores.descripcion_otro && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.descripcion_otro}</span>}
              </div>
            )}

            {/* Referencia o Ubicación Específica */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                No. de Inventario o Ubicación Específica <span style={{ color: '#6B7280', fontWeight: 'normal' }}>(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Andén sur / Tablero B / Sin número"
                value={formData.numero_serie}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                className="premium-input"
                style={{
                  border: '1.5px solid #CBD5E1'
                }}
              />
            </div>

            {/* Prioridad */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Nivel de Prioridad <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.prioridad}
                onChange={(e) => {
                  const valor = e.target.value
                  setFormData(prev => ({ ...prev, prioridad: valor }))
                  validarCampo('prioridad', valor)
                }}
                className="premium-select"
                style={{
                  border: `1.5px solid ${getBorderColor('prioridad')}`
                }}
              >
                <option value="">Seleccione prioridad</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
              {errores.prioridad && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.prioridad}</span>}
            </div>
          </div>

          {/* Descripción Detallada */}
          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
              Descripción Detallada de la Incidencia <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describa con precisión la situación observada, los daños visibles o requerimientos de reparación..."
              value={formData.descripcion}
              maxLength={500}
              onChange={(e) => {
                const valor = e.target.value
                setFormData(prev => ({ ...prev, descripcion: valor }))
                validarCampo('descripcion', valor)
              }}
              className="premium-textarea"
              style={{
                minHeight: '100px',
                resize: 'vertical',
                border: `1.5px solid ${getBorderColor('descripcion')}`
              }}
            />
            {errores.descripcion && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.descripcion}</span>}
          </div>
        </div>

        {/* SECCIÓN 3: EVIDENCIA FOTOGRÁFICA */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>3</span>
            <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
              Evidencia Fotográfica (Máximo {MAX_FOTOS} fotografías)
            </h2>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={manejarArchivos}
            style={{ display: 'none' }}
            id="input-evidencia-infraestructura"
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={manejarArchivos}
            style={{ display: 'none' }}
            id="input-camera-fallback-infraestructura"
          />

          <div
            style={{
              border: '2px dashed #CBD5E1',
              borderRadius: '14px',
              padding: '1.25rem',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {vistasPrevias.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '1.4rem' }}>
                  <FaCamera />
                </div>
                <div>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>
                    Adjuntar fotografías del daño o afectación física
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                    Toma una foto al instante o sube imágenes JPG, PNG o WEBP (máx. 10 MB cada una) · {MAX_FOTOS - vistasPrevias.length} disponible(s)
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={abrirCamara}
                    style={{
                      backgroundColor: '#0284C7',
                      color: 'white',
                      padding: '0.6rem 1.3rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#0369A1'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#0284C7'}
                  >
                    <FaCamera /> Tomar Foto Directa
                  </button>
                  <label
                    htmlFor="input-evidencia-infraestructura"
                    style={{
                      backgroundColor: '#691B31',
                      color: 'white',
                      padding: '0.6rem 1.3rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 6px rgba(105, 27, 49, 0.25)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#8a2441'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#691B31'}
                  >
                    <FaImages /> Seleccionar de Galería / Archivo
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <span style={{ backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '0.3rem 0.85rem', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FaImages /> {vistasPrevias.length} de {MAX_FOTOS} fotos seleccionadas
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {vistasPrevias.length < MAX_FOTOS && (
                      <>
                        <button
                          type="button"
                          onClick={abrirCamara}
                          style={{
                            backgroundColor: '#0284C7',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <FaCamera /> Tomar otra foto
                        </button>
                        <label
                          htmlFor="input-evidencia-infraestructura"
                          style={{
                            backgroundColor: '#691B31',
                            color: 'white',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <FaImages /> Agregar más fotos
                        </label>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        vistasPrevias.forEach(v => URL.revokeObjectURL(v.url))
                        setVistasPrevias([])
                        setFormData(prev => ({ ...prev, evidencias: [] }))
                      }}
                      style={{
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        border: '1px solid #FCA5A5',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <FaTrashAlt /> Quitar todas
                    </button>
                  </div>
                </div>

                {/* Cuadrícula de fotos */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.85rem'
                  }}
                >
                  {vistasPrevias.map((item, index) => (
                    <div
                      key={item.id || index}
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '2px solid #BC955B',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Badge de número */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          zIndex: 2
                        }}
                      >
                        #{index + 1}
                      </span>

                      {/* Botón eliminar individual */}
                      <button
                        type="button"
                        onClick={() => eliminarEvidencia(index)}
                        title="Eliminar esta foto"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 2,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        <FaTimes size={12} />
                      </button>

                      <img
                        src={item.url}
                        alt={`Evidencia ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '115px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />

                      <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem', color: '#64748B', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name || `Foto ${index + 1}`} ({item.size} MB)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
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
              cursor: cargando ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(188, 149, 91, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px'
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

      {/* Modal de Cámara en Vivo */}
      <ModalCamara
        isOpen={camaraAbierta}
        onClose={cerrarCamara}
        onFotoCapturada={onFotoCapturada}
        onFallbackNativo={() => cameraInputRef.current?.click()}
        titulo="Tomar Evidencia de Infraestructura"
      />
    </div>
  )
}
