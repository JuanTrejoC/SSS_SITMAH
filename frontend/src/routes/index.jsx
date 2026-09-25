import { createBrowserRouter } from 'react-router-dom'
import { RutaSoloAdmin, RutaSoloSolicitante, RutaSoloInfra, RutaAdminOrInfra } from './RutasProtegidas'
import InicioRedirect from './InicioRedirect'
import Layout from '../components/Layout'

import Login from '../views/Login'
import Dashboard from '../views/Dashboard'
import Estadisticas from '../views/Estadisticas'
import FormOficinas from '../views/FormOficinas'
import FormSemaforos from '../views/FormSemaforos'
import FormInfraestructura from '../views/FormInfraestructura'
import ConfigAdmin from '../views/ConfigAdmin'

import DashboardOficinas from '../views/DashboardOficinas'
import DashboardSemaforos from '../views/DashboardSemaforos'
import DashboardInfraestructura from '../views/DashboardInfraestructura'
import InventarioSemaforos from '../views/InventarioSemaforos'
import InventarioTecnologico from '../views/InventarioTecnologico'
import InventarioExistencias from '../views/InventarioExistencias'
import InventarioHerramientas from '../views/InventarioHerramientas'
import InventarioMobiliario from '../views/InventarioMobiliario'
import Resguardos from '../views/Resguardos'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },

  {
    element: <Layout />, // ESTE LAYOUT DEBE TENER <Outlet />
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

      // SOLO INFRAESTRUCTURA: Panel independiente
      {
        element: <RutaSoloInfra />,
        children: [
          { path: '/dashboard-infraestructura', element: <DashboardInfraestructura /> }
        ]
      },

      // ADMIN O INFRA: Protegido
      {
        element: <RutaAdminOrInfra />,
        children: [
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