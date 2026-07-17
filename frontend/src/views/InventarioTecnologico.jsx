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
      }
    } catch (err) {
      console.error('Error al cargar equipos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, [pagina, busqueda, filtroTipo]);

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
    <main style={{ padding: '2.5rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>
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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por serie, inventario, marca, responsable..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          style={{ padding: '0.75rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px', flex: 1, minWidth: '300px', fontSize: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        />
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
          style={{ padding: '0.75rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '1rem', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(gruposOpciones).map(([groupName, opciones]) => (
            <optgroup label={groupName} key={groupName}>
              {opciones.map(opcion => (
                <option value={opcion.value} key={opcion.value}>{opcion.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '1.1rem' }}>Cargando inventario...</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1.25rem' }}>Tipo</th>
                <th style={{ padding: '1.25rem' }}>Identificación</th>
                <th style={{ padding: '1.25rem' }}>Marca / Modelo</th>
                <th style={{ padding: '1.25rem' }}>Ubicación</th>
                <th style={{ padding: '1.25rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem' }}>
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
                      {!['internet', 'aire', 'telefono'].includes(item.tipo) && <div style={{ fontWeight: '600', color: '#1e293b' }}>Inv: {item.numeroInventario || 'N/A'}</div>}
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Serie: {item.numeroSerie || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.marca || 'N/A'}</div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{item.modelo || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.areaUbicacion || 'N/A'}</div>
                      {['escritorio', 'laptop', 'radio'].includes(item.tipo) && <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Resp: {item.responsable || 'N/A'}</div>}
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
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '850px', maxHeight: '90vh', minHeight: '620px', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                    {/* Campos Base */}
                    <div><label style={labelStyle}>Marca</label><input type="text" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Modelo</label><input type="text" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} style={inputStyle} /></div>

                    {!sinInventario && (
                      <div><label style={labelStyle}>No. Inventario {form.tipo === 'router' ? '*' : ''}</label><input type="text" value={form.numeroInventario} onChange={e => setForm({ ...form, numeroInventario: e.target.value })} style={inputStyle} required={form.tipo === 'router'} /></div>
                    )}
                    <div><label style={labelStyle}>No. Serie</label><input type="text" value={form.numeroSerie} onChange={e => setForm({ ...form, numeroSerie: e.target.value })} style={inputStyle} /></div>

                    <div><label style={labelStyle}>Área / Ubicación</label><input type="text" value={form.areaUbicacion} onChange={e => setForm({ ...form, areaUbicacion: e.target.value })} style={inputStyle} /></div>

                    {/* Campos Responsable */}
                    {requiereResponsable && (
                      <>
                        <div><label style={labelStyle}>Responsable del equipo</label><input type="text" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} style={inputStyle} /></div>
                        {(form.tipo === 'escritorio' || form.tipo === 'laptop') && (
                          <div><label style={labelStyle}>Cargo del responsable</label><input type="text" value={form.cargoResponsable} onChange={e => setForm({ ...form, cargoResponsable: e.target.value })} style={inputStyle} /></div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Detalles Técnicos Dinámicos */}
                  <div style={{ padding: '1.75rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', marginBottom: '1.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Especificaciones Técnicas</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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
                          <div><label style={labelStyle}>Almacenamiento (Capacidad)</label><input type="text" value={form.detalles.almacenamiento || ''} onChange={e => handleDetalleChange('almacenamiento', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Memoria RAM</label><input type="text" value={form.detalles.ram || ''} onChange={e => handleDetalleChange('ram', e.target.value)} style={inputStyle} /></div>
                          {['escritorio', 'laptop'].includes(form.tipo) && (
                            <div><label style={labelStyle}>Tipo de Almacenamiento</label><input type="text" value={form.detalles.tipoAlmacenamiento || ''} onChange={e => handleDetalleChange('tipoAlmacenamiento', e.target.value)} style={inputStyle} placeholder="SSD / HDD" /></div>
                          )}
                        </>
                      )}

                      {tieneProcesador && (
                        <div><label style={labelStyle}>Procesador</label><input type="text" value={form.detalles.procesador || ''} onChange={e => handleDetalleChange('procesador', e.target.value)} style={inputStyle} /></div>
                      )}

                      {['escritorio', 'laptop', 'celular'].includes(form.tipo) && (
                        <div><label style={labelStyle}>Sistema Operativo</label><input type="text" value={form.detalles.sistemaOperativo || ''} onChange={e => handleDetalleChange('sistemaOperativo', e.target.value)} style={inputStyle} /></div>
                      )}

                      {['escritorio', 'laptop'].includes(form.tipo) && (
                        <>
                          <div><label style={labelStyle}>Tarjeta Gráfica</label><input type="text" value={form.detalles.tarjetaGrafica || ''} onChange={e => handleDetalleChange('tarjetaGrafica', e.target.value)} style={inputStyle} /></div>
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
                        <div><label style={labelStyle}>Megapíxeles (MP)</label><input type="text" value={form.detalles.megapixeles || ''} onChange={e => handleDetalleChange('megapixeles', e.target.value)} style={inputStyle} /></div>
                      )}

                      {form.tipo === 'dvr' && (
                        <div><label style={labelStyle}>Tipo (Análogo, IP)</label><input type="text" value={form.detalles.tipoDvr || ''} onChange={e => handleDetalleChange('tipoDvr', e.target.value)} style={inputStyle} /></div>
                      )}

                      {form.tipo === 'impresora' && (
                        <>
                          <div><label style={labelStyle}>Tipo (Monocromática o Color)</label><input type="text" value={form.detalles.tipoColor || ''} onChange={e => handleDetalleChange('tipoColor', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Propiedad (Rentada / SITMAH)</label><input type="text" value={form.detalles.propiedad || ''} onChange={e => handleDetalleChange('propiedad', e.target.value)} style={inputStyle} /></div>
                        </>
                      )}

                      {form.tipo === 'pantalla' && (
                        <div><label style={labelStyle}>Pulgadas</label><input type="text" value={form.detalles.pulgadas || ''} onChange={e => handleDetalleChange('pulgadas', e.target.value)} style={inputStyle} /></div>
                      )}

                      {form.tipo === 'videowall' && (
                        <div><label style={labelStyle}>Pantallas Asignadas</label><input type="text" value={form.detalles.pantallasAsignadas || ''} onChange={e => handleDetalleChange('pantallasAsignadas', e.target.value)} style={inputStyle} /></div>
                      )}

                      {['internet', 'telefono'].includes(form.tipo) && (
                        <>
                          <div><label style={labelStyle}>Compañía Proveedora</label><input type="text" value={form.detalles.compania || ''} onChange={e => handleDetalleChange('compania', e.target.value)} style={inputStyle} /></div>
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

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: '#115e59', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneTeclado} onChange={e => handleDetalleChange('tieneTeclado', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                          ¿Tiene Teclado Asignado?
                        </label>
                        {form.detalles.tieneTeclado && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem', paddingLeft: '1.75rem' }}>
                            <div><label style={labelStyle}>No. Inventario Teclado</label><input type="text" value={form.detalles.numeroInventarioTeclado || ''} onChange={e => handleDetalleChange('numeroInventarioTeclado', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Datos (Marca, Modelo, Serie)</label><input type="text" placeholder="Ej: Logitech MX Keys, SN:123..." value={form.detalles.datosTeclado || ''} onChange={e => handleDetalleChange('datosTeclado', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: '#115e59', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneMouse} onChange={e => handleDetalleChange('tieneMouse', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                          ¿Tiene Mouse Asignado?
                        </label>
                        {form.detalles.tieneMouse && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem', paddingLeft: '1.75rem' }}>
                            <div><label style={labelStyle}>No. Inventario Mouse</label><input type="text" value={form.detalles.numeroInventarioMouse || ''} onChange={e => handleDetalleChange('numeroInventarioMouse', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Datos (Marca, Modelo, Serie)</label><input type="text" placeholder="Ej: Logitech MX Master, SN:456..." value={form.detalles.datosMouse || ''} onChange={e => handleDetalleChange('datosMouse', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: '#115e59', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneMonitores} onChange={e => handleDetalleChange('tieneMonitores', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                          ¿Tiene Monitores Asignados?
                        </label>
                        {form.detalles.tieneMonitores && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem', paddingLeft: '1.75rem' }}>
                            <div><label style={labelStyle}>No. Inventario Monitor(es)</label><input type="text" value={form.detalles.numeroInventarioMonitores || ''} onChange={e => handleDetalleChange('numeroInventarioMonitores', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Datos (Cant, Marca, Mod, Serie)</label><input type="text" placeholder="Ej: 2x Dell P2419H, SN:789..." value={form.detalles.datosMonitores || ''} onChange={e => handleDetalleChange('datosMonitores', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
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

            <div style={{ display: 'flex', height: '320px' }}>
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
                  <div style={{ width: '45%', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#ffffff' }}>
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
                  <div style={{ width: '55%', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#f8fafc' }}>
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
