import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// SOLO ADMIN: Si no inició sesión, lo manda al login
export function RutaSoloAdmin() {
  const { user, cargando } = useAuth()

  if (cargando) {
    return null // Retornamos null o un loader discreto mientras se restaura la sesión
  }

  if (!user || user.rol !== 'administrador') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// SOLO SOLICITANTE: redirige al admin al dashboard si intenta crear reportes
export function RutaSoloSolicitante() {
  const { user, cargando } = useAuth()

  if (cargando) {
    return null
  }

  if (user?.rol === 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}