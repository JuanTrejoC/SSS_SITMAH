import React from 'react'

export default function CargandoPagina() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        width: '100%',
        gap: '1rem',
        color: '#691B31',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid rgba(105, 27, 49, 0.15)',
          borderTopColor: '#691B31',
          borderRightColor: '#BC955B',
          animation: 'sitmah-spin 0.75s linear infinite'
        }}
      />
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', letterSpacing: '0.02em' }}>
        Cargando...
      </span>
      <style>{`
        @keyframes sitmah-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
