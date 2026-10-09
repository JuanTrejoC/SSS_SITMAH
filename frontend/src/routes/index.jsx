import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RutaSoloAdmin, RutaSoloSolicitante, RutaSoloInfra, RutaAdminOrInfra } from './RutasProtegidas'
import InicioRedirect from './InicioRedirect'
import Layout from '../components/Layout'
import CargandoPagina from '../components/CargandoPagina'

// Vistas cargadas bajo demanda con Code Splitting (React.lazy)
const Login = lazy(() => import('../views/Login'))
const Dashboard = lazy(() => import('../views/Dashboard'))
const Estadisticas = lazy(() => import('../views/Estadisticas'))
const FormOficinas = lazy(() => import('../views/FormOficinas'))
const FormSemaforos = lazy(() => import('../views/FormSemaforos'))
const FormInfraestructura = lazy(() => import('../views/FormInfraestructura'))
const ConfigAdmin = lazy(() => import('../views/ConfigAdmin'))

const DashboardOficinas = lazy(() => import('../views/DashboardOficinas'))
const DashboardSemaforos = lazy(() => import('../views/DashboardSemaforos'))
const DashboardInfraestructura = lazy(() => import('../views/DashboardInfraestructura'))
const InventarioSemaforos = lazy(() => import('../views/InventarioSemaforos'))
const InventarioTecnologico = lazy(() => import('../views/InventarioTecnologico'))
const InventarioExistencias = lazy(() => import('../views/InventarioExistencias'))
const InventarioHerramientas = lazy(() => import('../views/InventarioHerramientas'))
const InventarioMobiliario = lazy(() => import('../views/InventarioMobiliario'))
const Resguardos = lazy(() => import('../views/Resguardos'))
const StockInfraestructura = lazy(() => import('../views/StockInfraestructura'))

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<CargandoPagina />}>
        <Login />
      </Suspense>
    )
  },

  {
    element: <Layout />, // Este Layout contiene <Outlet /> envuelto en <Suspense />
    children: [
      // SOLICITANTE: admin o infra es redirigido a su panel
      {
        element: <RutaSoloSolicitante />,
        children: [
          { path: '/crear-oficinas', element: <FormOficinas /> },
          { path: '/crear-semaforos', element: <FormSemaforos /> },
          { path: '/crear-infraestructura', element: <FormInfraestructura /> }
        ]
      },

      // ADMIN (Tecnológico / Semáforos): PROTEGIDO
      {
        element: <RutaSoloAdmin />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/estadisticas', element: <Estadisticas /> },
          { path: '/configuracion', element: <ConfigAdmin /> },
          { path: '/dashboard-oficinas', element: <DashboardOficinas /> },
          { path: '/dashboard-semaforos', element: <DashboardSemaforos /> },
          { path: '/inventario-semaforos', element: <InventarioSemaforos /> },
          { path: '/inventario-tecnologico', element: <InventarioTecnologico /> },
          { path: '/inventario-existencias', element: <InventarioExistencias /> },
          { path: '/inventario-mobiliario', element: <InventarioMobiliario /> },
          { path: '/resguardos', element: <Resguardos /> }
        ]
      },

      // ADMIN O INFRA: Protegido (Panel de Infraestructura e Inventario de Herramientas)
      {
        element: <RutaAdminOrInfra />,
        children: [
          { path: '/dashboard-infraestructura', element: <DashboardInfraestructura /> },
          { path: '/stock-infraestructura', element: <StockInfraestructura /> },
          { path: '/inventario-herramientas', element: <InventarioHerramientas /> }
        ]
      }
    ]
  },

  // INICIO: admin → dashboard, solicitante → crear reporte
  { path: '/', element: <InicioRedirect /> },
  { path: '*', element: <InicioRedirect /> }
])

export default router