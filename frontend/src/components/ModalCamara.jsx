import { useState, useRef, useEffect } from 'react'
import { FaCamera, FaTimes, FaSyncAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

export default function ModalCamara({
  isOpen,
  onClose,
  onFotoCapturada,
  onFallbackNativo,
  titulo = 'Tomar Evidencia Fotográfica'
}) {
  const videoRef = useRef(null)
  const [streamCamara, setStreamCamara] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' (trasera) o 'user' (frontal)
  const [fotoCapturada, setFotoCapturada] = useState(null)
  const [cargandoCamara, setCargandoCamara] = useState(false)
  const [errorCamara, setErrorCamara] = useState('')

  // Control del ciclo de vida de la cámara
  useEffect(() => {
    let streamActivo = null

    if (isOpen && !fotoCapturada) {
      setCargandoCamara(true)
      setErrorCamara('')

      if (!navigator.mediaDevices?.getUserMedia) {
        setCargandoCamara(false)
        setErrorCamara('Tu navegador no soporta el visor directo de cámara. Puedes usar la cámara nativa de tu dispositivo.')
        return
      }

      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      .then((stream) => {
        streamActivo = stream
        setStreamCamara(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.warn('Video play warning:', e))
        }
        setCargandoCamara(false)
      })
      .catch((err) => {
        console.warn('Error al iniciar cámara:', err)
        setCargandoCamara(false)
        setErrorCamara(
          err.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Permite el acceso a la cámara en las opciones de tu navegador.'
            : err.name === 'NotFoundError'
            ? 'No se detectó ninguna cámara disponible en este dispositivo.'
            : 'No se pudo iniciar la cámara en este navegador. Puedes usar la cámara nativa.'
        )
      })
    }

    return () => {
      if (streamActivo) {
        streamActivo.getTracks().forEach(t => {
          try { t.stop() } catch (e) {}
        })
      }
    }
  }, [isOpen, facingMode, fotoCapturada])

  if (!isOpen) return null

  const handleCerrar = () => {
    if (streamCamara) {
      streamCamara.getTracks().forEach(t => {
        try { t.stop() } catch (e) {}
      })
      setStreamCamara(null)
    }
    setFotoCapturada(null)
    setErrorCamara('')
    onClose()
  }

  const alternarCamara = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))
  }

  const capturarFoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setFotoCapturada(dataUrl)
  }

  const descartarFoto = () => {
    setFotoCapturada(null)
  }

  const confirmarFoto = () => {
    if (!fotoCapturada) return
    try {
      const parts = fotoCapturada.split(',')
      const byteString = atob(parts[1])
      const mimeString = parts[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeString })
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '')
      const archivo = new File([blob], `evidencia_camara_${timestamp}.jpg`, { type: 'image/jpeg' })
      
      onFotoCapturada(archivo)
      handleCerrar()
    } catch (err) {
      console.error('Error al procesar foto capturada:', err)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 7000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header del visor */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #1E293B',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1rem' }}>
            <FaCamera style={{ color: '#38BDF8' }} />
            <span>{titulo}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!fotoCapturada && !errorCamara && (
              <button
                type="button"
                onClick={alternarCamara}
                title="Cambiar entre cámara trasera y delantera"
                style={{
                  background: '#1E293B',
                  border: '1px solid #475569',
                  color: '#E2E8F0',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <FaSyncAlt /> Voltear
              </button>
            )}
            <button
              type="button"
              onClick={handleCerrar}
              style={{
                background: '#334155',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Área de video / captura */}
        <div style={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#000',
          aspectRatio: '4 / 3',
          maxHeight: '55vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          {cargandoCamara && (
            <div style={{ color: '#94A3B8', textAlign: 'center', padding: '2rem' }}>
              <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '0.75rem', display: 'block', color: '#38BDF8' }}></i>
              <span>Iniciando cámara...</span>
            </div>
          )}

          {errorCamara && (
            <div style={{ color: '#FCA5A5', textAlign: 'center', padding: '1.5rem', maxWidth: '400px' }}>
              <FaExclamationTriangle size={36} style={{ marginBottom: '0.75rem', color: '#F87171' }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#CBD5E1' }}>{errorCamara}</p>
              {onFallbackNativo && (
                <button
                  type="button"
                  onClick={() => {
                    handleCerrar()
                    onFallbackNativo()
                  }}
                  style={{
                    backgroundColor: '#0284C7',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <FaCamera /> Abrir Cámara del Dispositivo
                </button>
              )}
            </div>
          )}

          {!errorCamara && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: fotoCapturada ? 'none' : 'block'
                }}
              />

              {fotoCapturada && (
                <img
                  src={fotoCapturada}
                  alt="Foto capturada"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000'
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Controles inferiores */}
        <div style={{
          padding: '1.25rem',
          backgroundColor: '#0F172A',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          borderTop: '1px solid #1E293B'
        }}>
          {!errorCamara && !fotoCapturada && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button
                type="button"
                onClick={capturarFoto}
                disabled={cargandoCamara}
                title="Tomar Foto"
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: '4px solid #38BDF8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                  transition: 'transform 0.15s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
              </button>
            </div>
          )}

          {fotoCapturada && (
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={descartarFoto}
                style={{
                  flex: 1,
                  backgroundColor: '#334155',
                  color: '#E2E8F0',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <FaSyncAlt /> Repetir Foto
              </button>
              <button
                type="button"
                onClick={confirmarFoto}
                style={{
                  flex: 1,
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 6px rgba(5, 150, 105, 0.3)'
                }}
              >
                <FaCheckCircle /> Usar Foto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
