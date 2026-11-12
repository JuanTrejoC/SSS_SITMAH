import { useRouteError } from 'react-router-dom'
import { FaRedo, FaHome } from 'react-icons/fa'
import logoSitmah from '../assets/logo.png'

export default function ErrorPagina() {
  const error = useRouteError()

  const esOffline =
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    error?.message?.toLowerCase().includes('fetch') ||
    error?.message?.toLowerCase().includes('network')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '1.5rem',
        textAlign: 'center',
        fontFamily: 'Montserrat, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '2.5rem 2rem 2.2rem 2rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Línea institucional superior sutil: Guinda 75% / Oro 25% */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #691B31 0%, #691B31 75%, #BC955B 75%, #BC955B 100%)'
          }}
        />

        {/* Logotipo SITMAH */}
        {logoSitmah && (
          <img
            src={logoSitmah}
            alt="SITMAH"
            style={{
              height: '52px',
              objectFit: 'contain',
              marginBottom: '1.25rem',
              display: 'inline-block'
            }}
          />
        )}

        {/* Título claro */}
        <h2
          style={{
            color: '#1e293b',
            fontSize: '1.25rem',
            fontWeight: 700,
            margin: '0 0 0.65rem 0',
            lineHeight: 1.3
          }}
        >
          {esOffline ? 'Sin conexión a internet' : 'No fue posible cargar esta sección'}
        </h2>

        {/* Mensaje comprensible para el usuario (sin tecnicismos ni variables crudas) */}
        <p
          style={{
            color: '#64748b',
            fontSize: '0.92rem',
            lineHeight: '1.55',
            margin: '0 0 1.75rem 0'
          }}
        >
          {esOffline
            ? 'No se pudo establecer comunicación con el servidor. Por favor verifica tu conexión a internet e inténtalo de nuevo.'
            : 'Tuvimos un problema para mostrar la información. Por favor intenta recargar la página o vuelve al inicio.'}
        </p>

        {/* Acciones principales */}
        <div
          style={{
            display: 'flex',
            gap: '0.85rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#691B31',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.4rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
              boxShadow: '0 1px 2px rgba(105, 27, 49, 0.2)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#531526')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#691B31')}
          >
            <FaRedo size={12} /> Reintentar
          </button>

          <button
            onClick={() => {
              window.location.href = '/'
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 1.4rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc'
              e.currentTarget.style.borderColor = '#94a3b8'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.borderColor = '#cbd5e1'
            }}
          >
            <FaHome size={14} /> Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
