import { useState, useEffect, useRef, useMemo } from 'react'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../config'
import {
  FaBuilding,
  FaLaptop,
  FaDesktop,
  FaTv,
  FaKeyboard,
  FaPrint,
  FaTools,
  FaCheckCircle,
  FaTimes,
  FaSearch,
  FaBoxes
} from 'react-icons/fa'
import PersonalAutocomplete from '../components/PersonalAutocomplete'
import { CARGOS_NORMALIZADOS } from '../data/personalSitmah'
import ModalCamara from '../components/ModalCamara'

export default function FormOficinas({ usuarioActual }) {
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
    categoria_id: '',
    descripcion_otro: '',
    prioridad: '',
    descripcion: '',
    evidencias: [],
    estado: 'Pendiente',       // ✅ ESTADO POR DEFECTO
    tipo_usuario: 'solicitante'// ✅ PARA QUE EL ADMIN LO VEA
  })

  const [errores, setErrores] = useState({})
  const [valido, setValido] = useState({})
  const [mostrarOtro, setMostrarOtro] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [vistasPrevias, setVistasPrevias] = useState([])

  const [listaAreas, setListaAreas] = useState([])
  const [listaCargos, setListaCargos] = useState([])
  const [listaSedes, setListaSedes] = useState([])
  const [listaCategorias, setListaCategorias] = useState([])

  // Equipos asignados al solicitante
  const [equiposDelResponsable, setEquiposDelResponsable] = useState([])
  const [buscandoEquipos, setBuscandoEquipos] = useState(false)
  const [equipoSeleccionadoKey, setEquipoSeleccionadoKey] = useState('')
  const [modalEquiposAbierto, setModalEquiposAbierto] = useState(false)
  const [filtroModalEquipos, setFiltroModalEquipos] = useState('')

  // Buscar equipos asignados cuando cambia el solicitante
  useEffect(() => {
    const solicitante = (formData.solicitante || '').trim()
    if (solicitante.length < 3) {
      setEquiposDelResponsable([])
      setBuscandoEquipos(false)
      setEquipoSeleccionadoKey('')
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      try {
        setBuscandoEquipos(true)
        const res = await fetch(`${API_BASE_URL}/api/catalogos/equipos-responsable?nombre=${encodeURIComponent(solicitante)}`)
        if (res.ok) {
          const json = await res.json()
          if (isMounted) {
            if (json.ok && Array.isArray(json.data)) {
              setEquiposDelResponsable(json.data)
            } else {
              setEquiposDelResponsable([])
            }
          }
        }
      } catch (err) {
        console.error('Error al consultar equipos asignados:', err)
        if (isMounted) setEquiposDelResponsable([])
      } finally {
        if (isMounted) setBuscandoEquipos(false)
      }
    }, 350)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [formData.solicitante])

  // Opciones formateadas de equipos asignados (incluyendo periféricos/componentes)
  const opcionesEquipos = useMemo(() => {
    const opciones = []
    equiposDelResponsable.forEach((eq) => {
      const tipoStr = (eq.tipo || 'Equipo').toUpperCase()
      const desc = `${eq.marca || ''} ${eq.modelo || ''}`.trim()
      const invStr = eq.numeroInventario ? `Inv: ${eq.numeroInventario}` : 'Sin Inv.'
      const serStr = eq.numeroSerie ? `Serie: ${eq.numeroSerie}` : 'Sin Serie'

      opciones.push({
        key: `main-${eq.id}`,
        id: eq.id,
        nombre: `${tipoStr} ${desc}`.trim(),
        label: `${tipoStr} ${desc ? `(${desc})` : ''} — [${invStr} | ${serStr}]`,
        numeroInventario: eq.numeroInventario,
        numeroSerie: eq.numeroSerie,
        tipo: eq.tipo,
        marca: eq.marca,
        modelo: eq.modelo,
        esComponente: false
      })

      if (eq.componentes && Array.isArray(eq.componentes) && eq.componentes.length > 0) {
        eq.componentes.forEach((comp) => {
          const compTipo = (comp.tipo || 'Periférico').toUpperCase()
          const compDesc = `${comp.marca || ''} ${comp.modelo || ''}`.trim()
          const compInv = comp.numeroInventario ? `Inv: ${comp.numeroInventario}` : 'Sin Inv.'
          const compSer = comp.numeroSerie ? `Serie: ${comp.numeroSerie}` : 'Sin Serie'

          opciones.push({
            key: `comp-${comp.id}`,
            id: comp.id,
            nombre: `${compTipo} ${compDesc}`.trim(),
            label: `   ↳ [Periférico] ${compTipo} ${compDesc ? `(${compDesc})` : ''} — [${compInv} | ${compSer}]`,
            numeroInventario: comp.numeroInventario,
            numeroSerie: comp.numeroSerie,
            tipo: comp.tipo,
            marca: comp.marca,
            modelo: comp.modelo,
            esComponente: true,
            padreId: eq.id
          })
        })
      }
    })
    return opciones
  }, [equiposDelResponsable])

  const manejarSeleccionarEquipo = (key) => {
    setEquipoSeleccionadoKey(key)
    if (!key) return

    const opcion = opcionesEquipos.find(o => o.key === key)
    if (opcion) {
      const nuevoEquipo = opcion.numeroInventario || opcion.nombre || ''
      const nuevoSerie = opcion.numeroSerie || ''

      setFormData(prev => ({
        ...prev,
        equipo: nuevoEquipo,
        numero_serie: nuevoSerie
      }))

      validarCampo('equipo', nuevoEquipo)
      validarCampo('numero_serie', nuevoSerie)
    }
  }

  const limpiarEquipoSeleccionado = () => {
    setEquipoSeleccionadoKey('')
    setFormData(prev => ({
      ...prev,
      equipo: '',
      numero_serie: ''
    }))
    validarCampo('equipo', '')
    validarCampo('numero_serie', '')
  }

  // Filtrado de equipos dentro del modal
  const equiposFiltradosModal = useMemo(() => {
    if (!filtroModalEquipos.trim()) return opcionesEquipos
    const term = filtroModalEquipos.toLowerCase().trim()
    return opcionesEquipos.filter(op =>
      (op.label || '').toLowerCase().includes(term) ||
      (op.numeroInventario || '').toLowerCase().includes(term) ||
      (op.numeroSerie || '').toLowerCase().includes(term) ||
      (op.tipo || '').toLowerCase().includes(term) ||
      (op.marca || '').toLowerCase().includes(term) ||
      (op.modelo || '').toLowerCase().includes(term)
    )
  }, [opcionesEquipos, filtroModalEquipos])

  const seleccionarDesdeModal = (key) => {
    manejarSeleccionarEquipo(key)
    setModalEquiposAbierto(false)
    setFiltroModalEquipos('')
  }

  const getIconoEquipo = (tipo) => {
    const t = String(tipo || '').toLowerCase()
    if (t.includes('laptop') || t.includes('portatil')) return <FaLaptop />
    if (t.includes('escritorio') || t.includes('pc') || t.includes('computadora')) return <FaDesktop />
    if (t.includes('pantalla') || t.includes('monitor') || t.includes('tv')) return <FaTv />
    if (t.includes('teclado') || t.includes('mouse')) return <FaKeyboard />
    if (t.includes('impresora') || t.includes('scanner')) return <FaPrint />
    if (t.includes('herramienta')) return <FaTools />
    return <FaBoxes />
  }

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
      case 'categoria_id':
      case 'prioridad':
        if (!valor) mensajeError = 'Campo obligatorio'
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

      case 'equipo':
      case 'numero_serie':
        esValido = valor ? true : null
        break;

      case 'descripcion_otro':
        if (mostrarOtro && !valor) mensajeError = 'Especifique la categoría'
        else esValido = true
        break

      case 'descripcion':
        if (valor && valor.length > 250) mensajeError = 'Máximo 250 caracteres'
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

  // Manejo de múltiples archivos de evidencia (máximo 3 fotos)
  const MAX_FOTOS_OFICINA = 3

  const abrirCamara = () => {
    const espacioDisponible = MAX_FOTOS_OFICINA - (formData.evidencias?.length || 0)
    if (espacioDisponible <= 0) {
      Swal.fire('Límite alcanzado', `Solo se permite un máximo de ${MAX_FOTOS_OFICINA} fotografías como evidencia.`, 'warning')
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

    const espacioDisponible = MAX_FOTOS_OFICINA - (formData.evidencias?.length || 0)
    if (espacioDisponible <= 0) {
      Swal.fire('Límite alcanzado', `Solo se permite un máximo de ${MAX_FOTOS_OFICINA} fotografías como evidencia.`, 'warning')
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      return
    }

    let archivosAProcesar = archivos
    if (archivos.length > espacioDisponible) {
      Swal.fire(
        'Límite de fotos',
        `Solo puedes agregar ${espacioDisponible} foto(s) más (máximo ${MAX_FOTOS_OFICINA} en total). Se tomarán solo las primeras ${espacioDisponible}.`,
        'info'
      )
      archivosAProcesar = archivos.slice(0, espacioDisponible)
    }

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const archivosValidos = []

    for (const archivo of archivosAProcesar) {
      if (!tiposPermitidos.includes(archivo.type)) {
        Swal.fire('Error', `El archivo "${archivo.name}" no es una imagen válida (.jpg, .png, .gif, .webp)`, 'error')
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

  const eliminarTodasEvidencias = () => {
    vistasPrevias.forEach((vp) => {
      if (vp.url) URL.revokeObjectURL(vp.url)
    })
    setVistasPrevias([])
    setFormData((prev) => ({ ...prev, evidencias: [] }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const enviar = async (e) => {
    e.preventDefault()

    const nuevosErrores = {}
    const nuevosValidos = {}
    let formularioValido = true

    // Solicitante
    const solVal = formData.solicitante?.trim() || ''
    if (!solVal) {
      nuevosErrores.solicitante = 'Campo obligatorio'
      nuevosValidos.solicitante = false
      formularioValido = false
    } else if (solVal.length < 3) {
      nuevosErrores.solicitante = 'Mínimo 3 caracteres'
      nuevosValidos.solicitante = false
      formularioValido = false
    } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]{3,100}$/.test(solVal)) {
      nuevosErrores.solicitante = 'Solo letras y espacios'
      nuevosValidos.solicitante = false
      formularioValido = false
    } else {
      nuevosValidos.solicitante = true
    }

    // Área
    if (!formData.area_id) {
      nuevosErrores.area_id = 'Campo obligatorio'
      nuevosValidos.area_id = false
      formularioValido = false
    } else {
      nuevosValidos.area_id = true
    }

    // Cargo
    if (!formData.cargo) {
      nuevosErrores.cargo = 'Campo obligatorio'
      nuevosValidos.cargo = false
      formularioValido = false
    } else {
      nuevosValidos.cargo = true
    }

    // Email
    const emailVal = formData.email?.trim() || ''
    const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailVal) {
      nuevosErrores.email = 'Campo obligatorio'
      nuevosValidos.email = false
      formularioValido = false
    } else if (!regexCorreo.test(emailVal)) {
      nuevosErrores.email = 'Correo inválido (ej: nombre@dominio.com)'
      nuevosValidos.email = false
      formularioValido = false
    } else {
      nuevosValidos.email = true
    }

    // Teléfono
    const soloNumeros = (formData.telefono || '').replace(/[^0-9]/g, '')
    if (!soloNumeros) {
      nuevosErrores.telefono = 'Campo obligatorio'
      nuevosValidos.telefono = false
      formularioValido = false
    } else if (soloNumeros.length !== 10) {
      nuevosErrores.telefono = 'Debe tener 10 dígitos'
      nuevosValidos.telefono = false
      formularioValido = false
    } else {
      nuevosValidos.telefono = true
    }

    // Sede
    if (!formData.sede_id) {
      nuevosErrores.sede_id = 'Campo obligatorio'
      nuevosValidos.sede_id = false
      formularioValido = false
    } else {
      nuevosValidos.sede_id = true
    }

    // Equipo o Serie (Opcionales)
    const eqVal = formData.equipo?.trim() || ''
    const serVal = formData.numero_serie?.trim() || ''
    nuevosValidos.equipo = eqVal ? true : null
    nuevosValidos.numero_serie = serVal ? true : null

    // Categoría
    if (!formData.categoria_id) {
      nuevosErrores.categoria_id = 'Campo obligatorio'
      nuevosValidos.categoria_id = false
      formularioValido = false
    } else {
      nuevosValidos.categoria_id = true
    }

    // Categoría Otro
    if (mostrarOtro && !formData.descripcion_otro?.trim()) {
      nuevosErrores.descripcion_otro = 'Especifique la categoría'
      nuevosValidos.descripcion_otro = false
      formularioValido = false
    } else if (mostrarOtro) {
      nuevosValidos.descripcion_otro = true
    }

    // Prioridad
    if (!formData.prioridad) {
      nuevosErrores.prioridad = 'Campo obligatorio'
      nuevosValidos.prioridad = false
      formularioValido = false
    } else {
      nuevosValidos.prioridad = true
    }

    setErrores(nuevosErrores)
    setValido(nuevosValidos)

    if (!formularioValido) {
      Swal.fire('Atención', 'Complete todos los campos obligatorios correctamente', 'warning')
      return
    }

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
      datosAEnviar.append('numero_serie', formData.numero_serie)
      datosAEnviar.append('categoria_id', Number(formData.categoria_id))
      datosAEnviar.append('prioridad', formData.prioridad.toLowerCase())
      datosAEnviar.append('descripcion', descripcionFinal)
      datosAEnviar.append('usuario_remitente', usuarioActual || 'General')
      datosAEnviar.append('estado', formData.estado)
      datosAEnviar.append('tipo_usuario', formData.tipo_usuario)

      if (formData.evidencias && formData.evidencias.length > 0) {
        formData.evidencias.forEach((arch) => {
          datosAEnviar.append('evidencia', arch)
        })
      }

      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/oficina`, {
        method: 'POST',
        body: datosAEnviar
      })

      const resultado = await respuesta.json()

      if (resultado.ok) {
        const folioCreado = resultado.data?.folio || resultado.data?.id || 'Generado'
        Swal.fire('Éxito', `Reporte registrado en el sistema correctamente.\nFolio: ${folioCreado}`, 'success');

        vistasPrevias.forEach((vp) => {
          if (vp.url) URL.revokeObjectURL(vp.url)
        })
        setVistasPrevias([])

        setFormData({ solicitante: '', area_id: '', cargo: '', email: '', telefono: '', sede_id: '', equipo: '', numero_serie: '', categoria_id: '', descripcion_otro: '', prioridad: '', descripcion: '', evidencias: [], estado: 'abierto', tipo_usuario: 'solicitante' })
        setEquiposDelResponsable([])
        setEquipoSeleccionadoKey('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setMostrarOtro(false)
        setErrores({})
        setValido({})
      } else {
        Swal.fire('Error', 'Error al guardar: ' + (resultado.error || resultado.mensaje || 'Desconocido'), 'error');
        console.error('Detalles del error:', resultado)
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar: ' + error.message, 'error');
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
              Reporte de Incidencia Tecnológicas
            </h1>
            <p style={{ color: '#E5E7EB', margin: '0.35rem 0 0 0', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', opacity: 0.9 }}>
              Complete los campos a continuación para solicitar soporte técnico o reporte de mantenimiento tecnológico.
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
                    setFormData(prev => ({ ...prev, solicitante: val }));
                    validarCampo('solicitante', val);
                  }}
                  onSelect={(emp) => {
                    const matchArea = listaAreas.find(a => 
                      a.nombre.toLowerCase().trim() === (emp.direccion || '').toLowerCase().trim()
                    );
                    setFormData(prev => ({
                      ...prev,
                      solicitante: emp.nombre,
                      cargo: emp.cargo || prev.cargo,
                      area_id: matchArea ? String(matchArea.id) : prev.area_id
                    }));
                    if (emp.nombre) validarCampo('solicitante', emp.nombre);
                    if (emp.cargo) validarCampo('cargo', emp.cargo);
                    if (matchArea) validarCampo('area_id', String(matchArea.id));
                  }}
                  placeholder="-- Seleccionar Solicitante --"
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

            {/* Fila 1: Contacto y Sede */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.15rem',
                marginBottom: '1.15rem'
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
                    height: '45px',
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
                    height: '45px',
                    border: `1.5px solid ${getBorderColor('sede_id')}`
                  }}
                >
                  <option value="">Seleccione sede</option>
                  {listaSedes.map((s, i) => <option key={i} value={s.id}>{s.nombre}</option>)}
                </select>
                {errores.sede_id && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.sede_id}</span>}
              </div>
            </div>

            {/* Fila 2: Inventario, Serie y Búsqueda (100% Simétricas) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.15rem'
              }}
            >
              {/* Número de Inventario */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Número de Inventario <span style={{ color: '#6B7280', fontWeight: 'normal' }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. PC-CCO-02 o Impresora"
                  value={formData.equipo}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, equipo: valor }); validarCampo('equipo', valor) }}
                  className="premium-input"
                  style={{
                    height: '45px',
                    border: `1.5px solid ${getBorderColor('equipo')}`
                  }}
                />
                {errores.equipo && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.equipo}</span>}
              </div>

              {/* Número de Serie */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Número de Serie <span style={{ color: '#6B7280', fontWeight: 'normal' }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="En caso de no tener No. de Inventario"
                  value={formData.numero_serie}
                  onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, numero_serie: valor }); validarCampo('numero_serie', valor) }}
                  className="premium-input"
                  style={{
                    height: '45px',
                    border: `1.5px solid ${getBorderColor('numero_serie')}`
                  }}
                />
                {errores.numero_serie && <span style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' }}>{errores.numero_serie}</span>}
              </div>

              {/* Casilla Simétrica de Búsqueda de Equipos */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                  Buscar en Inventario <span style={{ color: '#6B7280', fontWeight: 'normal' }}>(Opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setModalEquiposAbierto(true)}
                  style={{
                    width: '100%',
                    height: '45px',
                    backgroundColor: '#691B31',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 2px 5px rgba(105, 27, 49, 0.2)',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7D213B'
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(105, 27, 49, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#691B31'
                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(105, 27, 49, 0.2)'
                  }}
                  title="Buscar y desplegar equipos asignados al solicitante"
                >
                  <FaSearch size={14} />
                  <span>Buscar equipo</span>
                  {opcionesEquipos.length > 0 && (
                    <span style={{
                      backgroundColor: '#BC955B',
                      color: 'white',
                      borderRadius: '9999px',
                      padding: '0.15rem 0.55rem',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      {opcionesEquipos.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Indicador de equipo seleccionado (elegante y compacto) */}
              {equipoSeleccionadoKey && (
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '10px',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.825rem',
                  color: '#166534',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <FaCheckCircle size={14} color="#16A34A" style={{ flexShrink: 0 }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <strong>Equipo asignado:</strong> {opcionesEquipos.find(o => o.key === equipoSeleccionadoKey)?.label || formData.equipo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={limpiarEquipoSeleccionado}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      flexShrink: 0,
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px'
                    }}
                    title="Desvincular equipo y limpiar campos"
                  >
                    <FaTimes size={11} /> Quitar
                  </button>
                </div>
              )}
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
                  maxLength={250}
                  onChange={(e) => {
                    const v = e.target.value
                    setFormData({ ...formData, descripcion: v })
                    validarCampo('descripcion', v)
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

          {/* SECCIÓN 4: EVIDENCIA FOTOGRÁFICA (MÁXIMO 3 FOTOS) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.65rem' }}>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>4</span>
              <h2 style={{ color: '#111827', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                Evidencia Fotográfica (Máximo 3 fotos)
              </h2>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={manejarArchivos}
              style={{ display: 'none' }}
              id="input-evidencia-oficinas"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={manejarArchivos}
              style={{ display: 'none' }}
              id="input-camera-fallback-oficinas"
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
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>
                      Cargar fotos o capturas del fallo
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                      Toma una foto al instante o sube hasta 3 fotografías (JPG, PNG, WEBP — Máx. 10 MB c/u)
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
                      <i className="fa-solid fa-camera"></i> Tomar Foto Directa
                    </button>
                    <label
                      htmlFor="input-evidencia-oficinas"
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
                      <i className="fa-solid fa-images"></i> Seleccionar de Galería / Archivo
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Barra superior con resumen y botones */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span style={{ backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '0.3rem 0.85rem', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <i className="fa-solid fa-images"></i> {vistasPrevias.length} de 3 fotos seleccionadas
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {vistasPrevias.length < 3 ? (
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
                            <i className="fa-solid fa-camera"></i> Tomar otra foto
                          </button>
                          <label
                            htmlFor="input-evidencia-oficinas"
                            style={{
                              backgroundColor: '#BC955B',
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
                            <i className="fa-solid fa-plus"></i> Subir más ({3 - vistasPrevias.length})
                          </label>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', padding: '0.4rem 0.5rem', display: 'inline-flex', alignItems: 'center' }}>
                          ✓ Máximo alcanzado (3/3)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={eliminarTodasEvidencias}
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
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
                        <i className="fa-solid fa-trash"></i> Quitar todas
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
                            backgroundColor: '#DC2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            zIndex: 2
                          }}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>

                        <img
                          src={item.url}
                          alt={`Evidencia ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '110px',
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

      {/* Modal de Cámara en Vivo */}
      <ModalCamara
        isOpen={camaraAbierta}
        onClose={cerrarCamara}
        onFotoCapturada={onFotoCapturada}
        onFallbackNativo={() => cameraInputRef.current?.click()}
        titulo="Tomar Evidencia del Fallo"
      />

      {/* Modal Desplegable de Búsqueda de Equipos Asignados */}
      {modalEquiposAbierto && (
        <div
          onClick={() => setModalEquiposAbierto(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0'
            }}
          >
            {/* Cabecera del Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  backgroundColor: '#691B31',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem'
                }}>
                  <FaSearch />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1E293B' }}>
                    Buscar Equipos Asignados
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.775rem', color: '#64748B' }}>
                    {formData.solicitante?.trim()
                      ? `Equipos a nombre de: ${formData.solicitante}`
                      : 'Equipos tecnológicos del solicitante'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEquiposAbierto(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Buscador interno si hay equipos */}
            {opcionesEquipos.length > 0 && (
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #F1F5F9', backgroundColor: 'white' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FaSearch style={{ position: 'absolute', left: '12px', color: '#94A3B8', fontSize: '0.85rem' }} />
                  <input
                    type="text"
                    placeholder="Filtrar por tipo, marca, modelo, serie o inventario..."
                    value={filtroModalEquipos}
                    onChange={(e) => setFiltroModalEquipos(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem 0.6rem 2.25rem',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      outline: 'none',
                      backgroundColor: '#F8FAFC'
                    }}
                    autoFocus
                  />
                  {filtroModalEquipos && (
                    <button
                      type="button"
                      onClick={() => setFiltroModalEquipos('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Equipos */}
            <div style={{
              padding: '1rem 1.25rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              {buscandoEquipos ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                  <div className="spinner-border spinner-border-sm text-danger" style={{ width: '24px', height: '24px', borderWidth: '3px', marginBottom: '0.75rem' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Consultando inventario tecnológico...</div>
                </div>
              ) : !formData.solicitante?.trim() ? (
                <div style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px dashed #CBD5E1'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💡</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.35rem' }}>
                    Seleccione un solicitante en el Paso 1
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
                    Para desplegar automáticamente los equipos que están a nombre de una persona, elija primero el solicitante en la sección de datos.
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalEquiposAbierto(false)}
                    style={{
                      backgroundColor: '#691B31',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 1.25rem',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer'
                    }}
                  >
                    Entendido, ir al Paso 1
                  </button>
                </div>
              ) : opcionesEquipos.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px dashed #CBD5E1'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.35rem' }}>
                    Sin equipos registrados
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
                    No se encontraron equipos o periféricos asignados a <strong>{formData.solicitante}</strong> en el inventario tecnológico. Puede escribir el número de inventario o serie directamente en el formulario.
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalEquiposAbierto(false)}
                    style={{
                      backgroundColor: '#691B31',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 1.25rem',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ingresar datos manualmente
                  </button>
                </div>
              ) : equiposFiltradosModal.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                  No se encontraron coincidencias para "{filtroModalEquipos}".
                </div>
              ) : (
                equiposFiltradosModal.map((op) => {
                  const estaSeleccionado = op.key === equipoSeleccionadoKey
                  return (
                    <div
                      key={op.key}
                      onClick={() => seleccionarDesdeModal(op.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        border: estaSeleccionado ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                        backgroundColor: estaSeleccionado ? '#F0FDF4' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        gap: '0.75rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                      onMouseEnter={(e) => {
                        if (!estaSeleccionado) {
                          e.currentTarget.style.backgroundColor = '#F8FAFC'
                          e.currentTarget.style.borderColor = '#CBD5E1'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!estaSeleccionado) {
                          e.currentTarget.style.backgroundColor = 'white'
                          e.currentTarget.style.borderColor = '#E2E8F0'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: op.esComponente ? '#EEF2FF' : '#FDF2F8',
                          color: op.esComponente ? '#4F46E5' : '#691B31',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0
                        }}>
                          {getIconoEquipo(op.tipo)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1E293B' }}>
                              {op.nombre}
                            </span>
                            {op.esComponente && (
                              <span style={{
                                fontSize: '0.675rem',
                                fontWeight: '700',
                                backgroundColor: '#EEF2FF',
                                color: '#4F46E5',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px'
                              }}>
                                Periférico
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.775rem', color: '#64748B', flexWrap: 'wrap' }}>
                            <span><strong>No. Inv:</strong> {op.numeroInventario || 'Sin inventario'}</span>
                            <span>•</span>
                            <span><strong>Serie:</strong> {op.numeroSerie || 'Sin serie'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          padding: '0.45rem 0.85rem',
                          backgroundColor: estaSeleccionado ? '#10B981' : '#691B31',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.775rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {estaSeleccionado ? <><FaCheckCircle size={11} /> Seleccionado</> : 'Elegir'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Pie del Modal */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <span style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: '600' }}>
                {opcionesEquipos.length > 0 ? `${equiposFiltradosModal.length} de ${opcionesEquipos.length} equipo(s)` : '0 equipos'}
              </span>
              <button
                type="button"
                onClick={() => setModalEquiposAbierto(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}