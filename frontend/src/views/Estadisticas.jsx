import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { FaFilePdf } from 'react-icons/fa'
import Swal from 'sweetalert2'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { API_BASE_URL } from '../config'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Estadisticas() {
  const { user } = useAuth()
  const [filtroTiempo, setFiltroTiempo] = useState('dia')
  const [filtroLista, setFiltroLista] = useState('total')
  const [reportesList, setReportesList] = useState([])
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const reporteRef = useRef(null)

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
        const response = await fetch(`${API_BASE_URL}/api/admin/estadisticas?filtroTiempo=${filtroTiempo}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        })
        const json = await response.json()
        if (response.ok && json.ok) {
          const stats = json.data
          setDatos({
            total: stats.totales?.total || 0,
            pendientes: stats.distribucion?.por_estado?.abierto || 0,
            enProceso: stats.distribucion?.por_estado?.en_proceso || 0,
            resueltos: stats.distribucion?.por_estado?.resuelto || 0,
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

  const getPeriodoTexto = () => {
    switch (filtroTiempo) {
      case 'dia': return 'Hoy'
      case 'semana': return 'Esta Semana'
      case 'mes': return 'Este Mes'
      case 'año': return 'Este Año'
      case 'todo': return 'Todo el Tiempo'
      default: return filtroTiempo
    }
  }

  const handleDescargarPDF = async () => {
    if (!reporteRef.current) return

    try {
      Swal.fire({
        title: 'Generando Reporte PDF',
        text: 'Por favor espere un momento...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      setGenerandoPdf(true)
      // Pausa breve para renderizar la vista compacta de 1 sola página
      await new Promise(r => setTimeout(r, 350))

      const element = reporteRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const margin = 8 // 8mm de margen
      const maxWidth = pageWidth - (margin * 2)
      const maxHeight = pageHeight - (margin * 2)

      let finalWidth = maxWidth
      let finalHeight = (canvas.height * maxWidth) / canvas.width

      // Si excede la altura de una hoja carta, escalar proporcionalmente para garantizar 1 sola página
      if (finalHeight > maxHeight) {
        const factor = maxHeight / finalHeight
        finalWidth = finalWidth * factor
        finalHeight = maxHeight
      }

      // Centrar horizontalmente
      const x = (pageWidth - finalWidth) / 2
      const y = margin

      doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST')
      
      const periodoSlug = getPeriodoTexto().replace(/\s+/g, '_')
      const fechaHoy = new Date().toISOString().slice(0, 10)
      doc.save(`Reporte_Estadisticas_SITMAH_${periodoSlug}_${fechaHoy}.pdf`)

      Swal.close()
    } catch (err) {
      console.error('Error al generar PDF:', err)
      Swal.fire('Error', 'No se pudo generar el reporte PDF. Intente de nuevo.', 'error')
    } finally {
      setGenerandoPdf(false)
    }
  }

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
          onClick={handleDescargarPDF}
          disabled={generandoPdf}
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
            cursor: generandoPdf ? 'wait' : 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            transition: 'background 0.2s',
            opacity: generandoPdf ? 0.7 : 1
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#BC955B' }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#691B31' }}
        >
          <FaFilePdf size={16} />
          {generandoPdf ? 'Generando PDF...' : 'Descargar Reporte PDF'}
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

      {/* Contenedor que se exporta al PDF (y se imprime) */}
      <div
        ref={reporteRef}
        style={{
          backgroundColor: '#ffffff',
          padding: generandoPdf ? '1.5rem 1.5rem 1rem 1.5rem' : '0',
          borderRadius: generandoPdf ? '12px' : '0'
        }}
      >
        {/* Encabezado oficial SITMAH (visible solo al generar PDF o al imprimir) */}
        <div
          className="print-only-block"
          style={{
            display: generandoPdf ? 'block' : 'none',
            marginBottom: '1.25rem',
            borderBottom: '3px solid #691B31',
            paddingBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', color: '#691B31', fontWeight: 'bold', margin: 0 }}>
                SITMAH - Reporte de Estadísticas
              </h1>
              <p style={{ color: '#6F7271', margin: '0.25rem 0', fontSize: '0.85rem' }}>
                Generado el {new Date().toLocaleDateString('es-MX')} a las {new Date().toLocaleTimeString('es-MX')}
              </p>
              <p style={{ color: '#BC955B', fontWeight: 'bold', margin: 0, fontSize: '0.9rem' }}>
                Periodo: {getPeriodoTexto()}
              </p>
            </div>
            <img
              src="/images/sitmah_logo.webp"
              alt="SITMAH"
              style={{ height: '42px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {cargando ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando panel de métricas...</p>
        ) : (
          <>
            <div
              className="resumen responsive-grid-5"
              style={{
                marginBottom: generandoPdf ? '1.25rem' : '3rem',
                display: generandoPdf ? 'grid' : undefined,
                gridTemplateColumns: generandoPdf ? 'repeat(5, 1fr)' : undefined,
                gap: generandoPdf ? '0.6rem' : undefined
              }}
            >
              <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: generandoPdf ? 'none' : '0 2px 10px rgba(0,0,0,0.06)', border: generandoPdf ? '1px solid #e2e8f0' : 'none', borderLeft: '4px solid #000000', padding: generandoPdf ? '0.75rem' : undefined }}>
                <p style={{ fontSize: '0.8rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Total Reportes</p>
                <h3 style={{ fontSize: generandoPdf ? '1.5rem' : '1.8rem', fontWeight: '700', margin: '0.35rem 0 0 0', color: '#000000' }}>{datos.total}</h3>
              </div>
              <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: generandoPdf ? 'none' : '0 2px 10px rgba(0,0,0,0.06)', border: generandoPdf ? '1px solid #e2e8f0' : 'none', borderLeft: '4px solid #dc2626', padding: generandoPdf ? '0.75rem' : undefined }}>
                <p style={{ fontSize: '0.8rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Pendientes</p>
                <h3 style={{ fontSize: generandoPdf ? '1.5rem' : '1.8rem', fontWeight: '700', margin: '0.35rem 0 0 0', color: '#dc2626' }}>{datos.pendientes}</h3>
              </div>
              <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: generandoPdf ? 'none' : '0 2px 10px rgba(0,0,0,0.06)', border: generandoPdf ? '1px solid #e2e8f0' : 'none', borderLeft: '4px solid #b45309', padding: generandoPdf ? '0.75rem' : undefined }}>
                <p style={{ fontSize: '0.8rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>En Proceso</p>
                <h3 style={{ fontSize: generandoPdf ? '1.5rem' : '1.8rem', fontWeight: '700', margin: '0.35rem 0 0 0', color: '#b45309' }}>{datos.enProceso}</h3>
              </div>
              <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: generandoPdf ? 'none' : '0 2px 10px rgba(0,0,0,0.06)', border: generandoPdf ? '1px solid #e2e8f0' : 'none', borderLeft: '4px solid #166534', padding: generandoPdf ? '0.75rem' : undefined }}>
                <p style={{ fontSize: '0.8rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Resueltos</p>
                <h3 style={{ fontSize: generandoPdf ? '1.5rem' : '1.8rem', fontWeight: '700', margin: '0.35rem 0 0 0', color: '#166534' }}>{datos.resueltos}</h3>
              </div>
              <div className="card-padding" style={{ background: 'white', borderRadius: '12px', boxShadow: generandoPdf ? 'none' : '0 2px 10px rgba(0,0,0,0.06)', border: generandoPdf ? '1px solid #e2e8f0' : 'none', borderLeft: '4px solid #BC955B', padding: generandoPdf ? '0.75rem' : undefined }}>
                <p style={{ fontSize: '0.8rem', color: '#6F7271', margin: 0, fontWeight: '500' }}>Resolución Promedio</p>
                <h3 style={{ fontSize: generandoPdf ? '1.3rem' : '1.5rem', fontWeight: '700', margin: '0.35rem 0 0 0', color: '#BC955B' }}>{datos.tiempoPromedio} hrs</h3>
              </div>
            </div>

            <div
              className="graficas-flex-container"
              style={{
                display: 'grid',
                gridTemplateColumns: generandoPdf ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: generandoPdf ? '1rem' : '2rem',
                marginBottom: generandoPdf ? '1.25rem' : '0'
              }}
            >
              {/* GRÁFICO OFICINAS */}
              <div
                className="grafico-card"
                style={{
                  background: 'white',
                  padding: generandoPdf ? '1rem' : '2rem',
                  borderRadius: '12px',
                  boxShadow: generandoPdf ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
                  border: generandoPdf ? '1px solid #e2e8f0' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <h3 style={{ marginBottom: '0.35rem', color: '#000000', fontWeight: '600', fontSize: generandoPdf ? '1.05rem' : '1.2rem', textAlign: 'center' }}>
                  Reportes Tecnológicos
                </h3>
                <div style={{ fontSize: generandoPdf ? '1.3rem' : '1.6rem', fontWeight: '700', color: '#691B31', marginBottom: generandoPdf ? '0.75rem' : '1.5rem', textAlign: 'center' }}>
                  Total: {datosOficina.total}
                </div>
                {datosOficina.total === 0 ? (
                  <p style={{ color: '#6F7271', padding: generandoPdf ? '1rem 0' : '2rem 0', textAlign: 'center', fontSize: '0.9rem' }}>No hay reportes en este periodo.</p>
                ) : (
                  <div style={{ width: '100%', maxWidth: generandoPdf ? '200px' : '280px' }}>
                    <Doughnut data={datosGraficoOficina} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } }, tooltip: { enabled: true } } }} plugins={[pluginDatalabels]} />
                  </div>
                )}
              </div>

              {/* GRÁFICO SEMÁFOROS */}
              <div
                className="grafico-card"
                style={{
                  background: 'white',
                  padding: generandoPdf ? '1rem' : '2rem',
                  borderRadius: '12px',
                  boxShadow: generandoPdf ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
                  border: generandoPdf ? '1px solid #e2e8f0' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <h3 style={{ marginBottom: '0.35rem', color: '#000000', fontWeight: '600', fontSize: generandoPdf ? '1.05rem' : '1.2rem', textAlign: 'center' }}>
                  Reportes de Semáforos
                </h3>
                <div style={{ fontSize: generandoPdf ? '1.3rem' : '1.6rem', fontWeight: '700', color: '#BC955B', marginBottom: generandoPdf ? '0.75rem' : '1.5rem', textAlign: 'center' }}>
                  Total: {datosSemaforo.total}
                </div>
                {datosSemaforo.total === 0 ? (
                  <p style={{ color: '#6F7271', padding: generandoPdf ? '1rem 0' : '2rem 0', textAlign: 'center', fontSize: '0.9rem' }}>No hay reportes en este periodo.</p>
                ) : (
                  <div style={{ width: '100%', maxWidth: generandoPdf ? '200px' : '280px' }}>
                    <Doughnut data={datosGraficoSemaforo} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } }, tooltip: { enabled: true } } }} plugins={[pluginDatalabels]} />
                  </div>
                )}
              </div>
            </div>

            {/* DETALLES DE REPORTES */}
            <div
              style={{ marginTop: generandoPdf ? '1.25rem' : '4rem' }}
              className="print-break-inside-avoid"
            >
              <h2 style={{ fontSize: generandoPdf ? '1.2rem' : '1.6rem', color: '#000000', marginBottom: generandoPdf ? '0.75rem' : '1rem' }}>
                Detalle de Reportes (Atendidos)
              </h2>
              
              {!generandoPdf && (
                <div className="no-print responsive-flex" style={{ gap: '0.8rem', marginBottom: '1.5rem' }}>
                  {[
                    { id: 'total', label: 'Todos' },
                    { id: 'Oficina', label: 'Reportes Tecnológicos' },
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
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: generandoPdf ? '1rem' : '2rem' }}>
                {(generandoPdf || filtroLista === 'total' || filtroLista === 'Oficina') && (
                  <div className="print-break-inside-avoid">
                    <h3 style={{ color: '#691B31', borderBottom: '2px solid #691B31', paddingBottom: '0.35rem', marginBottom: '0.75rem', fontSize: generandoPdf ? '1rem' : '1.15rem' }}>Reportes Tecnológicos</h3>
                    {reportesList.filter(r => r.tipo === 'Oficina').length === 0 ? (
                      <p style={{ color: '#6F7271', fontSize: '0.9rem', margin: '0.5rem 0' }}>No hay reportes tecnológicos en este periodo.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: generandoPdf ? '0.75rem' : '0.9rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Folio</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Solicitante</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Cargo</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Sede/Área</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Categoría</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Prioridad</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Fecha</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportesList.filter(r => r.tipo === 'Oficina').map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem' }}>{r.folio || 'N/A'}</td>
                                <td style={{ padding: '0.5rem' }}>{r.solicitante}</td>
                                <td style={{ padding: '0.5rem' }}>{r.cargo}</td>
                                <td style={{ padding: '0.5rem' }}>{r.sede} / {r.area}</td>
                                <td style={{ padding: '0.5rem' }}>{r.categoria}</td>
                                <td style={{ padding: '0.5rem' }}>
                                  <span style={{ textTransform: 'capitalize', color: r.prioridad === 'alta' ? '#dc2626' : r.prioridad === 'media' ? '#b45309' : '#166534' }}>{r.prioridad}</span>
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                  <span style={{ fontWeight: '600', color: r.estado === 'resuelto' ? '#166534' : r.estado === 'en_proceso' ? '#b45309' : '#dc2626' }}>
                                    {r.estado.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '0.5rem' }}>{new Date(r.fecha).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {(generandoPdf || filtroLista === 'total' || filtroLista === 'Semáforo') && (
                  <div className="print-break-inside-avoid">
                    <h3 style={{ color: '#BC955B', borderBottom: '2px solid #BC955B', paddingBottom: '0.35rem', marginBottom: '0.75rem', fontSize: generandoPdf ? '1rem' : '1.15rem' }}>Semáforos</h3>
                    {reportesList.filter(r => r.tipo === 'Semáforo').length === 0 ? (
                      <p style={{ color: '#6F7271', fontSize: '0.9rem', margin: '0.5rem 0' }}>No hay reportes de semáforos en este periodo.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: generandoPdf ? '0.75rem' : '0.9rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Folio</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Jefe Turno</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Estación/Crucero</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Tipo de Falla</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Descripción (Notas)</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Estado</th>
                              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Fecha</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportesList.filter(r => r.tipo === 'Semáforo').map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem' }}>{r.folio || 'N/A'}</td>
                                <td style={{ padding: '0.5rem' }}>{r.solicitante}</td>
                                <td style={{ padding: '0.5rem' }}>{r.estacion} / {r.crucero}</td>
                                <td style={{ padding: '0.5rem' }}>{r.tipoFalla}</td>
                                <td style={{ padding: '0.5rem', fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.notas}>{r.notas || 'Sin notas'}</td>
                                <td style={{ padding: '0.5rem' }}>
                                  <span style={{ fontWeight: '600', color: r.estado === 'resuelto' ? '#166534' : r.estado === 'en_proceso' ? '#b45309' : '#dc2626' }}>
                                    {r.estado.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '0.5rem' }}>{new Date(r.fecha).toLocaleDateString()}</td>
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
    </div>
  )
}