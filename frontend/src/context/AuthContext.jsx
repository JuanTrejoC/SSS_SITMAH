import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

export const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const sesion = localStorage.getItem('sesion_sitmah')
    if (sesion) setUser(JSON.parse(sesion))
  }, [])

  // ✅ CONEXIÓN CON EL BACKEND PARA INICIO DE SESIÓN
  const loginAdmin = async (datos) => {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: datos.usuario,
          password: datos.contrasena
        })
      })

      const resultado = await respuesta.json()

      if (respuesta.ok && resultado.ok) {
        const usuarioData = resultado.data.usuario
        const token = resultado.data.token

        // Mapeamos 'admin' a 'administrador' para no romper lógica del front
        const usuario = {
          id: usuarioData.id,
          nombre: usuarioData.nombre,
          username: usuarioData.username,
          email: usuarioData.email,
          rol: usuarioData.rol === 'admin' ? 'administrador' : usuarioData.rol,
          token: token
        }

        setUser(usuario)
        localStorage.setItem('sesion_sitmah', JSON.stringify(usuario))
        return { ok: true }
      } else {
        return { ok: false, error: resultado.error || 'Usuario o contraseña incorrectos' }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      return { ok: false, error: 'No se pudo conectar con el servidor' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('sesion_sitmah')
  }

  return (
    <AuthContext.Provider value={{ user, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}