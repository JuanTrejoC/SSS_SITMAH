import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaLaptop, FaPlus, FaEdit, FaTrashAlt,
  FaChevronLeft, FaChevronRight, FaTimes, FaDesktop, FaMobileAlt, FaNetworkWired,
  FaServer, FaShieldAlt, FaWifi, FaVideo, FaHdd, FaBroadcastTower, FaPrint, FaTv,
  FaThLarge, FaGlobe, FaFan, FaPhone, FaMicrophone
} from 'react-icons/fa';

const TIPOS_EQUIPO = [
  { value: 'escritorio', label: 'Escritorio', icon: FaDesktop, group: 'Computadoras' },
  { value: 'laptop', label: 'Laptop', icon: FaLaptop, group: 'Computadoras' },
  { value: 'servidor', label: 'Servidor', icon: FaServer, group: 'Computadoras' },
  { value: 'router', label: 'Router', icon: FaNetworkWired, group: 'Redes y Conectividad' },
  { value: 'switch', label: 'Switch', icon: FaNetworkWired, group: 'Redes y Conectividad' },
  { value: 'firewall', label: 'Firewall', icon: FaShieldAlt, group: 'Redes y Conectividad' },
  { value: 'access_point', label: 'Access Point', icon: FaWifi, group: 'Redes y Conectividad' },
  { value: 'antena', label: 'Antena Microonda', icon: FaBroadcastTower, group: 'Redes y Conectividad' },
  { value: 'internet', label: 'Internet / Módem', icon: FaGlobe, group: 'Redes y Conectividad' },
  { value: 'camara', label: 'Cámara de Videovigilancia', icon: FaVideo, group: 'Videovigilancia' },
  { value: 'dvr', label: 'DVRs', icon: FaHdd, group: 'Videovigilancia' },
  { value: 'impresora', label: 'Impresora', icon: FaPrint, group: 'Impresión y Escaneo' },
  { value: 'plotter', label: 'Plotter', icon: FaPrint, group: 'Impresión y Escaneo' },
  { value: 'pantalla', label: 'Pantallas', icon: FaTv, group: 'Visualización' },
  { value: 'videowall', label: 'Controlador de Videowall', icon: FaThLarge, group: 'Visualización' },
  { value: 'celular', label: 'Celular', icon: FaMobileAlt, group: 'Comunicación' },
  { value: 'telefono', label: 'Teléfono', icon: FaPhone, group: 'Comunicación' },
  { value: 'radio', label: 'Radio', icon: FaMicrophone, group: 'Comunicación' },
  { value: 'aire', label: 'Aire Acondicionado', icon: FaFan, group: 'Infraestructura' },
  { value: 'lectora_tags', label: 'Lectora de Tags', icon: FaBroadcastTower, group: 'Peaje y Control' },
  { value: 'controladora', label: 'Controladora', icon: FaShieldAlt, group: 'Peaje y Control' },
];


