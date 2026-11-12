import { useState, useEffect, useCallback } from 'react'
import { FaAdjust } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function ThemeToggle({ className = '', style = {} }) {
  const { user } = useAuth() || {}
  const esAdmin = user?.rol === 'administrador' || user?.rol === 'admin'

  const [esEscalaGrises, setEsEscalaGrises] = useState(() => {
    return localStorage.getItem('sitrach_grayscale') === 'true' || localStorage.getItem('sitmah_grayscale') === 'true'
  })

  // Función para aplicar o remover la clase CSS de escala de grises
  const aplicarTema = useCallback((activar) => {
    if (activar) {
      document.documentElement.classList.add('grayscale-theme')
      document.body.classList.add('grayscale-theme')
    } else {
      document.documentElement.classList.remove('grayscale-theme')
      document.body.classList.remove('grayscale-theme')
    }
  }, [])

  // Aplicar tema al montar o cuando cambie el rol
  useEffect(() => {
    if (esAdmin) {
      aplicarTema(esEscalaGrises)
    } else {
      aplicarTema(false)
    }
  }, [esAdmin, esEscalaGrises, aplicarTema])

  // Escuchar cambios de tema entre pestañas o componentes
  useEffect(() => {
    const handleStorage = (e) => {
      let nuevoValor = false
      if (e?.detail !== undefined) {
        nuevoValor = Boolean(e.detail)
      } else {
        nuevoValor = localStorage.getItem('sitrach_grayscale') === 'true' || localStorage.getItem('sitmah_grayscale') === 'true'
      }
      setEsEscalaGrises(nuevoValor)
      if (esAdmin) {
        aplicarTema(nuevoValor)
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('sitrach_theme_change', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('sitrach_theme_change', handleStorage)
    }
  }, [esAdmin, aplicarTema])

  // Solo se muestra para el Administrador General
  if (!esAdmin) return null

  const alternarTema = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const nuevo = !esEscalaGrises
    // 1. Guardar en localStorage de inmediato
    localStorage.setItem('sitrach_grayscale', String(nuevo))
    localStorage.setItem('sitmah_grayscale', String(nuevo))
    // 2. Aplicar al DOM de inmediato
    aplicarTema(nuevo)
    // 3. Actualizar estado local
    setEsEscalaGrises(nuevo)
    // 4. Notificar a otros escuchas con el valor exacto
    window.dispatchEvent(new CustomEvent('sitrach_theme_change', { detail: nuevo }))
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={esEscalaGrises ? 'Restaurar colores originales' : 'Cambiar a escala de grises'}
      aria-label="Alternar escala de grises"
      className={`notification-bell-btn ${className}`}
      style={{
        marginRight: '0.45rem',
        backgroundColor: esEscalaGrises ? '#BC955B' : 'rgba(255, 255, 255, 0.12)',
        color: esEscalaGrises ? '#691B31' : '#BC955B',
        cursor: 'pointer',
        ...style
      }}
    >
      <FaAdjust size={18} />
    </button>
  )
}
