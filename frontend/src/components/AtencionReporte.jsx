// src/components/AtencionReporte.jsx
import { useState, useRef, useEffect } from 'react'
import Swal from 'sweetalert2'
import { FaCheckCircle, FaCamera, FaSignature, FaTrash, FaCalendarAlt, FaUserCheck, FaTools } from 'react-icons/fa'

export default function AtencionReporte({ reporte, tipo, user, onActualizado, apiBaseUrl }) {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const [dibujando, setDibujando] = useState(false)
  const [hayFirma, setHayFirma] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const obtenerFechaHoy = () => new Date().toISOString().slice(0, 10)

  const [datosCierre, setDatosCierre] = useState({
    tecnicoAtendio: reporte?.tecnicoAtendio || '',
    fechaAtencion: obtenerFechaHoy(),
    diagnostico: reporte?.diagnosticoSolucion || '',
    evidenciaSolucion: null
  })
  const [vistaPreviaEvidencia, setVistaPreviaEvidencia] = useState(null)

  // Sincronizar campos cuando cambia el reporte
  useEffect(() => {
    setDatosCierre({
      tecnicoAtendio: reporte?.tecnicoAtendio || '',
      fechaAtencion: obtenerFechaHoy(),
      diagnostico: reporte?.diagnosticoSolucion || '',
      evidenciaSolucion: null
    })
    setVistaPreviaEvidencia(null)
    setHayFirma(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [reporte?.id])

  // Inicializar canvas de firma
  useEffect(() => {
    if (reporte.estado !== 'resuelto') {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.strokeStyle = '#1E293B'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [reporte.estado, reporte.id])

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
      const ctx = canvas.getContext('2d')
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

  // Manejo de nueva foto de evidencia
  const manejarFotoSolucion = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      Swal.fire('Formato no válido', 'Por favor selecciona un archivo de imagen (JPG, PNG, WEBP)', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire('Tamaño excedido', 'La imagen no debe superar los 10 MB', 'error')
      return
    }

    setDatosCierre(prev => ({ ...prev, evidenciaSolucion: file }))
    setVistaPreviaEvidencia(URL.createObjectURL(file))
  }

  const eliminarFotoSolucion = () => {
    setDatosCierre(prev => ({ ...prev, evidenciaSolucion: null }))
    if (vistaPreviaEvidencia) {
      URL.revokeObjectURL(vistaPreviaEvidencia)
      setVistaPreviaEvidencia(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Guardar y resolver el reporte
  const resolverReporte = async () => {
    // 1. Validar que exista al menos una evidencia
    const tieneEvidenciaPrevia = reporte.evidencias && reporte.evidencias.length > 0
    const tieneNuevaEvidencia = !!datosCierre.evidenciaSolucion

    if (!tieneEvidenciaPrevia && !tieneNuevaEvidencia) {
      Swal.fire({
        title: 'Evidencia Fotográfica Requerida',
        text: 'Para cerrar y resolver el reporte es obligatorio adjuntar la fotografía de la atención/solución.',
        icon: 'warning',
        confirmButtonColor: '#BC955B'
      })
      return
    }

    // 2. Validar nombre de quien atendió
    if (!datosCierre.tecnicoAtendio.trim()) {
      Swal.fire({
        title: 'Campo obligatorio',
        text: 'Por favor indique el nombre de la persona o técnico que atendió el reporte.',
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

      if (datosCierre.evidenciaSolucion) {
        formData.append('evidencia', datosCierre.evidenciaSolucion)
      }

      const endpoint = tipo === 'oficina'
        ? `${apiBaseUrl}/api/admin/reportes/oficina/${reporte.id}/estado`
        : `${apiBaseUrl}/api/admin/reportes/semaforo/${reporte.id}/estado`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`
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

  // ==========================================
  // RENDER: CUANDO EL REPORTE YA ESTÁ RESUELTO
  // ==========================================
  if (reporte.estado === 'resuelto') {
    return (
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <strong style={{ fontSize: '0.95rem', color: '#111827' }}>
            Atención y Resolución del Reporte:
          </strong>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: '700', border: '1px solid #A7F3D0' }}>
            ✓ Resuelto
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.9rem', color: '#374151' }}>
          <div>
            <strong>Quién Atendió:</strong> {reporte.tecnicoAtendio || reporte.atendidoPor?.nombre || reporte.atendidoPor?.username || 'Técnico Asignado'}
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

          {/* FIRMA DE SATISFACCIÓN */}
          {reporte.firmaSatisfaccion && (
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
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
              <span>Quién Atendió (Técnico / Responsable)</span>
              <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nombre del técnico o responsable"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: 0 }}>
              Fotografía de Evidencia de Solución <span style={{ color: '#DC2626' }}>* (Obligatoria para cerrar)</span>
            </label>
            {reporte.evidencias && reporte.evidencias.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                ✓ {reporte.evidencias.length} evidencia(s) previa(s)
              </span>
            )}
          </div>

          {!vistaPreviaEvidencia ? (
            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '10px', padding: '1.25rem', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={manejarFotoSolucion}
                style={{ display: 'none' }}
                id={`input-evidencia-solucion-${reporte.id}`}
              />
              <label
                htmlFor={`input-evidencia-solucion-${reporte.id}`}
                style={{
                  backgroundColor: tipo === 'semaforo' ? '#BC955B' : '#691B31',
                  color: 'white',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <FaCamera /> Subir Fotografía de Solución
              </label>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                JPG, PNG o WEBP (máx. 10 MB)
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <img
                src={vistaPreviaEvidencia}
                alt="Vista previa solución"
                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1E293B', display: 'block' }}>
                  {datosCierre.evidenciaSolucion?.name || 'Fotografía seleccionada'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                  ✓ Lista para adjuntarse al cierre
                </span>
              </div>
              <button
                type="button"
                onClick={eliminarFotoSolucion}
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <FaTrash /> Quitar
              </button>
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
