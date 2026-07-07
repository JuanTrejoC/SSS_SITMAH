import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// SOLO ADMIN: Si no inició sesión, lo manda al login
export function RutaSoloAdmin() {
  const { user } = useAuth()

  if (!user || user.rol !== 'administrador') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// SOLO SOLICITANTE: redirige al admin al dashboard si intenta crear reportes
export function RutaSoloSolicitante() {
  const { user } = useAuth()

  if (user?.rol === 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}