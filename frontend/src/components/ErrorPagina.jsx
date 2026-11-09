import { useRouteError } from 'react-router-dom'
import { FaExclamationTriangle, FaRedo, FaHome, FaWifi } from 'react-icons/fa'
import logoSitmah from '../assets/logo.png'

export default function ErrorPagina() {
  const error = useRouteError()
  
  const esOffline = (typeof navigator !== 'undefined' && !navigator.onLine) || 
    error?.message?.toLowerCase().includes('fetch') || 
    error?.message?.toLowerCase().includes('network')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '1.5rem',
      textAlign: 'center',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          {logoSitmah && (
            <img src={logoSitmah} alt="SITMAH" style={{ height: '52px', objectFit: 'contain', marginBottom: '1rem' }} />
          )}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: esOffline ? '#fef3c7' : '#fee2e2',
            color: esOffline ? '#d97706' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 1rem auto'
          }}>
            {esOffline ? <FaWifi /> : <FaExclamationTriangle />}
          </div>
          <h2 style={{ color: '#1e293b', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
            {esOffline ? 'Sin conexión a internet' : 'Ha ocurrido un problema inesperado'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.5', margin: 0 }}>
            {esOffline
              ? 'No se pudo establecer comunicación con el servidor. Por favor verifica tu conexión Wi-Fi o datos móviles e inténtalo de nuevo.'
              : (error?.statusText || error?.message || 'Ocurrió un problema al cargar esta sección del sistema.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#691B31',
              color: 'white',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <FaRedo /> Reintentar
          </button>
          <button
            onClick={() => { window.location.href = '/' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <FaHome /> Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}

