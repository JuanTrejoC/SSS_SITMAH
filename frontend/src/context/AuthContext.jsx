import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config'

/* eslint-disable react-refresh/only-export-components */

const defaultAuthValue = {
  user: null,
  cargando: true,
  loginAdmin: async () => ({ ok: false, error: 'No se pudo conectar con el servidor' }),
  logout: () => {},
  renovarSesion: async () => {}
}

export const AuthContext = createContext(defaultAuthValue)
export const useAuth = () => useContext(AuthContext) || defaultAuthValue

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Referencias para evitar bucles infinitos de renovación
  const ultimaRenovacionRef = useRef(0)
  const renovandoRef = useRef(false)

  // Función robusta para decodificar JWT sin romper con caracteres especiales base64url
  const parseJwt = (token) => {
    try {
      if (!token || typeof token !== 'string') return null
      const parts = token.split('.')
      if (parts.length < 2) return null
      const base64Url = parts[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const pad = base64.length % 4
      const padded = pad ? base64 + '='.repeat(4 - pad) : base64
      const jsonPayload = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem('sesion_sitmah')
    } catch (e) {
      console.warn('Error al limpiar sesión:', e)
    }
  }

  // Comprobar la sesión al cargar la app con protección try...catch...finally
  useEffect(() => {
    try {
      const sesion = localStorage.getItem('sesion_sitmah')
      if (sesion && sesion !== 'undefined' && sesion !== 'null') {
        const parsedUser = JSON.parse(sesion)
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.token) {
          const rolNormalizado = (parsedUser.rol === 'admin' || parsedUser.rol === 'administrador')
            ? 'administrador'
            : parsedUser.rol

          const decoded = parseJwt(parsedUser.token)
          if (decoded && decoded.exp) {
            const currentTime = Math.floor(Date.now() / 1000)
            if (decoded.exp < currentTime) {
              // El token expiró mientras la app estaba cerrada
              localStorage.removeItem('sesion_sitmah')
              setUser(null)
            } else {
              setUser({ ...parsedUser, rol: rolNormalizado })
            }
          } else {
            setUser({ ...parsedUser, rol: rolNormalizado })
          }
        } else {
          localStorage.removeItem('sesion_sitmah')
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      console.warn('Error al verificar sesión guardada:', err)
      try {
        localStorage.removeItem('sesion_sitmah')
      } catch {}
      setUser(null)
    } finally {
      setCargando(false)
    }
  }, [])

  // Renovación silenciosa del token en segundo plano mientras el usuario está activo
  const renovarSesion = async () => {
    if (!user?.token || renovandoRef.current) return
    const now = Date.now()
    // No permitir renovación más de una vez cada 5 minutos
    if (now - ultimaRenovacionRef.current < 5 * 60 * 1000) return

    renovandoRef.current = true
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/renovar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.ok && json.data?.token) {
          ultimaRenovacionRef.current = Date.now()
          const rolNormalizado = (json.data.usuario?.rol === 'admin' || json.data.usuario?.rol === 'administrador')
            ? 'administrador'
            : json.data.usuario?.rol

          const nuevoUsuario = {
            ...user,
            ...json.data.usuario,
            rol: rolNormalizado,
            token: json.data.token
          }
          setUser(nuevoUsuario)
          localStorage.setItem('sesion_sitmah', JSON.stringify(nuevoUsuario))
        }
      }
    } catch (err) {
      console.warn('No se pudo renovar sesión en segundo plano:', err)
    } finally {
      renovandoRef.current = false
    }
  }

  // Auto-cierre de sesión cuando el token expire estando dentro del sistema
  useEffect(() => {
    if (!user?.token) return
    const decoded = parseJwt(user.token)
    if (!decoded?.exp) return

    const timeRemaining = (decoded.exp * 1000) - Date.now()
    if (timeRemaining <= 0) {
      logout()
      return
    }

    // Si quedan menos de 30 minutos de vigencia, intentar renovar silenciosamente
    if (timeRemaining < 30 * 60 * 1000) {
      renovarSesion()
    }

    const timer = setTimeout(() => {
      logout()
    }, timeRemaining)

    return () => clearTimeout(timer)
  }, [user?.token])

  // Temporizador de inactividad (15 minutos)
  useEffect(() => {
    if (!user) return
    let timeoutId

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        logout()
      }, 15 * 60 * 1000) // 15 minutos exactos de inactividad
    }

    resetTimer()

    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'input', 'focus']
    eventos.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }))

    return () => {
      clearTimeout(timeoutId)
      eventos.forEach((evt) => window.removeEventListener(evt, resetTimer))
    }
  }, [user?.id])

  // CONEXIÓN CON EL BACKEND PARA INICIO DE SESIÓN
  const loginAdmin = async (datos) => {
    try {
      const usernameClean = (datos?.usuario || '').trim()
      const passwordClean = datos?.contrasena || ''

      const respuesta = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: usernameClean,
          password: passwordClean
        })
      })

      const resultado = await respuesta.json().catch(() => ({}))

      if (respuesta.ok && resultado.ok) {
        const usuarioData = resultado.data?.usuario || resultado.usuario || {}
        const token = resultado.data?.token || resultado.token

        // Normalizamos 'admin' a 'administrador'
        const rolNormalizado = (usuarioData.rol === 'admin' || usuarioData.rol === 'administrador')
          ? 'administrador'
          : usuarioData.rol

        const usuario = {
          id: usuarioData.id,
          nombre: usuarioData.nombre,
          username: usuarioData.username,
          email: usuarioData.email,
          rol: rolNormalizado,
          token: token
        }

        ultimaRenovacionRef.current = Date.now()
        setUser(usuario)
        localStorage.setItem('sesion_sitmah', JSON.stringify(usuario))
        return { ok: true, user: usuario }
      } else {
        return { ok: false, error: resultado.error || 'Usuario o contraseña incorrectos' }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      return { ok: false, error: 'No se pudo conectar con el servidor' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, cargando, loginAdmin, logout, renovarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}
