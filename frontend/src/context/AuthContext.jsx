import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

/* eslint-disable react-refresh/only-export-components */

export const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Función para decodificar el payload del JWT
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const logout = () => {
    setUser(null)
    localStorage.removeItem('sesion_sitmah')
  }

  // Comprobar la sesión al cargar la app
  useEffect(() => {
    const sesion = localStorage.getItem('sesion_sitmah')
    if (sesion) {
      const parsedUser = JSON.parse(sesion);
      if (parsedUser && parsedUser.token) {
        const decoded = parseJwt(parsedUser.token);
        if (decoded && decoded.exp) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp < currentTime) {
            // El token ya expiró mientras la app estaba cerrada
            localStorage.removeItem('sesion_sitmah')
          } else {
            setUser(parsedUser)
          }
        } else {
          setUser(parsedUser)
        }
      }
    }
    setCargando(false)
  }, [])

  // Auto-cierre de sesión cuando el token expire estando dentro del sistema
  useEffect(() => {
    if (user?.token) {
      const decoded = parseJwt(user.token);
      if (decoded?.exp) {
        const timeRemaining = (decoded.exp * 1000) - Date.now();
        if (timeRemaining <= 0) {
          logout();
        } else {
          const timer = setTimeout(() => {
            // Alert opcional, pero aquí solo cerramos sesión
            logout();
          }, timeRemaining);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [user]);

  // Temporizador de inactividad (15 minutos)
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          logout();
        }, 15 * 60 * 1000); // 15 minutos en milisegundos
      }
    };

    if (user) {
      // Iniciar el temporizador al detectar un usuario activo
      resetTimer();
      
      // Eventos que reinician el temporizador de inactividad
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('scroll', resetTimer);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    <AuthContext.Provider value={{ user, cargando, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}