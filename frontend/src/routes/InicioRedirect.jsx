import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function InicioRedirect() {
  const { user, cargando } = useAuth()

  if (cargando) {
    return null
  }

  if (user?.rol === 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/crear-oficinas" replace />
}
