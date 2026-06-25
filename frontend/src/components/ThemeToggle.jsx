import { useState, useEffect } from 'react'
import { FaAdjust } from 'react-icons/fa'

export default function ThemeToggle() {
  const [esEscalaGrises, setEsEscalaGrises] = useState(() => {
    return localStorage.getItem('sitmah_grayscale') === 'true'
  })

  useEffect(() => {
    if (esEscalaGrises) {
      document.body.classList.add('grayscale-theme')
    } else {
      document.body.classList.remove('grayscale-theme')
    }
    localStorage.setItem('sitmah_grayscale', String(esEscalaGrises))
  }, [esEscalaGrises])

  return (
    <button
      onClick={() => setEsEscalaGrises(!esEscalaGrises)}
      title={esEscalaGrises ? 'Restaurar colores' : 'Activar escala de grises'}
      aria-label="Alternar escala de grises"
      className="theme-toggle-btn"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '0.4rem',
        zIndex: 900,
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        border: '1px solid #6F7271',
        backgroundColor: esEscalaGrises ? '#475569' : 'white',
        color: esEscalaGrises ? 'white' : '#691B31',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        transition: 'background 0.2s, transform 0.2s, color 0.2s'
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)' }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <FaAdjust size={18} />
    </button>
  )
}
