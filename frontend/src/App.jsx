import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Login from "./views/Login";
import Dashboard from "./views/Dashboard";
import FormOficinas from "./views/FormOficinas";
import FormSemaforos from "./views/FormSemaforos";
import MisReportes from "./views/MisReportes";
import Estadisticas from "./views/Estadisticas";
import ConfigAdmin from "./views/ConfigAdmin";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/crear-reporte" element={
              <div className="app-layout">
                <Sidebar />
                <Routes>
                  <Route path="/" element={<Navigate to="oficinas" replace />} />
                  <Route path="oficinas" element={<FormOficinas />} />
                  <Route path="semaforos" element={<FormSemaforos />} />
                </Routes>
              </div>
            } />

            <Route path="/mis-reportes" element={
              <div className="app-layout"><Sidebar /><MisReportes /></div>
            } />
          </Route>

          {/* Solo Administrador */}
          <Route element={<ProtectedRoute soloAdmin={true} />}>
            <Route path="/dashboard" element={<div className="app-layout"><Sidebar /><Dashboard /></div>} />
            <Route path="/estadisticas" element={<div className="app-layout"><Sidebar /><Estadisticas /></div>} />
            <Route path="/configuracion" element={<div className="app-layout"><Sidebar /><ConfigAdmin /></div>} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;