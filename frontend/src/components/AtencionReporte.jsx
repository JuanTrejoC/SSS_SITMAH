// src/components/AtencionReporte.jsx
import { useState, useRef, useEffect } from 'react'
import Swal from 'sweetalert2'
import { FaCheckCircle, FaCamera, FaSignature, FaTrash, FaCalendarAlt, FaUserCheck, FaTools, FaEdit, FaLock, FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function AtencionReporte({ reporte, tipo, user: propUser, onActualizado, apiBaseUrl }) {
  const { user: contextUser } = useAuth() || {}
  const currentUser = propUser || contextUser

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const [dibujando, setDibujando] = useState(false)
  const [hayFirma, setHayFirma] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [modoEdicionResuelto, setModoEdicionResuelto] = useState(false)
  const [cambiarFirma, setCambiarFirma] = useState(false)

  const obtenerFechaHoy = () => new Date().toISOString().slice(0, 10)
  const obtenerNombreSesion = () => currentUser?.nombre || currentUser?.username || ''

  const [datosCierre, setDatosCierre] = useState({
    tecnicoAtendio: reporte?.tecnicoAtendio || obtenerNombreSesion(),
    fechaAtencion: reporte?.fechaResolucion ? new Date(reporte.fechaResolucion).toISOString().slice(0, 10) : obtenerFechaHoy(),
    diagnostico: reporte?.diagnosticoSolucion || '',
    descripcion: reporte?.descripcion || '',
    evidenciasSolucion: []
  })
  const [vistasPreviasEvidencia, setVistasPreviasEvidencia] = useState([])

  // Sincronizar campos cuando cambia el reporte o el usuario
  useEffect(() => {
    setDatosCierre({
      tecnicoAtendio: reporte?.tecnicoAtendio || obtenerNombreSesion(),
      fechaAtencion: reporte?.fechaResolucion ? new Date(reporte.fechaResolucion).toISOString().slice(0, 10) : obtenerFechaHoy(),
      diagnostico: reporte?.diagnosticoSolucion || '',
      descripcion: reporte?.descripcion || '',
      evidenciasSolucion: []
    })
    vistasPreviasEvidencia.forEach(vp => {
      if (vp.url) URL.revokeObjectURL(vp.url)
    })
    setVistasPreviasEvidencia([])
    setHayFirma(false)
    setModoEdicionResuelto(false)
    setCambiarFirma(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [reporte?.id, currentUser?.nombre, currentUser?.username])

  // Inicializar canvas de firma
  useEffect(() => {
    if (reporte.estado !== 'resuelto' || (modoEdicionResuelto && cambiarFirma)) {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.strokeStyle = '#1E293B'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [reporte.estado, reporte.id, modoEdicionResuelto, cambiarFirma])

  // Métodos de dibujo en Canvas (Mouse y Touch)
  const getCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const iniciarDibujo = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDibujando(true)
  }

  const dibujar = (e) => {
    if (!dibujando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHayFirma(true)
  }

  const terminarDibujo = () => {
    if (!dibujando) return
    const canvas = canvasRef.current
    if (canvas) {
      ctx = canvas.getContext('2d')
      ctx.closePath()
    }
    setDibujando(false)
  }

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHayFirma(false)
    }
  }

  // Manejo de nuevas fotos de evidencia de solución
  const MAX_FOTOS = tipo === 'oficina' ? 3 : 10

  const manejarFotosSolucion = (e) => {
    const archivos = Array.from(e.target.files || [])
    if (archivos.length === 0) return

    const espacioDisponible = MAX_FOTOS - (datosCierre.evidenciasSolucion?.length || 0)
    if (espacioDisponible <= 0) {
      Swal.fire('Límite alcanzado', `Solo se permite un máximo de ${MAX_FOTOS} fotografías como evidencia.`, 'warning')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    let archivosAProcesar = archivos
    if (archivos.length > espacioDisponible) {
      Swal.fire(
        'Límite de fotos',
        `Solo puedes agregar ${espacioDisponible} foto(s) más (máximo ${MAX_FOTOS} en total). Se tomarán solo las primeras ${espacioDisponible}.`,
        'info'
      )
      archivosAProcesar = archivos.slice(0, espacioDisponible)
    }

    const archivosValidos = []
    for (const file of archivosAProcesar) {
      if (!file.type.startsWith('image/')) {
        Swal.fire('Formato no válido', `El archivo "${file.name}" no es una imagen válida (JPG, PNG, WEBP).`, 'error')
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('Tamaño excedido', `La imagen "${file.name}" supera el límite de 10 MB.`, 'error')
        continue
      }
      archivosValidos.push(file)
    }

    if (archivosValidos.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const nuevasVistas = archivosValidos.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2)
    }))

    setDatosCierre(prev => ({
      ...prev,
      evidenciasSolucion: [...(prev.evidenciasSolucion || []), ...archivosValidos]
    }))
    setVistasPreviasEvidencia(prev => [...prev, ...nuevasVistas])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const eliminarFotoSolucion = (index) => {
    setDatosCierre(prev => {
      const nuevas = [...(prev.evidenciasSolucion || [])]
      nuevas.splice(index, 1)
      return { ...prev, evidenciasSolucion: nuevas }
    })

    setVistasPreviasEvidencia(prev => {
      const nuevas = [...prev]
      if (nuevas[index]?.url) {
        URL.revokeObjectURL(nuevas[index].url)
      }
      nuevas.splice(index, 1)
      return nuevas
    })
  }

  const eliminarTodasFotosSolucion = () => {
    vistasPreviasEvidencia.forEach(vp => {
      if (vp.url) URL.revokeObjectURL(vp.url)
    })
    setVistasPreviasEvidencia([])
    setDatosCierre(prev => ({ ...prev, evidenciasSolucion: [] }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Guardar y resolver el reporte por primera vez
  const resolverReporte = async () => {
    // 1. Validar que exista al menos una evidencia
    const tieneEvidenciaPrevia = reporte.evidencias && reporte.evidencias.length > 0
    const tieneNuevaEvidencia = datosCierre.evidenciasSolucion && datosCierre.evidenciasSolucion.length > 0

    if (!tieneEvidenciaPrevia && !tieneNuevaEvidencia) {
      Swal.fire({
        title: 'Evidencia Fotográfica Requerida',
        text: 'Para cerrar y resolver el reporte es obligatorio adjuntar al menos una fotografía de la atención/solución.',
        icon: 'warning',
        confirmButtonColor: '#BC955B'
      })
      return
    }

    // 2. Validar nombre de quien atendió
    if (!datosCierre.tecnicoAtendio.trim()) {
      Swal.fire({
        title: 'Campo obligatorio',
        text: 'Por favor indique quién atendió el reporte.',
        icon: 'warning',
        confirmButtonColor: '#BC955B'
      })
      return
    }

    // 3. Validar firma de satisfacción
    if (!hayFirma && !reporte.firmaSatisfaccion) {
      Swal.fire({
        title: 'Firma Requerida',
        text: 'Por favor capture la firma de satisfacción del solicitante en el recuadro.',
        icon: 'warning',
        confirmButtonColor: '#BC955B'
      })
      return
    }

    // Confirmación con SweetAlert
    const confirm = await Swal.fire({
      title: '¿Finalizar y cerrar reporte?',
      text: 'El reporte pasará a estado Resuelto con la evidencia y firma registradas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, finalizar reporte',
      cancelButtonText: 'Cancelar'
    })

    if (!confirm.isConfirmed) return

    setGuardando(true)

    try {
      let firmaBase64 = reporte.firmaSatisfaccion || null
      if (canvasRef.current && hayFirma) {
        firmaBase64 = canvasRef.current.toDataURL('image/png')
      }

      const formData = new FormData()
      formData.append('estado', 'resuelto')
      formData.append('tecnico_atendio', datosCierre.tecnicoAtendio.trim())
      formData.append('fecha_resolucion', `${datosCierre.fechaAtencion} 12:00:00`)
      formData.append('diagnostico_solucion', datosCierre.diagnostico.trim() || 'Reporte resuelto satisfactoriamente.')
      formData.append('comentario', datosCierre.diagnostico.trim() || 'Reporte finalizado y resuelto')
      if (firmaBase64) {
        formData.append('firma_satisfaccion', firmaBase64)
      }

      if (datosCierre.evidenciasSolucion && datosCierre.evidenciasSolucion.length > 0) {
        datosCierre.evidenciasSolucion.forEach((arch) => {
          formData.append('evidencia', arch)
        })
      }

      const endpoint = tipo === 'oficina'
        ? `${apiBaseUrl}/api/admin/reportes/oficina/${reporte.id}/estado`
        : `${apiBaseUrl}/api/admin/reportes/semaforo/${reporte.id}/estado`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: formData
      })

      const json = await res.json()

      if (res.ok && json.ok) {
        Swal.fire('¡Reporte Resuelto!', 'La atención, evidencia y firma han sido registradas exitosamente.', 'success')
        if (onActualizado) {
          onActualizado(json.data)
        }
      } else {
        Swal.fire('Error', json.error || 'No se pudo cerrar el reporte.', 'error')
      }
    } catch (err) {
      console.error('Error al resolver reporte:', err)
      Swal.fire('Error de red', 'No se pudo conectar con el servidor para cerrar el reporte.', 'error')
    } finally {
      setGuardando(false)
    }
  }

  // Guardar Modificación Única de un Reporte Resuelto
  const guardarModificacionResuelto = async () => {
    if (!datosCierre.tecnicoAtendio.trim()) {
      Swal.fire('Campo obligatorio', 'Por favor indique quién atendió el reporte.', 'warning')
      return
    }

    const confirm = await Swal.fire({
      title: '¿Guardar modificaciones del reporte?',
      html: '<p><strong>¡Atención!</strong> Esta modificación solo se puede realizar <strong>una sola vez</strong>.</p><p style="color:#DC2626;font-size:0.875rem;margin-top:0.5rem;">Una vez guardados los cambios, este reporte quedará bloqueado y no podrá volver a editarse jamás.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#691B31',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, guardar cambios (Única vez)',
      cancelButtonText: 'Cancelar'
    })

    if (!confirm.isConfirmed) return

    setGuardando(true)

    try {
      let firmaBase64 = null
      if (cambiarFirma && canvasRef.current && hayFirma) {
        firmaBase64 = canvasRef.current.toDataURL('image/png')
      }

      const formData = new FormData()
      formData.append('tecnico_atendio', datosCierre.tecnicoAtendio.trim())
      formData.append('fecha_resolucion', `${datosCierre.fechaAtencion} 12:00:00`)
      formData.append('diagnostico_solucion', datosCierre.diagnostico.trim() || 'Reporte resuelto satisfactoriamente.')
      if (datosCierre.descripcion) {
        formData.append('descripcion', datosCierre.descripcion.trim())
      }
      if (firmaBase64) {
        formData.append('firma_satisfaccion', firmaBase64)
      }

      if (datosCierre.evidenciasSolucion && datosCierre.evidenciasSolucion.length > 0) {
        datosCierre.evidenciasSolucion.forEach((arch) => {
          formData.append('evidencia', arch)
        })
      }

      const endpoint = tipo === 'oficina'
        ? `${apiBaseUrl}/api/admin/reportes/oficina/${reporte.id}/modificar-resuelto`
        : `${apiBaseUrl}/api/admin/reportes/semaforo/${reporte.id}/modificar-resuelto`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: formData
      })

      const json = await res.json()

      if (res.ok && json.ok) {
        Swal.fire('¡Reporte Modificado!', 'Los cambios han sido guardados exitosamente. Este reporte ha consumido su única modificación permitida.', 'success')
        setModoEdicionResuelto(false)
        setCambiarFirma(false)
        if (onActualizado) {
          onActualizado(json.data)
        }
      } else {
        Swal.fire('Error', json.error || 'No se pudo modificar el reporte.', 'error')
      }
    } catch (err) {
      console.error('Error al modificar reporte resuelto:', err)
      Swal.fire('Error de red', 'No se pudo conectar con el servidor para modificar el reporte.', 'error')
    } finally {
      setGuardando(false)
    }
  }

  // ==========================================
  // RENDER: CUANDO EL REPORTE YA ESTÁ RESUELTO
  // ==========================================
  if (reporte.estado === 'resuelto') {
    // Filtrar la(s) foto(s) de solución del técnico
    const evidenciasSolucion = reporte.evidencias?.filter(e => e.tipo === 'solucion') || []
    const fotosSolucion = (evidenciasSolucion.length === 0 && reporte.evidencias && reporte.evidencias.length > 1)
      ? [reporte.evidencias[reporte.evidencias.length - 1]]
      : evidenciasSolucion

    const yaFueModificado = reporte.modificado || (reporte.vecesModificado && reporte.vecesModificado >= 1)

    // MODO EDICIÓN ÚNICA DEL REPORTE RESUELTO
    if (modoEdicionResuelto) {
      return (
        <div style={{ marginTop: '1.5rem', borderTop: '2px solid #BC955B', paddingTop: '1.25rem' }}>
          {/* Banner de advertencia de única modificación */}
          <div style={{ backgroundColor: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#92400E' }}>
            <FaExclamationTriangle size={22} style={{ flexShrink: 0, color: '#D97706' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Modificación Única de Reporte Resuelto</strong>
              <span style={{ fontSize: '0.8rem' }}>
                Solo puedes modificar este reporte <strong>1 sola vez</strong>. Al guardar, los cambios serán definitivos y no se podrá volver a editar.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* CAMPOS: QUIÉN ATENDIÓ Y FECHA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: 0 }}>
                  Quién Atendió <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre de quien atendió"
                  value={datosCierre.tecnicoAtendio}
                  onChange={(e) => setDatosCierre({ ...datosCierre, tecnicoAtendio: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: 0 }}>
                  Fecha de Atención <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="date"
                  value={datosCierre.fechaAtencion}
                  onChange={(e) => setDatosCierre({ ...datosCierre, fechaAtencion: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* OBSERVACIONES / DESCRIPCIÓN DEL REPORTE */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                Observaciones / Descripción del Problema:
              </label>
              <textarea
                value={datosCierre.descripcion}
                onChange={(e) => setDatosCierre({ ...datosCierre, descripcion: e.target.value })}
                placeholder="Observaciones de la falla o solicitud..."
                style={{
                  width: '100%',
                  minHeight: '70px',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* DIAGNÓSTICO O SOLUCIÓN REALIZADA */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                Solución o Diagnóstico Realizado:
              </label>
              <textarea
                placeholder="Describa el trabajo realizado, cambio de piezas, configuración, etc..."
                value={datosCierre.diagnostico}
                onChange={(e) => setDatosCierre({ ...datosCierre, diagnostico: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* AGREGAR FOTOGRAFÍAS ADICIONALES DE SOLUCIÓN */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: 0 }}>
                  Fotografías de Solución (Agregar nuevas fotos si lo requiere):
                </label>
                {fotosSolucion && fotosSolucion.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                    ✓ {fotosSolucion.length} foto(s) ya registrada(s)
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={manejarFotosSolucion}
                style={{ display: 'none' }}
                id={`input-evidencia-modificar-${reporte.id}`}
              />

              {vistasPreviasEvidencia.length === 0 ? (
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '10px', padding: '1rem', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
                  <label
                    htmlFor={`input-evidencia-modificar-${reporte.id}`}
                    style={{
                      backgroundColor: tipo === 'semaforo' ? '#BC955B' : '#691B31',
                      color: 'white',
                      padding: '0.5rem 1.1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <FaCamera /> Subir Fotografía(s) Adicionales
                  </label>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                    Opcional. Se sumarán a las evidencias existentes.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#065F46' }}>
                      ✓ {vistasPreviasEvidencia.length} nueva(s) foto(s) seleccionada(s)
                    </span>
                    <button
                      type="button"
                      onClick={eliminarTodasFotosSolucion}
                      style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      <FaTrash /> Quitar
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.65rem' }}>
                    {vistasPreviasEvidencia.map((item, index) => (
                      <div key={item.id || index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #BC955B' }}>
                        <button
                          type="button"
                          onClick={() => eliminarFotoSolucion(index)}
                          style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', zIndex: 2 }}
                        >
                          ✕
                        </button>
                        <img src={item.url} alt={`Solución ${index + 1}`} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FIRMA DE SATISFACCIÓN */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: 0 }}>
                  Firma de Satisfacción / Conformidad:
                </label>
                {!cambiarFirma && reporte.firmaSatisfaccion && (
                  <button
                    type="button"
                    onClick={() => { setCambiarFirma(true); setHayFirma(false); }}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FaSignature /> Dibujar Nueva Firma
                  </button>
                )}
                {cambiarFirma && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={limpiarFirma}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.775rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      <FaTrash /> Limpiar
                    </button>
                    {reporte.firmaSatisfaccion && (
                      <button
                        type="button"
                        onClick={() => { setCambiarFirma(false); setHayFirma(false); }}
                        style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: '0.775rem', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Conservar Firma Actual
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!cambiarFirma && reporte.firmaSatisfaccion ? (
                <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.5rem', display: 'inline-block', maxWidth: '280px' }}>
                  <img src={reporte.firmaSatisfaccion} alt="Firma actual" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                  <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', textAlign: 'center', marginTop: '0.2rem' }}>Firma actual conservada</span>
                </div>
              ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #D1D5DB', overflow: 'hidden', textAlign: 'center', position: 'relative' }}>
                  <canvas
                    ref={canvasRef}
                    width={540}
                    height={120}
                    onMouseDown={iniciarDibujo}
                    onMouseMove={dibujar}
                    onMouseUp={terminarDibujo}
                    onMouseLeave={terminarDibujo}
                    onTouchStart={iniciarDibujo}
                    onTouchMove={dibujar}
                    onTouchEnd={terminarDibujo}
                    style={{ width: '100%', height: '120px', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                  />
                  {!hayFirma && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', color: '#94A3B8', fontSize: '0.85rem', fontWeight: '500' }}>
                      ✍️ Firme aquí con mouse o dedo
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN EN MODO EDICIÓN */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #E5E7EB' }}>
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  setModoEdicionResuelto(false)
                  setCambiarFirma(false)
                }}
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  border: '1px solid #D1D5DB',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <FaTimes /> Cancelar
              </button>

              <button
                type="button"
                disabled={guardando}
                onClick={guardarModificacionResuelto}
                style={{
                  backgroundColor: '#691B31',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(105, 27, 49, 0.25)'
                }}
              >
                {guardando ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Guardando cambios...
                  </>
                ) : (
                  <>
                    <FaSave /> Guardar Modificación Única
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )
    }

    // MODO VISUALIZACIÓN DE REPORTE RESUELTO (NORMAL)
    return (
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong style={{ fontSize: '0.95rem', color: '#111827' }}>
              Atención y Resolución del Reporte:
            </strong>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: '700', border: '1px solid #A7F3D0' }}>
              ✓ Resuelto
            </span>
            {yaFueModificado && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: '700', border: '1px solid #FCD34D', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <FaLock size={10} /> Modificado (1/1)
              </span>
            )}
          </div>

          {/* BOTÓN PARA MODIFICAR (SOLO SI NO HA SIDO MODIFICADO AÚN) */}
          {!yaFueModificado ? (
            <button
              type="button"
              onClick={() => setModoEdicionResuelto(true)}
              style={{
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1.5px solid #BFDBFE',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              title="Permite modificar este reporte una sola vez"
            >
              <FaEdit size={13} /> Modificar Reporte (1 sola vez)
            </button>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <FaLock size={11} /> Edición única ya utilizada
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.9rem', color: '#374151' }}>
          <div>
            <strong>Quién Atendió:</strong> {reporte.tecnicoAtendio || reporte.atendidoPor?.nombre || reporte.atendidoPor?.username || 'Personal Asignado'}
          </div>

          <div>
            <strong>Fecha de Atención:</strong> {reporte.fechaResolucion ? new Date(reporte.fechaResolucion).toLocaleString('es-MX') : '—'}
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '0.35rem' }}>
            <strong>Solución / Diagnóstico Aplicado:</strong>
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', marginTop: '0.4rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid #E5E7EB', fontSize: '0.875rem' }}>
              {reporte.diagnosticoSolucion || reporte.comentario || 'Reporte concluido con éxito.'}
            </div>
          </div>

          {/* FOTOGRAFÍA DE EVIDENCIA DE SOLUCIÓN (ARRIBA DE LA FIRMA) */}
          {fotosSolucion && fotosSolucion.length > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: '0.65rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#111827' }}>
                Fotografía de Evidencia de Solución:
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                {fotosSolucion.map((ev) => (
                  <div key={ev.id} style={{ 
                    border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', 
                    maxWidth: '200px', backgroundColor: 'white'
                  }}>
                    {ev.mimetype?.startsWith('image/') ? (
                      <a
                        href={`${apiBaseUrl}/api/evidencias/${ev.id}?token=${currentUser?.token}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={`${apiBaseUrl}/api/evidencias/${ev.id}?token=${currentUser?.token}`}
                          alt={ev.filename || 'Evidencia de solución'}
                          style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                        />
                      </a>
                    ) : (
                      <a
                        href={`${apiBaseUrl}/api/evidencias/${ev.id}?token=${currentUser?.token}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '0.5rem', color: '#BC955B', textDecoration: 'none', backgroundColor: '#F8FAFC' }}
                      >
                        <i className="fa-solid fa-file" style={{ fontSize: '2rem' }}></i>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FIRMA DE SATISFACCIÓN (DEBAJO DE LA FOTO) */}
          {reporte.firmaSatisfaccion && (
            <div style={{ gridColumn: '1 / -1', marginTop: '0.65rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#111827' }}>
                Firma de Conformidad / Satisfacción:
              </strong>
              <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.5rem', display: 'inline-block', maxWidth: '300px' }}>
                <img
                  src={reporte.firmaSatisfaccion}
                  alt="Firma de conformidad"
                  style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: CUANDO EL REPORTE ESTÁ EN PROCESO (O ABIERTO) - FORMULARIO DE CIERRE
  // =========================================================================
  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <strong style={{ fontSize: '0.95rem', color: '#111827' }}>
          Atención y Cierre del Reporte:
        </strong>
        <span style={{ fontSize: '0.75rem', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '600', border: '1px solid #E5E7EB' }}>
          Estado: {reporte.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* CAMPOS: QUIÉN ATENDIÓ Y FECHA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', minHeight: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
              <span>Quién Atendió</span>
              <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nombre de quien atendió"
              value={datosCierre.tecnicoAtendio}
              onChange={(e) => setDatosCierre({ ...datosCierre, tecnicoAtendio: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF',
                height: '42px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', minHeight: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
              <span>Fecha de Atención</span>
              <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="date"
              value={datosCierre.fechaAtencion}
              onChange={(e) => setDatosCierre({ ...datosCierre, fechaAtencion: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF',
                height: '42px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* NOTAS / DIAGNÓSTICO DE SOLUCIÓN */}
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
            Solución o Diagnóstico Realizado:
          </label>
          <textarea
            placeholder="Describa el trabajo realizado, cambio de piezas, configuración, etc..."
            value={datosCierre.diagnostico}
            onChange={(e) => setDatosCierre({ ...datosCierre, diagnostico: e.target.value })}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* FOTOGRAFÍA / EVIDENCIA DE SOLUCIÓN */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: 0 }}>
              Fotografía de Evidencia de Solución <span style={{ color: '#DC2626' }}>* (Obligatoria para cerrar{tipo === 'oficina' ? ' — máx. 3 fotos' : ''})</span>
            </label>
            {reporte.evidencias && reporte.evidencias.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                ✓ {reporte.evidencias.length} evidencia(s) previa(s)
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={manejarFotosSolucion}
            style={{ display: 'none' }}
            id={`input-evidencia-solucion-${reporte.id}`}
          />

          {vistasPreviasEvidencia.length === 0 ? (
            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
              <label
                htmlFor={`input-evidencia-solucion-${reporte.id}`}
                style={{
                  backgroundColor: tipo === 'semaforo' ? '#BC955B' : '#691B31',
                  color: 'white',
                  padding: '0.55rem 1.2rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <FaCamera /> Subir Fotografía{tipo === 'semaforo' ? 's' : 's'} de Solución
              </label>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                {tipo === 'oficina'
                  ? 'Formatos JPG, PNG o WEBP (hasta 3 fotografías, máx. 10 MB c/u)'
                  : 'Formatos JPG, PNG o WEBP (puedes subir varias fotografías, máx. 10 MB c/u)'}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              {/* Barra superior de fotos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#065F46', backgroundColor: '#D1FAE5', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                  {tipo === 'oficina'
                    ? `✓ ${vistasPreviasEvidencia.length} de ${MAX_FOTOS} foto(s) de solución`
                    : `✓ ${vistasPreviasEvidencia.length} foto(s) de solución seleccionada(s)`}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {vistasPreviasEvidencia.length < MAX_FOTOS && (
                    <label
                      htmlFor={`input-evidencia-solucion-${reporte.id}`}
                      style={{
                        backgroundColor: tipo === 'semaforo' ? '#BC955B' : '#691B31',
                        color: 'white',
                        padding: '0.3rem 0.7rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      + Agregar más
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={eliminarTodasFotosSolucion}
                    style={{
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      border: '1px solid #FCA5A5',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <FaTrash /> Quitar todas
                  </button>
                </div>
              </div>

              {/* Cuadrícula de fotos */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: '0.65rem'
                }}
              >
                {vistasPreviasEvidencia.map((item, index) => (
                  <div
                    key={item.id || index}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1.5px solid #BC955B',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      backgroundColor: 'white'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        zIndex: 2
                      }}
                    >
                      #{index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => eliminarFotoSolucion(index)}
                      title="Eliminar foto"
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 2
                      }}
                    >
                      ✕
                    </button>

                    <img
                      src={item.url}
                      alt={`Solución ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '90px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />

                    <div style={{ padding: '0.2rem 0.35rem', fontSize: '0.65rem', color: '#64748B', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name || `Foto ${index + 1}`} ({item.size} MB)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FIRMA DIGITAL DE SATISFACCIÓN */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: 0 }}>
              Firma de Satisfacción / Conformidad <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <button
              type="button"
              onClick={limpiarFirma}
              style={{
                background: 'none',
                border: 'none',
                color: '#DC2626',
                fontSize: '0.775rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <FaTrash /> Limpiar Firma
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #D1D5DB', overflow: 'hidden', textAlign: 'center', position: 'relative' }}>
            <canvas
              ref={canvasRef}
              width={540}
              height={130}
              onMouseDown={iniciarDibujo}
              onMouseMove={dibujar}
              onMouseUp={terminarDibujo}
              onMouseLeave={terminarDibujo}
              onTouchStart={iniciarDibujo}
              onTouchMove={dibujar}
              onTouchEnd={terminarDibujo}
              style={{
                width: '100%',
                height: '130px',
                cursor: 'crosshair',
                touchAction: 'none',
                display: 'block'
              }}
            />
            {!hayFirma && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', color: '#94A3B8', fontSize: '0.85rem', fontWeight: '500' }}>
                ✍️ Firme aquí con mouse o dedo
              </div>
            )}
          </div>
        </div>

        {/* BOTÓN DE CIERRE DEFINITIVO */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            disabled={guardando}
            onClick={resolverReporte}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
            }}
          >
            {guardando ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Guardando y Cerrando...
              </>
            ) : (
              <>
                <FaCheckCircle /> Cerrar Reporte como Resuelto
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