export default function InventarioTecnologico() {
  const { user } = useAuth();

  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(10);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(getInitialForm());
  const [todosLosEquipos, setTodosLosEquipos] = useState([]);
  const [dashboardTipo, setDashboardTipo] = useState(null);
  const [dashboardArea, setDashboardArea] = useState(null);
  const [dashboardExpandido, setDashboardExpandido] = useState(false);
  const [sedesList, setSedesList] = useState([]);
  const [cargosList, setCargosList] = useState([]);

  const cargarTodosLosEquipos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?limit=1000&tipo=tecnologico`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setTodosLosEquipos(json.data);
      }
    } catch (err) {
      console.error('Error al cargar todos los equipos:', err);
    }
  };

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/catalogos/sedes`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.length > 0) {
            setSedesList(json.data.map(s => s.nombre));
          }
        }
      } catch (err) {
        console.error('Error al cargar sedes:', err);
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/catalogos/cargos`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.length > 0) {
            setCargosList(json.data.map(c => c.nombre));
          }
        }
      } catch (err) {
        console.error('Error al cargar cargos:', err);
      }
    };
    cargarCatalogos();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTodosLosEquipos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getInitialForm() {
    return {
      tipo: '',
      numeroInventario: '',
      numeroSerie: '',
      marca: '',
      modelo: '',
      responsable: '',
      cargoResponsable: '',
      areaUbicacion: '',
      detalles: {}
    };
  }

  const cargarEquipos = async () => {
    setCargando(true);
    try {
      const query = new URLSearchParams({
        page: pagina,
        limit: limite,
        search: busqueda,
        tipo: filtroTipo
      });
      const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?${query}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setEquipos(json.data);
        setTotal(json.meta.total);
        cargarTodosLosEquipos();
      }
    } catch (err) {
      console.error('Error al cargar equipos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarEquipos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, busqueda, filtroTipo]);

  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalAbierto]);

  const handleDetalleChange = (campo, valor) => {
    setForm(prev => ({
      ...prev,
      detalles: {
        ...prev.detalles,
        [campo]: valor
      }
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.tipo) {
      Swal.fire('Error', 'Seleccione un tipo de equipo', 'warning');
      return;
    }
    if (!form.areaUbicacion || !form.areaUbicacion.trim()) {
      Swal.fire('Error', 'El campo de Área / Ubicación es obligatorio', 'warning');
      return;
    }

    try {
      const url = editandoId
        ? `${API_BASE_URL}/api/inventario-tecnologico/${editandoId}`
        : `${API_BASE_URL}/api/inventario-tecnologico`;
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(form)
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        Swal.fire('Éxito', editandoId ? 'Equipo actualizado' : 'Equipo registrado', 'success');
        setModalAbierto(false);
        cargarEquipos();
      } else {
        Swal.fire('Error', json.error || 'Error al guardar el equipo', 'error');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      Swal.fire('Error', 'Error interno del servidor', 'error');
    }
  };

  const handleEditar = (item) => {
    setEditandoId(item.id);
    setForm({
      tipo: item.tipo || '',
      numeroInventario: item.numeroInventario || '',
      numeroSerie: item.numeroSerie || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      responsable: item.responsable || '',
      cargoResponsable: item.cargoResponsable || '',
      areaUbicacion: item.areaUbicacion || '',
      detalles: item.detalles || {}
    });
    setModalAbierto(true);
  };

  const handleEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Se eliminará este equipo del inventario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          Swal.fire('Eliminado', 'El equipo ha sido eliminado.', 'success');
          cargarEquipos();
        }
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  const resetForm = () => {
    setEditandoId(null);
    setForm(getInitialForm());
  };

  const getIconForTipo = (tipo) => {
    const equipo = TIPOS_EQUIPO.find(t => t.value === tipo);
    const Icon = equipo ? equipo.icon : FaLaptop;
    return <Icon size={16} />;
  };

  // UI Helpers para agrupar campos
  const tieneMAC = ['switch', 'servidor', 'firewall', 'access_point', 'camara', 'dvr', 'antena', 'impresora', 'plotter', 'router'].includes(form.tipo);
  const tieneIP = ['switch', 'servidor', 'firewall', 'access_point', 'camara', 'dvr', 'antena', 'impresora', 'plotter', 'router'].includes(form.tipo);
  const tienePuertosRed = ['switch', 'firewall', 'router', 'dvr'].includes(form.tipo);
  const tieneAlmacenamiento = ['servidor', 'escritorio', 'laptop', 'celular'].includes(form.tipo);
  const tieneProcesador = ['servidor', 'escritorio', 'laptop'].includes(form.tipo);
  const sinInventario = ['internet', 'aire', 'telefono'].includes(form.tipo);
  const requiereResponsable = ['escritorio', 'laptop', 'radio'].includes(form.tipo);

  // Agrupando las opciones por grupo
  const gruposOpciones = TIPOS_EQUIPO.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {});

  return (
    <main className="inventario-main">
      <style>{`
        .inventario-main {
          padding: 2.5rem;
          flex: 1;
          background-color: #f8fafc;
          overflow-y: auto;
          min-height: 800px;
          padding-bottom: 15rem;
        }
        .inventario-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .inventario-grid-spec {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .inventario-grid-periferico-4 {
          display: grid;
          grid-template-columns: 1.25fr 1fr 1fr 1fr;
          gap: 1rem;
          padding-left: 1.75rem;
        }
        .inventario-grid-periferico-5 {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr 1fr 1fr 1fr;
          gap: 1rem;
          padding-left: 1.75rem;
        }
        .modal-container-custom {
          background-color: white;
          border-radius: 16px;
          padding: 2.5rem;
          width: 100%;
          max-width: 850px;
          max-height: 90vh;
          min-height: 620px;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }
        .dropdown-select-container {
          display: flex;
          height: 320px;
        }
        .dropdown-left-pane {
          width: 45%;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
          padding: 0.5rem;
          background-color: #ffffff;
        }
        .dropdown-right-pane {
          width: 55%;
          overflow-y: auto;
          padding: 0.5rem;
          background-color: #f8fafc;
        }
        .filter-dropdown-container {
          display: flex;
          height: 240px;
        }
        .filter-dropdown-left {
          width: 45%;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
          padding: 0.5rem;
          background-color: #ffffff;
        }
        .filter-dropdown-right {
          width: 55%;
          overflow-y: auto;
          padding: 0.5rem;
          background-color: #f8fafc;
        }

        .filter-select-wrapper {
          position: relative;
          min-width: 220px;
        }
        .filter-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          z-index: 50;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          width: 380px;
        }

        @media (max-width: 768px) {
          .inventario-main {
            padding: 1rem 1rem 12rem 1rem;
          }
          .inventario-grid-2col {
            grid-template-columns: 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .inventario-grid-spec {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .inventario-grid-periferico-4 {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            padding-left: 0.5rem;
          }
          .inventario-grid-periferico-5 {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            padding-left: 0.5rem;
          }
          .modal-container-custom {
            padding: 1.25rem;
            min-height: auto;
          }
        }

        @media (max-width: 600px) {
          .dropdown-select-container {
            flex-direction: column;
            height: 350px;
          }
          .dropdown-left-pane {
            width: 100%;
            height: 150px;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .dropdown-right-pane {
            width: 100%;
            height: 200px;
          }
          .filter-dropdown-container {
            flex-direction: column;
            height: 280px;
          }
          .filter-dropdown-left {
            width: 100%;
            height: 120px;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .filter-dropdown-right {
            width: 100%;
            height: 160px;
          }
          .filter-select-wrapper {
            width: 100%;
            flex: 1;
          }
          .filter-dropdown-menu {
            width: 100%;
            min-width: 280px;
            left: 0;
            right: auto;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaLaptop /> Inventario Tecnológico
          </h1>
          <p style={{ color: '#6F7271', margin: '0.5rem 0 0', fontSize: '1rem' }}>
            Gestione el stock de todos los equipos tecnológicos e infraestructura.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setModalAbierto(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
            border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(105,27,49,0.2)', transition: 'background-color 0.2s', fontSize: '1rem'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#8a2441'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#691B31'}
        >
          <FaPlus /> Agregar Equipo
        </button>
      </div>


      {/* ================= DASHBOARD INTERACTIVO DRILL-DOWN ================= */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setDashboardExpandido(!dashboardExpandido)}>
          <h2 style={{ fontSize: '1.15rem', color: '#1E293B', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#691B31' }}></span> Dashboard Rápido e Interactivo de Inventario
          </h2>
          <button style={{ background: 'none', border: 'none', color: '#691B31', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
            {dashboardExpandido ? '▲ Ocultar' : '▼ Mostrar'}
          </button>
        </div>

        {dashboardExpandido && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            {/* BREADCRUMBS Y BOTÓN VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B', fontWeight: '500' }}>
                <span style={{ cursor: 'pointer', color: '#691B31' }} onClick={() => { setDashboardTipo(null); setDashboardArea(null); }}>Inicio</span>
                {dashboardTipo && (
                  <>
                    <span>/</span>
                    <span
                      style={{ cursor: dashboardArea ? 'pointer' : 'default', color: dashboardArea ? '#691B31' : '#475569', fontWeight: !dashboardArea ? 'bold' : '500' }}
                      onClick={() => { setDashboardArea(null); }}
                    >
                      {TIPOS_EQUIPO.find(t => t.value === dashboardTipo)?.label || dashboardTipo}
                    </span>
                  </>
                )}
                {dashboardArea && (
                  <>
                    <span>/</span>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>{dashboardArea}</span>
                  </>
                )}
              </div>

              {(dashboardTipo || dashboardArea) && (
                <button
                  onClick={() => {
                    if (dashboardArea) {
                      setDashboardArea(null);
                    } else if (dashboardTipo) {
                      setDashboardTipo(null);
                    }
                  }}
                  style={{
                    backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px',
                    padding: '0.35rem 0.75rem', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer',
                    color: '#475569', transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                >
                  Volver Atras
                </button>
              )}
            </div>

            {/* NIVEL 1: POR TIPO DE EQUIPO */}
            {!dashboardTipo && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>Selecciona un tipo de equipo para ver su distribución por área:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  {Object.entries(
                    todosLosEquipos.reduce((acc, curr) => {
                      const t = curr.tipo || 'otro';
                      acc[t] = (acc[t] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([tipo, count]) => {
                    const eqMeta = TIPOS_EQUIPO.find(t => t.value === tipo);
                    const label = eqMeta?.label || tipo;
                    const IconComp = eqMeta?.icon || FaLaptop;
                    return (
                      <div
                        key={tipo}
                        onClick={() => setDashboardTipo(tipo)}
                        style={{
                          backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                          padding: '1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ color: '#691B31', fontSize: '1.5rem' }}><IconComp /></div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155', textTransform: 'capitalize' }}>{label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{count}</div>
                      </div>
                    );
                  })}
                  {todosLosEquipos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', gridColumn: '1 / -1', color: '#64748b' }}>No hay equipos registrados en el inventario.</div>
                  )}
                </div>
              </div>
            )}

            {/* NIVEL 2: DESGLOSE POR ÁREA */}
            {dashboardTipo && !dashboardArea && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>
                  Distribución de <strong>{TIPOS_EQUIPO.find(t => t.value === dashboardTipo)?.label || dashboardTipo}s</strong> por área. Selecciona una para ver especificaciones de hardware:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  {Object.entries(
                    todosLosEquipos
                      .filter(eq => eq.tipo === dashboardTipo)
                      .reduce((acc, curr) => {
                        const area = curr.areaUbicacion || 'Sin Ubicación';
                        acc[area] = (acc[area] || 0) + 1;
                        return acc;
                      }, {})
                  ).map(([area, count]) => (
                    <div
                      key={area}
                      onClick={() => setDashboardArea(area)}
                      style={{
                        backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                        padding: '1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.25rem'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>{area}</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#691B31' }}>{count}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Ver Equipos</div>
                    </div>
                  ))}
                  {todosLosEquipos.filter(eq => eq.tipo === dashboardTipo).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', gridColumn: '1 / -1', color: '#64748b' }}>No hay equipos de este tipo.</div>
                  )}
                </div>
              </div>
            )}

            {/* NIVEL 3: ESPECIFICACIONES DETALLADAS */}
            {dashboardTipo && dashboardArea && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.25rem', marginTop: 0 }}>
                  Listado y especificaciones de hardware para <strong>{TIPOS_EQUIPO.find(t => t.value === dashboardTipo)?.label || dashboardTipo}s</strong> en <strong>{dashboardArea}</strong>:
                </p>
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>No. Inv / Serie</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Marca / Modelo</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Responsable</th>
                        {['escritorio', 'laptop', 'servidor'].includes(dashboardTipo) && (
                          <>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Memoria RAM</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Almacenamiento</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Procesador</th>
                          </>
                        )}
                        {!['escritorio', 'laptop', 'servidor'].includes(dashboardTipo) && (
                          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Detalles</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {todosLosEquipos
                        .filter(eq => eq.tipo === dashboardTipo && (eq.areaUbicacion || 'Sin Ubicación') === dashboardArea)
                        .map(eq => (
                          <tr key={eq.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#1E293B' }}>
                              <div>Inv: {eq.numeroInventario || '—'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>S/N: {eq.numeroSerie || '—'}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                              {eq.marca || '—'} {eq.modelo || '—'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                              {eq.responsable || '—'}
                              {eq.cargoResponsable && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{eq.cargoResponsable}</div>}
                            </td>
                            {['escritorio', 'laptop', 'servidor'].includes(dashboardTipo) && (
                              <>
                                <td style={{ padding: '0.75rem 1rem', color: '#0F172A', fontWeight: '600' }}>{eq.detalles?.ram || '—'}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                  {eq.detalles?.almacenamiento || '—'}
                                  {eq.detalles?.tipoAlmacenamiento && <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.25rem' }}>({eq.detalles.tipoAlmacenamiento})</span>}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{eq.detalles?.procesador || '—'}</td>
                              </>
                            )}
                            {!['escritorio', 'laptop', 'servidor'].includes(dashboardTipo) && (
                              <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.8rem' }}>
                                {Object.entries(eq.detalles || {}).map(([k, v]) => (
                                  <div key={k}><strong>{k}:</strong> {String(v)}</div>
                                ))}
                                {Object.keys(eq.detalles || {}).length === 0 && 'Sin especificaciones'}
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por serie, inventario, marca, responsable..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          style={{ padding: '0.75rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px', flex: 1, minWidth: '300px', fontSize: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        />
        <CustomFilterSelect
          value={filtroTipo}
          onChange={(val) => { setFiltroTipo(val); setPagina(1); }}
          opciones={TIPOS_EQUIPO}
          gruposOpciones={gruposOpciones}
        />
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '1.1rem' }}>Cargando inventario...</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1.25rem' }}>Tipo</th>
                <th style={{ padding: '1.25rem' }}>Responsable</th>
                <th style={{ padding: '1.25rem' }}>Identificación</th>
                <th style={{ padding: '1.25rem' }}>Marca / Modelo</th>
                <th style={{ padding: '1.25rem' }}>Ubicación</th>
                <th style={{ padding: '1.25rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem' }}>
                    No se encontraron equipos registrados.
                  </td>
                </tr>
              ) : (
                equipos.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600', width: 'fit-content' }}>
                        {getIconForTipo(item.tipo)} {TIPOS_EQUIPO.find(t => t.value === item.tipo)?.label || item.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {['escritorio', 'laptop', 'radio'].includes(item.tipo) ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.responsable || 'N/A'}</div>
                          {(item.tipo === 'escritorio' || item.tipo === 'laptop') && item.cargoResponsable && (
                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{item.cargoResponsable}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {!['internet', 'aire', 'telefono'].includes(item.tipo) && <div style={{ fontWeight: '600', color: '#1e293b' }}>Inv: {item.numeroInventario || 'N/A'}</div>}
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Serie: {item.numeroSerie || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.marca || 'N/A'}</div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{item.modelo || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.areaUbicacion || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <button onClick={() => handleEditar(item)} style={{ backgroundColor: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', marginRight: '0.5rem', padding: '0.5rem', borderRadius: '6px', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}>
                        <FaEdit size={16} />
                      </button>
                      <button onClick={() => handleEliminar(item.id)} style={{ backgroundColor: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fecaca'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fee2e2'}>
                        <FaTrashAlt size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Mostrando {((pagina - 1) * limite) + 1} a {Math.min(pagina * limite, total)} de {total}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '8px', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              ><FaChevronLeft size={12} /> Anterior</button>
              <button
                disabled={pagina * limite >= total}
                onClick={() => setPagina(p => p + 1)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '8px', cursor: pagina * limite >= total ? 'not-allowed' : 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >Siguiente <FaChevronRight size={12} /></button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="modal-container-custom">
            <button type="button" onClick={() => setModalAbierto(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
              <FaTimes size={16} />
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editandoId ? 'Actualizar Equipo' : 'Registrar Nuevo Equipo'}
            </h2>
            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>Tipo de Equipo *</label>
                <CustomEquipmentSelect
                  value={form.tipo}
                  onChange={(nuevoTipo) => {
                    setForm(prev => ({ ...prev, tipo: nuevoTipo, detalles: {} }));
                  }}
                  opciones={TIPOS_EQUIPO}
                  gruposOpciones={gruposOpciones}
                />
              </div>

              {form.tipo ? (
                <>
                  <div className="inventario-grid-2col">
                    {/* Campos Base */}
                    <div><label style={labelStyle}>Marca</label><input type="text" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Modelo</label><input type="text" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} style={inputStyle} /></div>

                    {!sinInventario && (
                      <div><label style={labelStyle}>No. Inventario {form.tipo === 'router' ? '*' : ''}</label><input type="text" value={form.numeroInventario} onChange={e => setForm({ ...form, numeroInventario: e.target.value })} style={inputStyle} required={form.tipo === 'router'} /></div>
                    )}
                    <div><label style={labelStyle}>No. Serie</label><input type="text" value={form.numeroSerie} onChange={e => setForm({ ...form, numeroSerie: e.target.value })} style={inputStyle} /></div>

                    <div>
                      <label style={labelStyle}>Área / Ubicación *</label>
                      <select
                        value={form.areaUbicacion}
                        onChange={e => setForm({ ...form, areaUbicacion: e.target.value })}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        required
                      >
                        <option value="">-- Seleccionar Ubicación --</option>
                        {sedesList.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Campos Responsable */}
                    {requiereResponsable && (
                      <>
                        <div><label style={labelStyle}>Responsable del equipo</label><input type="text" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} style={inputStyle} /></div>
                        {(form.tipo === 'escritorio' || form.tipo === 'laptop') && (
                          <div>
                            <label style={labelStyle}>Cargo del responsable</label>
                            <select
                              value={form.cargoResponsable}
                              onChange={e => setForm({ ...form, cargoResponsable: e.target.value })}
                              style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                              <option value="">-- Seleccionar Cargo --</option>
                              {cargosList.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Detalles Técnicos Dinámicos */}
                  <div style={{ padding: '1.75rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', marginBottom: '1.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Especificaciones Técnicas</h3>

                    <div className="inventario-grid-spec">
                      {tieneMAC && (
                        <div><label style={labelStyle}>Dirección MAC</label><input type="text" value={form.detalles.mac || ''} onChange={e => handleDetalleChange('mac', e.target.value)} style={inputStyle} placeholder="00:00:00:00:00:00" /></div>
                      )}
                      {tieneIP && (
                        <div><label style={labelStyle}>IP Predeterminada</label><input type="text" value={form.detalles.ipPredeterminada || ''} onChange={e => handleDetalleChange('ipPredeterminada', e.target.value)} style={inputStyle} placeholder="192.168.1.1" /></div>
                      )}

                      {tienePuertosRed && (
                        <>
                          {['switch', 'firewall', 'router'].includes(form.tipo) && <div><label style={labelStyle}>Puertos WAN</label><input type="number" value={form.detalles.puertosWan || ''} onChange={e => handleDetalleChange('puertosWan', e.target.value)} style={inputStyle} /></div>}
                          <div><label style={labelStyle}>Puertos LAN</label><input type="number" value={form.detalles.puertosLan || ''} onChange={e => handleDetalleChange('puertosLan', e.target.value)} style={inputStyle} /></div>
                          {['switch', 'firewall', 'router'].includes(form.tipo) && (
                            <>
                              <div><label style={labelStyle}>Puertos USB</label><input type="number" value={form.detalles.puertosUsb || ''} onChange={e => handleDetalleChange('puertosUsb', e.target.value)} style={inputStyle} /></div>
                              <div><label style={labelStyle}>Puertos Consola</label><input type="number" value={form.detalles.puertosConsola || ''} onChange={e => handleDetalleChange('puertosConsola', e.target.value)} style={inputStyle} /></div>
                            </>
                          )}
                        </>
                      )}

                      {tieneAlmacenamiento && (
                        <>
                          <CustomSpecSelect
                            label="Almacenamiento (Capacidad)"
                            value={form.detalles.almacenamiento || ''}
                            options={['120GB', '240GB', '480GB', '512GB', '1TB', '2TB']}
                            onChange={val => handleDetalleChange('almacenamiento', val)}
                            placeholder="Ej: 500GB SSD"
                          />
                          <CustomSpecSelect
                            label="Memoria RAM"
                            value={form.detalles.ram || ''}
                            options={['4GB', '8GB', '16GB', '32GB', '64GB']}
                            onChange={val => handleDetalleChange('ram', val)}
                            placeholder="Ej: 12GB DDR4"
                          />
                          {['escritorio', 'laptop'].includes(form.tipo) && (
                            <CustomSpecSelect
                              label="Tipo de Almacenamiento"
                              value={form.detalles.tipoAlmacenamiento || ''}
                              options={['SSD', 'HDD', 'M.2 NVMe', 'M.2 SATA']}
                              onChange={val => handleDetalleChange('tipoAlmacenamiento', val)}
                              placeholder="Ej: SSD + HDD"
                            />
                          )}
                        </>
                      )}

                      {tieneProcesador && (
                        <CustomSpecSelect
                          label="Procesador"
                          value={form.detalles.procesador || ''}
                          options={['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Intel Xeon', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9']}
                          onChange={val => handleDetalleChange('procesador', val)}
                          placeholder="Ej: Intel Core i5 11va Gen"
                        />
                      )}

                      {['escritorio', 'laptop', 'celular'].includes(form.tipo) && (
                        <CustomSpecSelect
                          label="Sistema Operativo"
                          value={form.detalles.sistemaOperativo || ''}
                          options={['Windows 10 Pro', 'Windows 11 Pro', 'Linux Ubuntu', 'Linux Debian', 'macOS', 'Android', 'iOS']}
                          onChange={val => handleDetalleChange('sistemaOperativo', val)}
                          placeholder="Ej: Windows Server 2022"
                        />
                      )}

                      {['escritorio', 'laptop'].includes(form.tipo) && (
                        <>
                          <CustomSpecSelect
                            label="Tarjeta Gráfica"
                            value={form.detalles.tarjetaGrafica || ''}
                            options={['Integrada', 'NVIDIA GeForce GTX 1650', 'NVIDIA GeForce RTX 3060', 'NVIDIA GeForce RTX 4060', 'AMD Radeon RX 6600']}
                            onChange={val => handleDetalleChange('tarjetaGrafica', val)}
                            placeholder="Ej: Intel Iris Xe"
                          />
                          <div><label style={labelStyle}>Conectividad de Red</label>
                            <select value={form.detalles.red || ''} onChange={e => handleDetalleChange('red', e.target.value)} style={inputStyle}>
                              <option value="">-- Seleccionar --</option>
                              <option value="wifi">Solo Wi-Fi</option>
                              <option value="ethernet">Solo Ethernet</option>
                              <option value="ambos">Ambos</option>
                            </select>
                          </div>
                        </>
                      )}

                      {['camara', 'dvr'].includes(form.tipo) && (
                        <CustomSpecSelect
                          label="Megapíxeles (MP)"
                          value={form.detalles.megapixeles || ''}
                          options={['2MP', '4MP', '5MP', '8MP (4K)']}
                          onChange={val => handleDetalleChange('megapixeles', val)}
                          placeholder="Ej: 3MP"
                        />
                      )}

                      {form.tipo === 'dvr' && (
                        <CustomSpecSelect
                          label="Tipo (Análogo, IP)"
                          value={form.detalles.tipoDvr || ''}
                          options={['Análogo', 'IP', 'Híbrido']}
                          onChange={val => handleDetalleChange('tipoDvr', val)}
                          placeholder="Ej: NVR IP"
                        />
                      )}

                      {form.tipo === 'impresora' && (
                        <>
                          <CustomSpecSelect
                            label="Tipo (Monocromática o Color)"
                            value={form.detalles.tipoColor || ''}
                            options={['Monocromática', 'Color']}
                            onChange={val => handleDetalleChange('tipoColor', val)}
                            placeholder="Ej: Monocromática Láser"
                          />
                          <CustomSpecSelect
                            label="Propiedad (Rentada / SITMAH)"
                            value={form.detalles.propiedad || ''}
                            options={['Rentada', 'SITMAH']}
                            onChange={val => handleDetalleChange('propiedad', val)}
                            placeholder="Ej: En comodato"
                          />
                        </>
                      )}

                      {form.tipo === 'pantalla' && (
                        <CustomSpecSelect
                          label="Pulgadas"
                          value={form.detalles.pulgadas || ''}
                          options={['24"', '27"', '32"', '43"', '55"', '65"', '75"']}
                          onChange={val => handleDetalleChange('pulgadas', val)}
                          placeholder='Ej: 21.5"'
                        />
                      )}

                      {form.tipo === 'videowall' && (
                        <div><label style={labelStyle}>Pantallas Asignadas</label><input type="text" value={form.detalles.pantallasAsignadas || ''} onChange={e => handleDetalleChange('pantallasAsignadas', e.target.value)} style={inputStyle} /></div>
                      )}

                      {['internet', 'telefono'].includes(form.tipo) && (
                        <>
                          <CustomSpecSelect
                            label="Compañía Proveedora"
                            value={form.detalles.compania || ''}
                            options={['Telmex', 'Totalplay', 'Izzi', 'Megacable']}
                            onChange={val => handleDetalleChange('compania', val)}
                            placeholder="Ej: Telcel"
                          />
                          <div><label style={labelStyle}>Número de Teléfono</label><input type="text" value={form.detalles.numeroTelefono || ''} onChange={e => handleDetalleChange('numeroTelefono', e.target.value)} style={inputStyle} /></div>
                        </>
                      )}

                      {form.tipo === 'internet' && (
                        <>
                          <div><label style={labelStyle}>Módem Asignado</label><input type="text" value={form.detalles.modem || ''} onChange={e => handleDetalleChange('modem', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>IP Fija</label><input type="text" value={form.detalles.ipFija || ''} onChange={e => handleDetalleChange('ipFija', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Megas de Velocidad</label><input type="text" value={form.detalles.megas || ''} onChange={e => handleDetalleChange('megas', e.target.value)} style={inputStyle} /></div>
                        </>
                      )}

                      {form.tipo === 'aire' && (
                        <div><label style={labelStyle}>Tonelaje</label><input type="text" value={form.detalles.tonelaje || ''} onChange={e => handleDetalleChange('tonelaje', e.target.value)} style={inputStyle} /></div>
                      )}

                    </div>
                  </div>

                  {/* PERIFÉRICOS (SOLO ESCRITORIO) */}
                  {form.tipo === 'escritorio' && (
                    <div style={{ padding: '1.75rem', backgroundColor: '#f0fdfa', borderRadius: '12px', border: '1px solid #ccfbf1', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f766e', marginBottom: '1.5rem', borderBottom: '1px solid #99f6e4', paddingBottom: '0.5rem' }}>Periféricos Asignados</h3>

                      <div style={{ marginBottom: '1.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: '#115e59', cursor: 'pointer', marginBottom: '1rem' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneTeclado} onChange={e => handleDetalleChange('tieneTeclado', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                          ¿Tiene Teclado Asignado?
                        </label>
                        {form.detalles.tieneTeclado && (
                          <div className="inventario-grid-periferico-4">
                            <div><label style={labelStyle}>No. Inventario</label><input type="text" placeholder="Inv. Teclado" value={form.detalles.numeroInventarioTeclado || ''} onChange={e => handleDetalleChange('numeroInventarioTeclado', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Marca</label><input type="text" placeholder="Ej: Logitech" value={form.detalles.marcaTeclado || ''} onChange={e => handleDetalleChange('marcaTeclado', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Modelo</label><input type="text" placeholder="Ej: MX Keys" value={form.detalles.modeloTeclado || ''} onChange={e => handleDetalleChange('modeloTeclado', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>No. Serie</label><input type="text" placeholder="Ej: SN1234" value={form.detalles.serieTeclado || ''} onChange={e => handleDetalleChange('serieTeclado', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '1.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: '#115e59', cursor: 'pointer', marginBottom: '1rem' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneMouse} onChange={e => handleDetalleChange('tieneMouse', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                          ¿Tiene Mouse Asignado?
                        </label>
                        {form.detalles.tieneMouse && (
                          <div className="inventario-grid-periferico-4">
                            <div><label style={labelStyle}>No. Inventario</label><input type="text" placeholder="Inv. Mouse" value={form.detalles.numeroInventarioMouse || ''} onChange={e => handleDetalleChange('numeroInventarioMouse', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Marca</label><input type="text" placeholder="Ej: Logitech" value={form.detalles.marcaMouse || ''} onChange={e => handleDetalleChange('marcaMouse', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Modelo</label><input type="text" placeholder="Ej: MX Master" value={form.detalles.modeloMouse || ''} onChange={e => handleDetalleChange('modeloMouse', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>No. Serie</label><input type="text" placeholder="Ej: SN5678" value={form.detalles.serieMouse || ''} onChange={e => handleDetalleChange('serieMouse', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: '#115e59', cursor: 'pointer', marginBottom: '1rem' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneMonitores} onChange={e => handleDetalleChange('tieneMonitores', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                          ¿Tiene Monitores Asignados?
                        </label>
                        {form.detalles.tieneMonitores && (() => {
                          const cantidadRaw = parseInt(form.detalles.cantidadMonitores) || 1;
                          const cantidad = Math.min(Math.max(cantidadRaw, 1), 3); // Limitar a un máximo de 3
                          const monitores = form.detalles.monitores || [];
                          
                          if (monitores.length === 0 && (form.detalles.numeroInventarioMonitores || form.detalles.marcaMonitores || form.detalles.modeloMonitores || form.detalles.serieMonitores)) {
                             monitores.push({
                               numeroInventario: form.detalles.numeroInventarioMonitores || '',
                               marca: form.detalles.marcaMonitores || '',
                               modelo: form.detalles.modeloMonitores || '',
                               serie: form.detalles.serieMonitores || ''
                             });
                          }

                          const displayMonitores = Array(cantidad).fill(0).map((_, i) => 
                            monitores[i] || { numeroInventario: '', marca: '', modelo: '', serie: '' }
                          );

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div>
                                <label style={labelStyle}>Cantidad de Monitores</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  max="3"
                                  placeholder="Ej: 1" 
                                  value={form.detalles.cantidadMonitores || ''} 
                                  onChange={e => {
                                    let val = parseInt(e.target.value);
                                    if (val > 3) val = 3;
                                    handleDetalleChange('cantidadMonitores', isNaN(val) ? '' : val.toString());
                                  }} 
                                  style={{...inputStyle, width: '150px'}} 
                                />
                              </div>
                              
                              {displayMonitores.map((monitor, index) => (
                                <div key={index} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#475569' }}>Monitor {index + 1}</h4>
                                  <div className="inventario-grid-periferico-4">
                                    <div><label style={labelStyle}>No. Inventario</label><input type="text" placeholder="Inv. Monitor" value={monitor.numeroInventario || ''} onChange={e => {
                                      const nuevos = [...displayMonitores];
                                      nuevos[index] = { ...nuevos[index], numeroInventario: e.target.value };
                                      handleDetalleChange('monitores', nuevos);
                                    }} style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Marca</label><input type="text" placeholder="Ej: Dell" value={monitor.marca || ''} onChange={e => {
                                      const nuevos = [...displayMonitores];
                                      nuevos[index] = { ...nuevos[index], marca: e.target.value };
                                      handleDetalleChange('monitores', nuevos);
                                    }} style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Modelo</label><input type="text" placeholder="Ej: P2419H" value={monitor.modelo || ''} onChange={e => {
                                      const nuevos = [...displayMonitores];
                                      nuevos[index] = { ...nuevos[index], modelo: e.target.value };
                                      handleDetalleChange('monitores', nuevos);
                                    }} style={inputStyle} /></div>
                                    <div><label style={labelStyle}>No. Serie</label><input type="text" placeholder="Ej: SN7890" value={monitor.serie || ''} onChange={e => {
                                      const nuevos = [...displayMonitores];
                                      nuevos[index] = { ...nuevos[index], serie: e.target.value };
                                      handleDetalleChange('monitores', nuevos);
                                    }} style={inputStyle} /></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                    </div>
                  )}

                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#cbd5e1', padding: '2rem', textAlign: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <FaDesktop size={64} style={{ opacity: 0.4 }} />
                  <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#94a3b8' }}>Seleccione un tipo de equipo para continuar</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto', paddingTop: '2rem' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '0.75rem 2rem', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#cbd5e1'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}>Cancelar</button>
                <button type="submit" disabled={!form.tipo} style={{ padding: '0.75rem 2.5rem', border: 'none', backgroundColor: form.tipo ? '#691B31' : '#cbd5e1', color: 'white', borderRadius: '8px', cursor: form.tipo ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '1rem', boxShadow: form.tipo ? '0 4px 6px rgba(105,27,49,0.2)' : 'none', transition: 'background-color 0.2s' }} onMouseOver={e => { if (form.tipo) e.currentTarget.style.backgroundColor = '#8a2441' }} onMouseOut={e => { if (form.tipo) e.currentTarget.style.backgroundColor = '#691B31' }}>Guardar Equipo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' };
const inputStyle = { width: '100%', padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#fff', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' };

const CustomEquipmentSelect = ({ value, onChange, opciones, gruposOpciones }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const selectedOption = opciones.find(o => o.value === value);

  const filteredOptions = opciones.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.group.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...inputStyle, padding: '0.75rem 1rem', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '600' }}>
              <selectedOption.icon color="#691B31" size={18} /> {selectedOption.label}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>-- Seleccionar el tipo de equipo --</span>
          )}
        </span>
        <FaChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', color: '#64748b' }} />
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 50, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <input
                type="text"
                placeholder="Buscar equipo (ej. Servidor, DVR...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="dropdown-select-container">
              {search ? (
                // Search Results
                <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
                  {filteredOptions.length > 0 ? filteredOptions.map(opcion => (
                    <div
                      key={opcion.value}
                      onClick={() => { onChange(opcion.value); setIsOpen(false); setSearch(''); }}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <opcion.icon color="#691B31" size={18} />
                      <span style={{ fontWeight: '500', color: '#334155' }}>{opcion.label}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>{opcion.group}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span>No se encontraron equipos para "{search}"</span>
                    </div>
                  )}
                </div>
              ) : (
                // Category Hover View
                <>
                  <div className="dropdown-left-pane">
                    {Object.keys(gruposOpciones).map((group) => (
                      <div
                        key={group}
                        onMouseEnter={() => setHoveredCategory(group)}
                        style={{
                          padding: '0.85rem 1rem',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: hoveredCategory === group ? '#691B31' : '#475569',
                          backgroundColor: hoveredCategory === group ? '#fdf2f8' : 'transparent',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.25rem',
                          transition: 'background-color 0.2s, color 0.2s'
                        }}
                      >
                        {group} <FaChevronRight size={10} style={{ opacity: hoveredCategory === group ? 1 : 0.3 }} />
                      </div>
                    ))}
                  </div>
                  <div className="dropdown-right-pane">
                    {hoveredCategory ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Equipos en {hoveredCategory}
                        </div>
                        {gruposOpciones[hoveredCategory].map(opcion => (
                          <div
                            key={opcion.value}
                            onClick={() => { onChange(opcion.value); setIsOpen(false); }}
                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s, color 0.15s' }}
                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                          >
                            <opcion.icon color="#64748b" size={16} /> <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opcion.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <FaLaptop size={32} color="#cbd5e1" />
                        Pasa el cursor sobre una categoría a la izquierda para ver los equipos disponibles
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CustomFilterSelect = ({ value, onChange, opciones, gruposOpciones }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const selectedOption = opciones.find(o => o.value === value);

  const filteredOptions = opciones.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.group.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="filter-select-wrapper">
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.75rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px',
          fontSize: '1rem', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem'
        }}
      >
        <span>
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '600' }}>
              <selectedOption.icon color="#691B31" size={16} /> {selectedOption.label}
            </span>
          ) : (
            <span style={{ color: '#475569', fontWeight: '500' }}>Todos los tipos</span>
          )}
        </span>
        <FaChevronRight size={12} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', color: '#64748b' }} />
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => { setIsOpen(false); setSearch(''); }} />
          <div className="filter-dropdown-menu">
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <input
                type="text"
                placeholder="Buscar tipo de equipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Opción "Todos los tipos" siempre visible */}
            <div
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', backgroundColor: !value ? '#f0f9ff' : 'transparent', transition: 'background-color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = !value ? '#f0f9ff' : 'transparent'}
            >
              <FaLaptop color="#64748b" size={16} />
              <span style={{ fontWeight: '600', color: !value ? '#0369a1' : '#475569' }}>Todos los tipos</span>
              {!value && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#0ea5e9', fontWeight: '600' }}>✓</span>}
            </div>

            <div className="filter-dropdown-container">
              {search ? (
                <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
                  {filteredOptions.length > 0 ? filteredOptions.map(opcion => (
                    <div
                      key={opcion.value}
                      onClick={() => { onChange(opcion.value); setIsOpen(false); setSearch(''); }}
                      style={{ padding: '0.7rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s', backgroundColor: value === opcion.value ? '#fdf2f8' : 'transparent' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = value === opcion.value ? '#fdf2f8' : 'transparent'}
                    >
                      <opcion.icon color="#691B31" size={16} />
                      <span style={{ fontWeight: '500', color: '#334155' }}>{opcion.label}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto', backgroundColor: '#e2e8f0', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>{opcion.group}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center' }}>
                      No se encontraron equipos para "{search}"
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="filter-dropdown-left">
                    {Object.keys(gruposOpciones).map((group) => (
                      <div
                        key={group}
                        onMouseEnter={() => setHoveredCategory(group)}
                        style={{
                          padding: '0.75rem 0.85rem',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: hoveredCategory === group ? '#691B31' : '#475569',
                          backgroundColor: hoveredCategory === group ? '#fdf2f8' : 'transparent',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.2rem',
                          transition: 'background-color 0.2s, color 0.2s'
                        }}
                      >
                        {group} <FaChevronRight size={9} style={{ opacity: hoveredCategory === group ? 1 : 0.3 }} />
                      </div>
                    ))}
                  </div>
                  <div className="filter-dropdown-right">
                    {hoveredCategory ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {hoveredCategory}
                        </div>
                        {gruposOpciones[hoveredCategory].map(opcion => (
                          <div
                            key={opcion.value}
                            onClick={() => { onChange(opcion.value); setIsOpen(false); setSearch(''); }}
                            style={{ padding: '0.65rem 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem', borderRadius: '8px', transition: 'background-color 0.15s', backgroundColor: value === opcion.value ? '#fdf2f8' : 'transparent' }}
                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                            onMouseOut={e => { e.currentTarget.style.backgroundColor = value === opcion.value ? '#fdf2f8' : 'transparent'; }}
                          >
                            <opcion.icon color={value === opcion.value ? '#691B31' : '#64748b'} size={15} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: value === opcion.value ? '#691B31' : '#475569' }}>{opcion.label}</span>
                            {value === opcion.value && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#691B31', fontWeight: '700' }}>✓</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <FaLaptop size={28} color="#cbd5e1" />
                        Pasa el cursor sobre una categoría
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CustomSpecSelect = ({ label, value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [esOtro, setEsOtro] = useState(false);
  const [customVal, setCustomVal] = useState('');

  useEffect(() => {
    if (value) {
      if (options.includes(value)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEsOtro(false);
        setCustomVal('');
      } else {
        setEsOtro(true);
        setCustomVal(value);
      }
    } else {
      if (!esOtro) {
        setCustomVal('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);

  const handleSelectOption = (opt) => {
    setEsOtro(false);
    setIsOpen(false);
    onChange(opt);
  };

  const handleSelectOtro = () => {
    setEsOtro(true);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCustomVal(val);
    onChange(val);
  };

  const displayVal = esOtro ? `Otro: ${value || '(Escriba abajo)'}` : (value || '-- Seleccionar --');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <label style={labelStyle}>{label}</label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff',
          fontWeight: value ? '600' : 'normal',
          color: value ? '#1e293b' : '#94a3b8',
          marginBottom: esOtro ? '0.5rem' : '0'
        }}
      >
        <span>{displayVal}</span>
        <FaChevronRight size={12} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', color: '#64748b' }} />
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            zIndex: 100,
            border: '1px solid #e2e8f0',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => handleSelectOption(opt)}
                style={{
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: value === opt ? '#691B31' : '#475569',
                  backgroundColor: value === opt ? '#fdf2f8' : 'transparent',
                  fontWeight: value === opt ? '600' : 'normal',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = value === opt ? '#fdf2f8' : 'transparent'}
              >
                {opt}
              </div>
            ))}

            <div
              onClick={handleSelectOtro}
              style={{
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: esOtro ? '#691B31' : '#475569',
                backgroundColor: esOtro ? '#fdf2f8' : 'transparent',
                fontWeight: esOtro ? '600' : 'normal',
                borderTop: '1px dashed #cbd5e1',
                transition: 'background-color 0.15s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = esOtro ? '#fdf2f8' : 'transparent'}
            >
              Otro (Especificar)
            </div>
          </div>
        </>
      )}

      {esOtro && (
        <input
          type="text"
          value={customVal}
          onChange={handleInputChange}
          placeholder={placeholder || `Escriba ${label.toLowerCase()}`}
          style={inputStyle}
          required
        />
      )}
    </div>
  );
};

