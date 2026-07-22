// src/views/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'

export default function Dashboard() {
  const { user } = useAuth()
  const [totalOficinas, setTotalOficinas] = useState(0)
  const [totalSemaforos, setTotalSemaforos] = useState(0)
  const [pendientesOficinas, setPendientesOficinas] = useState(0)
  const [pendientesSemaforos, setPendientesSemaforos] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarResumen = async () => {
      if (!user?.token) return
      setCargando(true)
      try {
        const headers = { 'Authorization': `Bearer ${user.token}` }

        const resOficina = await fetch(`${API_BASE_URL}/api/admin/reportes/oficina/resumen`, { headers })
        if (resOficina.ok) {
          const json = await resOficina.json()
          if (json.ok && json.data) {
            setTotalOficinas(json.data.total || 0)
            setPendientesOficinas(json.data.abiertos || 0)
          }
        }

        const resSemaforo = await fetch(`${API_BASE_URL}/api/admin/reportes/semaforo/resumen`, { headers })
        if (resSemaforo.ok) {
          const json = await resSemaforo.json()
          if (json.ok && json.data) {
            setTotalSemaforos(json.data.total || 0)
            setPendientesSemaforos(json.data.abiertos || 0)
          }
        }
      } catch (err) {
        console.error('Error al cargar resúmenes del dashboard:', err)
      } finally {
        setCargando(false)
      }
    }

    cargarResumen()
  }, [user])

  // Cálculos de métricas derivativas
  const atendidosOficinas = Math.max(0, totalOficinas - pendientesOficinas)
  const atendidosSemaforos = Math.max(0, totalSemaforos - pendientesSemaforos)
  const pctOficinas = totalOficinas > 0 ? Math.round((atendidosOficinas / totalOficinas) * 100) : 0
  const pctSemaforos = totalSemaforos > 0 ? Math.round((atendidosSemaforos / totalSemaforos) * 100) : 0

  const totalGeneral = totalOficinas + totalSemaforos
  const pendientesGeneral = pendientesOficinas + pendientesSemaforos
  const atendidosGeneral = totalGeneral - pendientesGeneral
  const pctGeneral = totalGeneral > 0 ? Math.round((atendidosGeneral / totalGeneral) * 100) : 0

  // Fecha actual formateada en español
  const fechaActual = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* ================= BANNER DE BIENVENIDA ================= */}
        <header
          style={{
            background: 'linear-gradient(135deg, #691B31 0%, #4e1325 60%, #390d1b 100%)',
            borderRadius: '16px',
            padding: 'clamp(1.5rem, 4vw, 2.25rem)',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(105, 27, 49, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Adorno decorativo de fondo */}
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              right: '-5%',
              width: '320px',
              height: '320px',
              background: 'radial-gradient(circle, rgba(188,149,91,0.18) 0%, rgba(255,255,255,0) 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.825rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.15)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                <span style={{ textTransform: 'capitalize', color: '#f3f4f6' }}>{fechaActual}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 2.1rem)', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                ¡Bienvenido{(user?.nombre || user?.username) ? `, ${user.nombre || user.username}` : ''}!
              </h1>
              <p style={{ color: '#E5E7EB', margin: '0.5rem 0 0 0', fontSize: 'clamp(0.875rem, 2vw, 1.05rem)', maxWidth: '650px', opacity: 0.9 }}>
                Panel general del Sistema de Transporte Masivo de Hidalgo (SITMAH). Gestiona y monitorea incidencias operativas y de infraestructura en tiempo real.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>

              <Link
                to="/estadisticas"
                className="btn-responsive-general"
                style={{
                  backgroundColor: '#BC955B',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(188, 149, 91, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-chart-line"></i> Estadísticas
              </Link>
            </div>
          </div>
        </header>

        {/* ================= TARJETAS KPI DE MÉTRICAS ================= */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#1F2937', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <i className="fa-solid fa-square-poll-vertical" style={{ color: '#691B31' }}></i> Resumen Ejecutivo
            </h2>
            {cargando && (
              <span style={{ fontSize: '0.85rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-spinner fa-spin"></i> Actualizando...
              </span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.15rem'
            }}
          >
            {/* Card 1: Total Reportes Oficinas */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                padding: '1.35rem',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.15rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0
                }}
              >
                <i className="fa-solid fa-building"></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.825rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reportes tecnológicos · Totales
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#111827', lineHeight: 1.1, marginTop: '0.2rem' }}>
                  {totalOficinas}
                </div>
                <span style={{ fontSize: '0.775rem', color: '#059669', fontWeight: '600', display: 'inline-block', marginTop: '0.25rem' }}>
                  <i className="fa-solid fa-circle-check"></i> {atendidosOficinas} atendidos ({pctOficinas}%)
                </span>
              </div>
            </div>

            {/* Card 2: Pendientes Oficinas */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                padding: '1.35rem',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.15rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0
                }}
              >
                <i className="fa-solid fa-clock"></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.825rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reportes tecnológicos · Pendientes
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#111827', lineHeight: 1.1, marginTop: '0.2rem' }}>
                  {pendientesOficinas}
                </div>
                <span style={{ fontSize: '0.775rem', color: pendientesOficinas > 0 ? '#DC2626' : '#6B7280', fontWeight: '600', display: 'inline-block', marginTop: '0.25rem' }}>
                  {pendientesOficinas > 0 ? ' Requieren atención' : ' Al día'}
                </span>
              </div>
            </div>

            {/* Card 3: Total Reportes Semáforos */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                padding: '1.35rem',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.15rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  backgroundColor: '#E0E7FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0
                }}
              >
                <i className="fa-solid fa-traffic-light"></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.825rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reportes semafóricos · Totales
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#111827', lineHeight: 1.1, marginTop: '0.2rem' }}>
                  {totalSemaforos}
                </div>
                <span style={{ fontSize: '0.775rem', color: '#059669', fontWeight: '600', display: 'inline-block', marginTop: '0.25rem' }}>
                  <i className="fa-solid fa-circle-check"></i> {atendidosSemaforos} atendidos ({pctSemaforos}%)
                </span>
              </div>
            </div>

            {/* Card 4: Pendientes Semáforos */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                padding: '1.35rem',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.15rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0
                }}
              >
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.825rem', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reportes semafóricos · Pendientes
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#111827', lineHeight: 1.1, marginTop: '0.2rem' }}>
                  {pendientesSemaforos}
                </div>
                <span style={{ fontSize: '0.775rem', color: pendientesSemaforos > 0 ? '#B45309' : '#6B7280', fontWeight: '600', display: 'inline-block', marginTop: '0.25rem' }}>
                  {pendientesSemaforos > 0 ? ' En revisión' : ' Sin pendientes'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ACCESOS PRINCIPALES A PANELES DE GESTIÓN ================= */}
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#1F2937', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-list-check" style={{ color: '#BC955B' }}></i> Paneles Principales de Gestión
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {/* Módulo: Panel de Oficinas */}
            <Link
              to="/dashboard-oficinas"
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.65rem',
                border: '1px solid #E5E7EB',
                borderTop: '5px solid #691B31',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(105,27,49,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,0.06)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(105,27,49,0.08)',
                      color: '#691B31',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.35rem'
                    }}
                  >
                    <i className="fa-solid fa-file-lines"></i>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: pendientesOficinas > 0 ? '#FEE2E2' : '#D1FAE5',
                      color: pendientesOficinas > 0 ? '#991B1B' : '#065F46',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px'
                    }}
                  >
                    {pendientesOficinas} pendientes
                  </span>
                </div>

                <h3 style={{ color: '#111827', fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.4rem 0' }}>
                  Reportes Tecnológicos
                </h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Consulta la lista general, filtra por fecha o estado, gestiona el flujo de atención y exporta reportes en Excel.
                </p>
              </div>

              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#691B31' }}>
                  Acceder al Panel
                </span>
                <i className="fa-solid fa-arrow-right" style={{ color: '#691B31', fontSize: '0.95rem' }}></i>
              </div>
            </Link>

            {/* Módulo: Panel de Semáforos */}
            <Link
              to="/dashboard-semaforos"
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.65rem',
                border: '1px solid #E5E7EB',
                borderTop: '5px solid #BC955B',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(188,149,91,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,0.06)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(188,149,91,0.12)',
                      color: '#B45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.35rem'
                    }}
                  >
                    <i className="fa-solid fa-traffic-light"></i>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: pendientesSemaforos > 0 ? '#FEF3C7' : '#D1FAE5',
                      color: pendientesSemaforos > 0 ? '#92400E' : '#065F46',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px'
                    }}
                  >
                    {pendientesSemaforos} pendientes
                  </span>
                </div>

                <h3 style={{ color: '#111827', fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.4rem 0' }}>
                  Reportes Semafóricos
                </h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Administración de averías de semáforos, control de fallas por intersección, asignación de mantenimiento y descargas de reportes.
                </p>
              </div>

              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#B45309' }}>
                  Acceder al Panel
                </span>
                <i className="fa-solid fa-arrow-right" style={{ color: '#B45309', fontSize: '0.95rem' }}></i>
              </div>
            </Link>
          </div>
        </div>

        {/* ================= ESTADO GLOBAL Y ACCESOS RÁPIDOS A INVENTARIOS ================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* Tarjeta 1: Indicador de Eficiencia Global */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-chart-pie" style={{ color: '#691B31' }}></i> Nivel de Respuesta Global
                </h3>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#691B31' }}>{pctGeneral}%</span>
              </div>

              {/* Progress Bar Container */}
              <div style={{ width: '100%', height: '10px', backgroundColor: '#E5E7EB', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: `${pctGeneral}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #691B31 0%, #BC955B 100%)',
                    borderRadius: '10px',
                    transition: 'width 0.6s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#691B31', display: 'inline-block' }}></span>
                    Atendidos
                  </span>
                  <span style={{ fontWeight: '700', color: '#111827' }}>{atendidosGeneral} / {totalGeneral}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }}></span>
                    Pendientes de Atención
                  </span>
                  <span style={{ fontWeight: '700', color: '#D97706' }}>{pendientesGeneral}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6' }}>
              <Link to="/estadisticas" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#691B31', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Ver métricas detalladas <i className="fa-solid fa-angle-right"></i>
              </Link>
            </div>
          </div>

          {/* Tarjeta 2: Accesos Directos a Inventarios */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)'
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-boxes-stacked" style={{ color: '#BC955B' }}></i> Accesos a Inventarios
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Link
                to="/inventario-tecnologico"
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                  e.currentTarget.style.borderColor = '#D1D5DB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <i className="fa-solid fa-laptop" style={{ color: '#691B31' }}></i>
                <span>Tecnológico</span>
              </Link>

              <Link
                to="/inventario-semaforos"
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                  e.currentTarget.style.borderColor = '#D1D5DB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <i className="fa-solid fa-traffic-light" style={{ color: '#BC955B' }}></i>
                <span>Semáforos</span>
              </Link>

              <Link
                to="/inventario-herramientas"
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                  e.currentTarget.style.borderColor = '#D1D5DB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <i className="fa-solid fa-screwdriver-wrench" style={{ color: '#4B5563' }}></i>
                <span>Herramientas</span>
              </Link>

              <Link
                to="/inventario-existencias"
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                  e.currentTarget.style.borderColor = '#D1D5DB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <i className="fa-solid fa-boxes-packing" style={{ color: '#059669' }}></i>
                <span>Existencias</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}