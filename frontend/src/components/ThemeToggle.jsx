import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaAdjust } from 'react-icons/fa'

export default function ThemeToggle() {
  const [esEscalaGrises, setEsEscalaGrises] = useState(() => {
    return localStorage.getItem('sitrach_grayscale') === 'true' || localStorage.getItem('sitmah_grayscale') === 'true'
  })

  useEffect(() => {
    if (esEscalaGrises) {
      document.documentElement.classList.add('grayscale-theme')
    } else {
      document.documentElement.classList.remove('grayscale-theme')
    }
    localStorage.setItem('sitrach_grayscale', String(esEscalaGrises))
    localStorage.setItem('sitmah_grayscale', String(esEscalaGrises))
  }, [esEscalaGrises])

  return createPortal(
    <button
      onClick={() => setEsEscalaGrises(!esEscalaGrises)}
      title={esEscalaGrises ? 'Restaurar colores' : 'Activar escala de grises'}
      aria-label="Alternar escala de grises"
      className="theme-toggle-btn"
      style={{
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        transition: 'background 0.2s, transform 0.2s, color 0.2s',
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)' }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <FaAdjust size={18} />
    </button>,
    document.body
  )
}
