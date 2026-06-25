import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { FaFilePdf } from 'react-icons/fa'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Estadisticas() {
  const { user } = useAuth()
  const [datos, setDatos] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    resueltos: 0,
    tiempoPromedio: 0
  })
  const [datosOficina, setDatosOficina] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    resueltos: 0
  })
  const [datosSemaforo, setDatosSemaforo] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    resueltos: 0
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!user?.token) return
      setCargando(true)
      try {
        const response = await fetch('http://localhost:3000/api/admin/estadisticas', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        })
        const json = await response.json()
        if (response.ok && json.ok) {
          const stats = json.data
          setDatos({
            total: stats.totales.total || 0,
            pendientes: stats.distribucion.por_estado.abierto || 0,
            enProceso: stats.distribucion.por_estado.en_proceso || 0,
            resueltos: stats.distribucion.por_estado.resuelto || 0,
            tiempoPromedio: stats.tiempo_promedio_horas || 0
          })
          if (stats.oficina) {
            setDatosOficina({
              total: stats.oficina.total || 0,
              pendientes: stats.oficina.abierto || 0,
              enProceso: stats.oficina.en_proceso || 0,
              resueltos: stats.oficina.resuelto || 0
            })
          }
          if (stats.semaforo) {
            setDatosSemaforo({
              total: stats.semaforo.total || 0,
              pendientes: stats.semaforo.abierto || 0,
              enProceso: stats.semaforo.en_proceso || 0,
              resueltos: stats.semaforo.resuelto || 0
            })
          }
        }
      } catch (err) {
        console.error('Error al cargar estadísticas:', err)
      } finally {
        setCargando(false)
      }
    }

    cargarEstadisticas()
  }, [user])

  const datosGraficoOficina = {
    labels: ['Pendientes', 'En Proceso', 'Resueltos'],
    datasets: [{
      data: [datosOficina.pendientes, datosOficina.enProceso, datosOficina.resueltos],
      backgroundColor: ['#dc2626', '#b45309', '#166534'],
      borderWidth: 0
    }]
  }

  const datosGraficoSemaforo = {
    labels: ['Pendientes', 'En Proceso', 'Resueltos'],
    datasets: [{
      data: [datosSemaforo.pendientes, datosSemaforo.enProceso, datosSemaforo.resueltos],
      backgroundColor: ['#dc2626', '#b45309', '#166534'],
      borderWidth: 0
    }]
  }

  // Plugin para mostrar el número directamente en cada segmento
  const pluginDatalabels = {
    id: 'custom_datalabels',
    afterDraw: (chart) => {
      const { ctx } = chart
      ctx.save()
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i)
        meta.data.forEach((element, index) => {
          const value = dataset.data[index]
          if (value === 0 || value == null) return

          const { x, y } = element.tooltipPosition()

          ctx.font = 'bold 14px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
          ctx.lineWidth = 3
          ctx.strokeText(String(value), x, y)
          ctx.fillStyle = '#ffffff'
          ctx.fillText(String(value), x, y)
        })
      })
      ctx.restore()
    }
  }

  return (
    <div className="contenedor-estadisticas" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, color: '#000000', fontWeight: 'bold' }}>
            Estadísticas Generales
          </h1>
          <p style={{ color: '#6F7271', marginTop: '0.2rem', marginBottom: 0 }}>Métricas agregadas en tiempo real de todos los reportes recibidos.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-print-pdf"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.2rem',
            backgroundColor: '#691B31',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#BC955B' }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#691B31' }}
        >
          <FaFilePdf size={16} />
          Descargar Reporte PDF
        </button>
      </div>

      {/* Título visible solo al imprimir */}
      <div style={{ display: 'none', marginBottom: '2rem' }} className="print-only-block">
        <h1 style={{ fontSize: '2.2rem', color: '#691B31', fontWeight: 'bold', margin: 0 }}>SITMAH - Reporte de Estadísticas</h1>
        <p style={{ color: '#6F7271', marginTop: '0.2rem' }}>Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</p>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando panel de métricas...</p>
      ) : (
        <>
          <div className="resumen" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.2rem', marginBottom: '3rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #000000' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Total Reportes</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#000000' }}>{datos.total}</h3>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #dc2626' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Pendientes</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#dc2626' }}>{datos.pendientes}</h3>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #b45309' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>En Proceso</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#b45309' }}>{datos.enProceso}</h3>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #166534' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Resueltos</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#166534' }}>{datos.resueltos}</h3>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #BC955B' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Resolución Promedio</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#BC955B' }}>{datos.tiempoPromedio} hrs</h3>
            </div>
          </div>

          <div className="graficas-flex-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            {/* GRÁFICO OFICINAS */}
            <div className="grafico-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#000000', fontWeight: '600', fontSize: '1.2rem', textAlign: 'center' }}>Reportes de Oficinas</h3>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#691B31', marginBottom: '1.5rem', textAlign: 'center' }}>
                Total: {datosOficina.total}
              </div>
              {datosOficina.total === 0 ? (
                <p style={{ color: '#6F7271', padding: '2rem 0', textAlign: 'center' }}>No hay suficientes reportes de oficinas.</p>
              ) : (
                <div style={{ width: '100%', maxWidth: '280px' }}>
                  <Doughnut 
                    data={datosGraficoOficina} 
                    options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                        tooltip: { enabled: true }
                      } 
                    }} 
                    plugins={[pluginDatalabels]}
                  />
                </div>
              )}
            </div>

            {/* GRÁFICO SEMÁFOROS */}
            <div className="grafico-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#000000', fontWeight: '600', fontSize: '1.2rem', textAlign: 'center' }}>Reportes de Semáforos</h3>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#BC955B', marginBottom: '1.5rem', textAlign: 'center' }}>
                Total: {datosSemaforo.total}
              </div>
              {datosSemaforo.total === 0 ? (
                <p style={{ color: '#6F7271', padding: '2rem 0', textAlign: 'center' }}>No hay suficientes reportes de semáforos.</p>
              ) : (
                <div style={{ width: '100%', maxWidth: '280px' }}>
                  <Doughnut 
                    data={datosGraficoSemaforo} 
                    options={{ 
                      responsive: true, 
                      plugins: { 
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                        tooltip: { enabled: true }
                      } 
                    }} 
                    plugins={[pluginDatalabels]}
                  />
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  )
}