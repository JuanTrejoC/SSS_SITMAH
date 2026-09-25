import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// SOLO ADMIN: Tecnológicos y Semafóricos
export function RutaSoloAdmin() {
  const { user, cargando } = useAuth()

  if (cargando) {
    return null // Retornamos null mientras se restaura la sesión
  }

  if (!user || user.rol !== 'administrador') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// SOLO INFRAESTRUCTURA: Panel de Infraestructura
export function RutaSoloInfra() {
  const { user, cargando } = useAuth()

  if (cargando) return null

  if (!user || user.rol !== 'infraestructura') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// ADMIN O INFRA: Inventario de Herramientas
export function RutaAdminOrInfra() {
  const { user, cargando } = useAuth()

  if (cargando) return null

  if (!user || (user.rol !== 'administrador' && user.rol !== 'infraestructura')) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// SOLO SOLICITANTE: redirige al admin / infra a sus respectivos paneles si intentan entrar al formulario público estando logueados
export function RutaSoloSolicitante() {
  const { user, cargando } = useAuth()

  if (cargando) {
    return null
  }

  if (user?.rol === 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  if (user?.rol === 'infraestructura') {
    return <Navigate to="/dashboard-infraestructura" replace />
  }

  return <Outlet />
}