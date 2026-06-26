import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { FaFilePdf } from 'react-icons/fa'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Estadisticas() {
  const { user } = useAuth()
  const [filtroTiempo, setFiltroTiempo] = useState('dia')
  const [filtroLista, setFiltroLista] = useState('total')
  const [reportesList, setReportesList] = useState([])
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
        const response = await fetch(`http://localhost:3000/api/admin/estadisticas?filtroTiempo=${filtroTiempo}`, {
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
          setReportesList(stats.reportes || [])
        }
      } catch (err) {
        console.error('Error al cargar estadísticas:', err)
      } finally {
        setCargando(false)
      }
    }

    cargarEstadisticas()
  }, [user, filtroTiempo])

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
    <div className="contenedor-estadisticas main-content-padding" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="responsive-flex no-print" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, color: '#000000', fontWeight: 'bold' }}>
            Estadísticas Generales
          </h1>
          <p style={{ color: '#6F7271', marginTop: '0.2rem', marginBottom: 0 }}>Métricas agregadas de reportes recibidos.</p>
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

      {/* FILTROS DE TIEMPO */}
      <div className="no-print responsive-flex" style={{ gap: '0.8rem', marginBottom: '2rem' }}>
        {['dia', 'semana', 'mes', 'año', 'todo'].map(f => (
          <button
            key={f}
            onClick={() => setFiltroTiempo(f)}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: filtroTiempo === f ? '#691B31' : '#e2e8f0',
              color: filtroTiempo === f ? 'white' : '#475569',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {f === 'dia' ? 'Hoy' : f === 'todo' ? 'Todo el tiempo' : `Este ${f}`}
          </button>
        ))}
      </div>

      {/* Título visible solo al imprimir */}
      <div style={{ display: 'none', marginBottom: '2rem' }} className="print-only-block">
        <h1 style={{ fontSize: '2.2rem', color: '#691B31', fontWeight: 'bold', margin: 0 }}>SITMAH - Reporte de Estadísticas</h1>
        <p style={{ color: '#6F7271', marginTop: '0.2rem' }}>Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</p>
        <p style={{ color: '#000000', fontWeight: 'bold' }}>Periodo: {filtroTiempo === 'dia' ? 'Hoy' : filtroTiempo === 'todo' ? 'Todo el tiempo' : `Este ${filtroTiempo}`}</p>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando panel de métricas...</p>
      ) : (
        <>
          <div className="resumen responsive-grid-5" style={{ marginBottom: '3rem' }}>
            <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #000000' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Total Reportes</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#000000' }}>{datos.total}</h3>
            </div>
            <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #dc2626' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Pendientes</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#dc2626' }}>{datos.pendientes}</h3>
            </div>
            <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #b45309' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>En Proceso</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#b45309' }}>{datos.enProceso}</h3>
            </div>
            <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #166534' }}>
              <p style={{ fontSize: '0.85rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Resueltos</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#166534' }}>{datos.resueltos}</h3>
            </div>
            <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #BC955B' }}>
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
                <p style={{ color: '#6F7271', padding: '2rem 0', textAlign: 'center' }}>No hay reportes en este periodo.</p>
              ) : (
                <div style={{ width: '100%', maxWidth: '280px' }}>
                  <Doughnut data={datosGraficoOficina} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }, tooltip: { enabled: true } } }} plugins={[pluginDatalabels]} />
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
                <p style={{ color: '#6F7271', padding: '2rem 0', textAlign: 'center' }}>No hay reportes en este periodo.</p>
              ) : (
                <div style={{ width: '100%', maxWidth: '280px' }}>
                  <Doughnut data={datosGraficoSemaforo} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }, tooltip: { enabled: true } } }} plugins={[pluginDatalabels]} />
                </div>
              )}
            </div>
          </div>

          {/* DETALLES DE REPORTES */}
          <div style={{ marginTop: '4rem' }} className="print-break-inside-avoid">
            <h2 style={{ fontSize: '1.6rem', color: '#000000', marginBottom: '1rem' }}>Detalle de Reportes (Atendidos)</h2>
            
            <div className="no-print responsive-flex" style={{ gap: '0.8rem', marginBottom: '1.5rem' }}>
              {[
                { id: 'total', label: 'Todos' },
                { id: 'Oficina', label: 'Reportes de Oficinas' },
                { id: 'Semáforo', label: 'Reportes de Semáforos' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setFiltroLista(btn.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: filtroLista === btn.id ? '#BC955B' : '#e2e8f0',
                    color: filtroLista === btn.id ? 'white' : '#475569',
                    transition: 'all 0.2s'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {(filtroLista === 'total' || filtroLista === 'Oficina') && (
                <div className="print-break-inside-avoid">
                  <h3 style={{ color: '#691B31', borderBottom: '2px solid #691B31', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Oficinas</h3>
                  {reportesList.filter(r => r.tipo === 'Oficina').length === 0 ? (
                    <p style={{ color: '#6F7271' }}>No hay reportes de oficinas en este periodo.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f1f5f9' }}>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Folio</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Solicitante</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Cargo</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Sede/Área</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Categoría</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Prioridad</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportesList.filter(r => r.tipo === 'Oficina').map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.folio || 'N/A'}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.solicitante}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.cargo}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.sede} / {r.area}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.categoria}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>
                                <span style={{ textTransform: 'capitalize', color: r.prioridad === 'alta' ? '#dc2626' : r.prioridad === 'media' ? '#b45309' : '#166534' }}>{r.prioridad}</span>
                              </td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>
                                <span style={{ fontWeight: '600', color: r.estado === 'resuelto' ? '#166534' : r.estado === 'en_proceso' ? '#b45309' : '#dc2626' }}>
                                  {r.estado.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{new Date(r.fecha).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {(filtroLista === 'total' || filtroLista === 'Semáforo') && (
                <div className="print-break-inside-avoid">
                  <h3 style={{ color: '#BC955B', borderBottom: '2px solid #BC955B', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Semáforos</h3>
                  {reportesList.filter(r => r.tipo === 'Semáforo').length === 0 ? (
                    <p style={{ color: '#6F7271' }}>No hay reportes de semáforos en este periodo.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f1f5f9' }}>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Folio</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Jefe Turno</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Estación/Crucero</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Tipo de Falla</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Descripción (Notas)</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportesList.filter(r => r.tipo === 'Semáforo').map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.folio || 'N/A'}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.solicitante}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.estacion} / {r.crucero}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{r.tipoFalla}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem', fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.notas}>{r.notas || 'Sin notas'}</td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>
                                <span style={{ fontWeight: '600', color: r.estado === 'resuelto' ? '#166534' : r.estado === 'en_proceso' ? '#b45309' : '#dc2626' }}>
                                  {r.estado.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '0.8rem', fontSize: '0.9rem' }}>{new Date(r.fecha).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}