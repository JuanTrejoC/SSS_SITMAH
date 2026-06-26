import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'

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

  const [listaAreas, setListaAreas] = useState([
    { id: 1, nombre: "Dirección de Operación" },
    { id: 2, nombre: "Dirección General" },
    { id: 3, nombre: "Dirección Jurídica" },
    { id: 4, nombre: "Dirección de Administración y Finanzas" },
    { id: 5, nombre: "Dirección de Planeación y Desarrollo" }
  ])
  const listaCargos = [
    "Técnico Especializado", "Asesor Técnico Gestor", "Jefatura de Área",
    "Subdirección de Área", "Subdirección Adjunta", "Dirección de Área",
    "Jefatura de Departamento", "Subdirector De Área", "Asistente General", "Dirección General"
  ]
  const [listaSedes, setListaSedes] = useState([
    { id: 1, nombre: "Centro de Control" },
    { id: 2, nombre: "CETRAM Téllez" }
  ])
  const [listaCategorias, setListaCategorias] = useState([
    { id: 1, nombre: 'Equipo no enciende' },
    { id: 2, nombre: 'Equipo lento o se traba' },
    { id: 3, nombre: 'Pantalla sin imagen o con fallas' },
    { id: 4, nombre: 'Teclado o mouse no funcionan' },
    { id: 5, nombre: 'Batería de portátil no carga' },
    { id: 6, nombre: 'Impresora no imprime o atasca papel' },
    { id: 7, nombre: 'Impresora no se comunica con el equipo' },
    { id: 8, nombre: 'Escáner no funciona' },
    { id: 9, nombre: 'Sin conexión a internet' },
    { id: 10, nombre: 'Conexión lenta o intermitente' },
    { id: 11, nombre: 'Sin acceso a red local' },
    { id: 12, nombre: 'Puerto o cable de red dañado' },
    { id: 13, nombre: 'Regulador / No-Break no funciona' },
    { id: 14, nombre: 'No-Break descarga rápido' },
    { id: 15, nombre: 'Toma de corriente dañada' },
    { id: 16, nombre: 'Programa no abre o se cierra solo' },
    { id: 17, nombre: 'Archivos no se pueden abrir' },
    { id: 18, nombre: 'Problemas de acceso o contraseña' },
    { id: 19, nombre: 'Sistema operativo con errores' },
    { id: 20, nombre: 'Otro ' }
  ])

  // Cargar catálogos desde el backend al montar el componente
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const resAreas = await fetch('http://localhost:3000/api/catalogos/areas')
        if (resAreas.ok) {
          const json = await resAreas.json()
          if (json.ok && json.data && json.data.length > 0) setListaAreas(json.data)
        }
        const resSedes = await fetch('http://localhost:3000/api/catalogos/sedes')
        if (resSedes.ok) {
          const json = await resSedes.json()
          if (json.ok && json.data && json.data.length > 0) setListaSedes(json.data)
        }
        const resCategorias = await fetch('http://localhost:3000/api/catalogos/categorias')
        if (resCategorias.ok) {
          const json = await resCategorias.json()
          if (json.ok && json.data && json.data.length > 0) setListaCategorias(json.data)
        }
      } catch (err) {
        console.error('Error al cargar catálogos:', err)
      }
    }
    cargarCatalogos()
  }, [])

  // ✅ MEJORADO: Solo letras, espacios, acentos. Mínimo 3 caracteres, máximo 100
  const soloLetras = (texto) => {
    return texto.replace(/[^A-Za-zÁáÉéÍíÓóÚúÑñ\s]/g, '').substring(0, 100)
  }

  const validarCampo = (nombre, valor) => {
    let mensajeError = ''
    let esValido = false
    valor = valor?.trim() || ''

    switch (nombre) {
      case 'solicitante':
        // ✅ VALIDACIÓN ESTRICTA: NOMBRE
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
        // ✅ VALIDACIÓN CORREO 100% CORRECTA
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
      datosAEnviar.append('cargo', formData.cargo) // ✅ TEXTO, NO NÚMERO
      datosAEnviar.append('email', formData.email)
      datosAEnviar.append('telefono', formData.telefono)
      datosAEnviar.append('sede_id', Number(formData.sede_id))
      datosAEnviar.append('equipo', formData.equipo)
      datosAEnviar.append('categoria_id', Number(formData.categoria_id))
      datosAEnviar.append('prioridad', formData.prioridad.toLowerCase())
      datosAEnviar.append('descripcion', descripcionFinal)
      datosAEnviar.append('usuario_remitente', usuarioActual || 'General')
      datosAEnviar.append('estado', formData.estado) // ✅ GUARDA ESTADO
      datosAEnviar.append('tipo_usuario', formData.tipo_usuario) // ✅ PARA QUE LO VEA ADMIN

      if (formData.evidencia) {
        datosAEnviar.append('evidencia', formData.evidencia)
      }

      const respuesta = await fetch('http://localhost:3000/api/reportes/oficina', {
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

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgb(0, 0, 0)', padding: '2.5rem' }}>
        <h2 style={{ color: '#BC955B', fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid #9B9B9A' }}>
          Datos del Solicitante
        </h2>

        {/* FILA 1 */}
        <div className="form-responsive-grid grid-4" style={{ marginBottom: '1.2rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Nombre Completo</label>
            <input
              type="text"
              placeholder="Ingrese nombre completo"
              value={formData.solicitante}
              onChange={(e) => {
                const valor = soloLetras(e.target.value)
                setFormData({ ...formData, solicitante: valor })
                validarCampo('solicitante', valor)
              }}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.solicitante === true ? '#22c55e' : valido.solicitante === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem' }}
            />
            {errores.solicitante && <small style={{ color: '#ef4444' }}>{errores.solicitante}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#1f2937', display: 'block', marginBottom: '0.4rem' }}>Área</label>
            <select
              value={formData.area_id}
              onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, area_id: valor }); validarCampo('area_id', valor) }}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.area_id === true ? '#22c55e' : valido.area_id === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
            >
              <option value="">Seleccione área</option>
              {listaAreas.map((a, i) => <option key={i} value={a.id}>{a.nombre}</option>)}
            </select>
            {errores.area_id && <small style={{ color: '#ef4444' }}>{errores.area_id}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Cargo</label>
            <select
              value={formData.cargo}
              onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, cargo: valor }); validarCampo('cargo', valor) }}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.cargo === true ? '#22c55e' : valido.cargo === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
            >
              <option value="">Seleccione cargo</option>
              {listaCargos.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
            {errores.cargo && <small style={{ color: '#ef4444' }}>{errores.cargo}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#1f2937', display: 'block', marginBottom: '0.4rem' }}>Correo Electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, email: valor }); validarCampo('email', valor) }}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.email === true ? '#22c55e' : valido.email === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem' }}
            />
            {errores.email && <small style={{ color: '#ef4444' }}>{errores.email}</small>}
          </div>
        </div>

        {/* FILA 2 */}
        <div className="form-responsive-grid grid-3" style={{ marginBottom: '2rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Teléfono</label>
            <input
              type="tel"
              placeholder="7711234567"
              value={formData.telefono}
              onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, telefono: valor }); validarCampo('telefono', valor) }}
              maxLength={10}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.telefono === true ? '#22c55e' : valido.telefono === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem' }}
            />
            {errores.telefono && <small style={{ color: '#ef4444' }}>{errores.telefono}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Sede / Edificio</label>
            <select
              value={formData.sede_id}
              onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, sede_id: valor }); validarCampo('sede_id', valor) }}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.sede_id === true ? '#22c55e' : valido.sede_id === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
            >
              <option value="">Seleccione sede</option>
              {listaSedes.map((s, i) => <option key={i} value={s.id}>{s.nombre}</option>)}
            </select>
            {errores.sede_id && <small style={{ color: '#ef4444' }}>{errores.sede_id}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Equipo Relacionado</label>
            <input
              type="text"
              placeholder="Ej. PC-CCO-02"
              value={formData.equipo}
              onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, equipo: valor }); validarCampo('equipo', valor) }}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.equipo === true ? '#22c55e' : valido.equipo === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem' }}
            />
            {errores.equipo && <small style={{ color: '#ef4444' }}>{errores.equipo}</small>}
          </div>
        </div>

        <h2 style={{ color: '#BC955B', fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid #9B9B9A' }}>
          Detalles de la Incidencia
        </h2>

        {/* FILA 3: Categoría + Prioridad */}
        <div className="form-responsive-grid grid-2" style={{ marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Categoría de Falla</label>
            <select
              value={formData.categoria_id}
              onChange={(e) => {
                const valor = e.target.value
                setFormData({ ...formData, categoria_id: valor, descripcion_otro: '' })
                const selectedCat = listaCategorias.find(c => String(c.id) === String(valor))
                setMostrarOtro(selectedCat?.nombre?.toLowerCase().includes('otro') || false)
                validarCampo('categoria_id', valor)
              }}
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: `1px solid ${valido.categoria_id === true ? '#22c55e' : valido.categoria_id === false ? '#ef4444' : '#9B9B9A'}`, borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'white' }}
            >
              <option value="">Seleccione una opción</option>
              {listaCategorias.map((c, i) => <option key={i} value={c.id}>{c.nombre}</option>)}
            </select>

            {mostrarOtro && (
              <div style={{ marginTop: '0.8rem' }}>
                <input
                  type="text"
                  placeholder="Especifique qué falla es..."
                  value={formData.descripcion_otro}
                  onChange={(e) => {
                    const v = soloLetras(e.target.value)
                    setFormData({ ...formData, descripcion_otro: v })
                    validarCampo('descripcion_otro', v)
                  }}
                  style={{ width: '100%', padding: '0.5rem', border: `1px solid ${errores.descripcion_otro ? '#ef4444' : '#9B9B9A'}`, borderRadius: '6px' }}
                />
                {errores.descripcion_otro && <small style={{ color: '#ef4444' }}>{errores.descripcion_otro}</small>}
              </div>
            )}
            {errores.categoria_id && <small style={{ color: '#ef4444' }}>{errores.categoria_id}</small>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#1f2937', display: 'block', marginBottom: '0.4rem' }}>Prioridad</label>
            <select
              value={formData.prioridad}
              onChange={(e) => { const valor = e.target.value; setFormData({ ...formData, prioridad: valor }); validarCampo('prioridad', valor) }}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                border: `1px solid ${valido.prioridad === true ? '#22c55e' : valido.prioridad === false ? '#ef4444' : '#9B9B9A'}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                backgroundColor: formData.prioridad ? (
                  formData.prioridad === 'Baja' ? '#fef08a' :
                    formData.prioridad === 'Media' ? '#fdba74' :
                      formData.prioridad === 'Alta' ? '#fca5a5' : 'white'
                ) : 'white',
                color: formData.prioridad ? (
                  formData.prioridad === 'Baja' ? '#854d0e' :
                    formData.prioridad === 'Media' ? '#92400e' :
                      formData.prioridad === 'Alta' ? '#991b1b' : 'inherit'
                ) : 'inherit',
                fontWeight: '600'
              }}
            >
              <option value="" style={{ backgroundColor: 'white', color: '#000000' }}>Seleccione prioridad</option>
              <option value="Baja" style={{ backgroundColor: '#fef08a', color: '#854d0e' }}>Baja</option>
              <option value="Media" style={{ backgroundColor: '#fdba74', color: '#92400e' }}>Media</option>
              <option value="Alta" style={{ backgroundColor: '#fca5a5', color: '#991b1b' }}>Alta</option>
            </select>
            {errores.prioridad && <small style={{ color: '#ef4444' }}>{errores.prioridad}</small>}
          </div>
        </div>

        {/* DESCRIPCIÓN OPCIONAL */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Descripción detallada del problema <small style={{ fontWeight: 'normal', color: '#6F7271' }}>(Opcional)</small></label>
          <textarea
            placeholder="Escribe aquí más detalles..."
            value={formData.descripcion}
            onChange={(e) => {
              const v = soloLetras(e.target.value)
              setFormData({ ...formData, descripcion: v })
            }}
            style={{ width: '100%', minHeight: '100px', padding: '0.8rem', border: '1px solid #9B9B9A', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical' }}
          ></textarea>
        </div>

        {/* EVIDENCIA */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#000000', display: 'block', marginBottom: '0.4rem' }}>Evidencia Fotográfica (Solo imágenes)</label>
          <div style={{ border: '1px solid #9B9B9A', borderRadius: '8px', padding: '0.65rem', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
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

        {/* BOTONES */}
        <div className="form-responsive-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 2rem', backgroundColor: '#9B9B9A', color: '#ffffffff', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            style={{ padding: '0.75rem 2rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
            disabled={cargando}
          >
            {cargando ? 'Enviando...' : 'Enviar Reporte Técnico'}
          </button>
        </div>
      </div>
    </div>
  )
}