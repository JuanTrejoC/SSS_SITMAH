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

  if (user?.rol === 'infraestructura') {
    return <Navigate to="/inventario-herramientas" replace />
  }

  return <Navigate to="/crear-oficinas" replace />
}
