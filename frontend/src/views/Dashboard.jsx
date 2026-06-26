// src/views/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [totalOficinas, setTotalOficinas] = useState(0)
  const [totalSemaforos, setTotalSemaforos] = useState(0)
  const [pendientesOficinas, setPendientesOficinas] = useState(0)
  const [pendientesSemaforos, setPendientesSemaforos] = useState(0)

  useEffect(() => {
    const cargarResumen = async () => {
      if (!user?.token) return
      try {
        const headers = { 'Authorization': `Bearer ${user.token}` }

        const resOficina = await fetch('http://localhost:3000/api/admin/reportes/oficina/resumen', { headers })
        if (resOficina.ok) {
          const json = await resOficina.json()
          if (json.ok && json.data) {
            setTotalOficinas(json.data.total)
            setPendientesOficinas(json.data.abiertos)
          }
        }

        const resSemaforo = await fetch('http://localhost:3000/api/admin/reportes/semaforo/resumen', { headers })
        if (resSemaforo.ok) {
          const json = await resSemaforo.json()
          if (json.ok && json.data) {
            setTotalSemaforos(json.data.total)
            setPendientesSemaforos(json.data.abiertos)
          }
        }
      } catch (err) {
        console.error('Error al cargar resúmenes del dashboard:', err)
      }
    }

    cargarResumen()
  }, [user])

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#BC955B', fontSize: 'clamp(1.15rem, 3vw, 1.8rem)', fontWeight: 'bold', marginBottom: 'clamp(1rem, 3vw, 2rem)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <i className="fa-solid fa-chart-pie"></i> Panel de Administración General
        </h1>
        <p style={{ color: '#6F7271', marginBottom: 'clamp(1.25rem, 3vw, 2.5rem)', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Bienvenido, resumen general del sistema.</p>

        {/* 📈 TARJETAS DE RESUMEN */}
        <div className="form-responsive-grid grid-4" style={{ marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
          <div className="card-padding" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-building"></i> {totalOficinas}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Reportes Oficinas</p>
          </div>

          <div className="card-padding" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-clock-rotate-left"></i> {pendientesOficinas}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Pendientes Oficinas</p>
          </div>

          <div className="card-padding" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-traffic-light"></i> {totalSemaforos}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Reportes Semáforos</p>
          </div>

          <div className="card-padding" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-clock-rotate-left"></i> {pendientesSemaforos}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Pendientes Semáforos</p>
          </div>
        </div>

        {/* 🚀 ACCESOS A LOS PANELES */}
        <div className="form-responsive-grid grid-2" style={{ marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
          <Link
            to="/dashboard-oficinas"
            className="card-padding"
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              borderLeft: '5px solid #BC955B'
            }}
          >
            <h2 style={{ color: '#BC955B', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-file-lines"></i> Ver Reportes de Oficinas
            </h2>
            <p style={{ color: '#6F7271' }}>Lista completa, cambiar estados y exportar Excel.</p>
          </Link>

          <Link
            to="/dashboard-semaforos"
            className="card-padding"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              borderLeft: '5px solid #BC955B'
            }}
          >
            <h2 style={{ color: '#BC955B', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-traffic-light"></i> Ver Reportes de Semáforos
            </h2>
            <p style={{ color: '#6F7271' }}>Lista completa, cambiar estados y exportar Excel.</p>
          </Link>
        </div>

        <div className="card-padding" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-info-circle"></i> Otra información del sistema
          </h3>
          <p style={{ color: '#6F7271' }}>Aquí podrás agregar más estadísticas o accesos rápidos en el futuro.</p>
        </div>

      </div>
    </div>
  )
}