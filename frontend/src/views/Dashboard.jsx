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
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#BC955B', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <i className="fa-solid fa-chart-pie"></i> Panel de Administración General
        </h1>
        <p style={{ color: '#6F7271', marginBottom: '2.5rem' }}>Bienvenido, resumen general del sistema.</p>

        {/* 📈 TARJETAS DE RESUMEN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-building"></i> {totalOficinas}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Reportes Oficinas</p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-clock-rotate-left"></i> {pendientesOficinas}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Pendientes Oficinas</p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-traffic-light"></i> {totalSemaforos}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Reportes Semáforos</p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: '#BC955B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-clock-rotate-left"></i> {pendientesSemaforos}
            </h3>
            <p style={{ color: '#6F7271', margin: '0.3rem 0 0 0' }}>Pendientes Semáforos</p>
          </div>
        </div>

        {/* 🚀 ACCESOS A LOS PANELES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
          <Link
            to="/dashboard-oficinas"
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
              <i className="fa-solid fa-traffic-light"></i> Ver Reportes de Semáforos
            </h2>
            <p style={{ color: '#6F7271' }}>Lista completa, cambiar estados y exportar Excel.</p>
          </Link>
        </div>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-info-circle"></i> Otra información del sistema
          </h3>
          <p style={{ color: '#6F7271' }}>Aquí podrás agregar más estadísticas o accesos rápidos en el futuro.</p>
        </div>

      </div>
    </div>
  )
}