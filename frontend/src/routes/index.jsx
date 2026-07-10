import { createBrowserRouter } from 'react-router-dom'
import { RutaSoloAdmin, RutaSoloSolicitante } from './RutasProtegidas'
import InicioRedirect from './InicioRedirect'
import Layout from '../components/Layout'

import Login from '../views/Login'
import Dashboard from '../views/Dashboard'
import Estadisticas from '../views/Estadisticas'
import FormOficinas from '../views/FormOficinas'
import FormSemaforos from '../views/FormSemaforos'
import ConfigAdmin from '../views/ConfigAdmin'

import DashboardOficinas from '../views/DashboardOficinas'
import DashboardSemaforos from '../views/DashboardSemaforos'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },

  {
    element: <Layout />, // ESTE LAYOUT DEBE TENER <Outlet />
    children: [
      // SOLICITANTE: admin es redirigido al dashboard
      {
        element: <RutaSoloSolicitante />,
        children: [
          { path: '/crear-oficinas', element: <FormOficinas /> },
          { path: '/crear-semaforos', element: <FormSemaforos /> }
        ]
      },

      // ADMIN: PROTEGIDO
      {
        element: <RutaSoloAdmin />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/estadisticas', element: <Estadisticas /> },
          { path: '/configuracion', element: <ConfigAdmin /> },
          { path: '/dashboard-oficinas', element: <DashboardOficinas /> },
          { path: '/dashboard-semaforos', element: <DashboardSemaforos /> }
        ]
      }
    ]
  },

  // INICIO: admin → dashboard, solicitante → crear reporte
  { path: '/', element: <InicioRedirect /> },
  { path: '*', element: <InicioRedirect /> }

])

export default router