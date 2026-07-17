import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaLaptop, FaPlus, FaEdit, FaTrashAlt,
  FaChevronLeft, FaChevronRight, FaTimes, FaDesktop, FaMobileAlt, FaNetworkWired
} from 'react-icons/fa';

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
    switch (tipo) {
      case 'escritorio': return <FaDesktop size={16} />;
      case 'laptop': return <FaLaptop size={16} />;
      case 'celular': return <FaMobileAlt size={16} />;
      case 'router': return <FaNetworkWired size={16} />;
      default: return <FaLaptop size={16} />;
    }
  };

  return (
    <main style={{ padding: '2rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaLaptop /> Inventario Tecnológico
          </h1>
          <p style={{ color: '#6F7271', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Gestione el stock de equipos tecnológicos (Escritorios, Laptops, Celulares, Routers).
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setModalAbierto(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
            border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(105,27,49,0.15)'
          }}
        >
          <FaPlus /> Agregar Equipo
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por serie, inventario, marca, responsable..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          style={{ padding: '0.65rem 1rem', border: '1px solid #CBD5E1', borderRadius: '8px', flex: 1, minWidth: '250px' }}
        />
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
          style={{ padding: '0.65rem 1rem', border: '1px solid #CBD5E1', borderRadius: '8px' }}
        >
          <option value="">Todos los tipos</option>
          <option value="escritorio">Escritorio</option>
          <option value="laptop">Laptop</option>
          <option value="celular">Celular</option>
          <option value="router">Router</option>
        </select>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando inventario...</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Tipo</th>
                <th style={{ padding: '1rem' }}>No. Inventario / Serie</th>
                <th style={{ padding: '1rem' }}>Marca / Modelo</th>
                <th style={{ padding: '1rem' }}>Área / Responsable</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No se encontraron equipos registrados.
                  </td>
                </tr>
              ) : (
                equipos.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', width: 'fit-content', textTransform: 'capitalize' }}>
                        {getIconForTipo(item.tipo)} {item.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>Inv: {item.numeroInventario || 'N/A'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Serie: {item.numeroSerie || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.marca || 'N/A'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.modelo || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.areaUbicacion || 'N/A'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.responsable || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button onClick={() => handleEditar(item)} style={{ backgroundColor: 'transparent', border: 'none', color: '#BC955B', cursor: 'pointer', marginRight: '0.5rem' }}>
                        <FaEdit size={16} />
                      </button>
                      <button onClick={() => handleEliminar(item.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#A02142', cursor: 'pointer' }}>
                        <FaTrashAlt size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Mostrando {((pagina - 1) * limite) + 1} a {Math.min(pagina * limite, total)} de {total}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: pagina === 1 ? 'not-allowed' : 'pointer' }}
              ><FaChevronLeft size={10}/></button>
              <button
                disabled={pagina * limite >= total}
                onClick={() => setPagina(p => p + 1)}
                style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: pagina * limite >= total ? 'not-allowed' : 'pointer' }}
              ><FaChevronRight size={10}/></button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setModalAbierto(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', color: '#9B9B9A' }}>
              <FaTimes size={18} />
            </button>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#691B31', marginBottom: '1.5rem' }}>
              {editandoId ? 'Actualizar Equipo Tecnológico' : 'Registrar Equipo Tecnológico'}
            </h2>
            <form onSubmit={handleGuardar}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>Tipo de Equipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value;
                    setForm(prev => ({ ...prev, tipo: nuevoTipo, detalles: {} }));
                  }}
                  required
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="escritorio">Escritorio</option>
                  <option value="laptop">Laptop</option>
                  <option value="celular">Celular</option>
                  <option value="router">Router</option>
                </select>
              </div>

              {form.tipo && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Campos Base Compartidos */}
                    {(form.tipo === 'escritorio' || form.tipo === 'laptop' || form.tipo === 'celular' || form.tipo === 'router') && (
                      <>
                        <div><label style={labelStyle}>Marca</label><input type="text" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Modelo</label><input type="text" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})} style={inputStyle} /></div>
                        {form.tipo !== 'celular' && (
                          <>
                            <div><label style={labelStyle}>No. Inventario {form.tipo==='router' ? '*' : ''}</label><input type="text" value={form.numeroInventario} onChange={e => setForm({...form, numeroInventario: e.target.value})} style={inputStyle} required={form.tipo==='router'} /></div>
                            <div><label style={labelStyle}>No. Serie</label><input type="text" value={form.numeroSerie} onChange={e => setForm({...form, numeroSerie: e.target.value})} style={inputStyle} /></div>
                          </>
                        )}
                        <div><label style={labelStyle}>Área / Ubicación</label><input type="text" value={form.areaUbicacion} onChange={e => setForm({...form, areaUbicacion: e.target.value})} style={inputStyle} /></div>
                      </>
                    )}
                    
                    {/* Responsable (Escritorio, Laptop) */}
                    {(form.tipo === 'escritorio' || form.tipo === 'laptop') && (
                      <>
                        <div><label style={labelStyle}>Responsable del equipo</label><input type="text" value={form.responsable} onChange={e => setForm({...form, responsable: e.target.value})} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Cargo del responsable</label><input type="text" value={form.cargoResponsable} onChange={e => setForm({...form, cargoResponsable: e.target.value})} style={inputStyle} /></div>
                      </>
                    )}
                  </div>

                  {/* Detalles Específicos */}
                  <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: '#334155', marginBottom: '1rem' }}>Detalles Técnicos</h3>
                    
                    {/* ESCRITORIO O LAPTOP */}
                    {(form.tipo === 'escritorio' || form.tipo === 'laptop') && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label style={labelStyle}>Sistema Operativo</label><input type="text" value={form.detalles.sistemaOperativo || ''} onChange={e => handleDetalleChange('sistemaOperativo', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Procesador</label><input type="text" value={form.detalles.procesador || ''} onChange={e => handleDetalleChange('procesador', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Tipo de Almacenamiento</label><input type="text" value={form.detalles.tipoAlmacenamiento || ''} onChange={e => handleDetalleChange('tipoAlmacenamiento', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Almacenamiento (Capacidad)</label><input type="text" value={form.detalles.almacenamiento || ''} onChange={e => handleDetalleChange('almacenamiento', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>RAM</label><input type="text" value={form.detalles.ram || ''} onChange={e => handleDetalleChange('ram', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Tarjeta Gráfica</label><input type="text" value={form.detalles.tarjetaGrafica || ''} onChange={e => handleDetalleChange('tarjetaGrafica', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Conectividad de Red</label>
                          <select value={form.detalles.red || ''} onChange={e => handleDetalleChange('red', e.target.value)} style={inputStyle}>
                            <option value="">-- Seleccionar --</option>
                            <option value="wifi">Solo Wi-Fi</option>
                            <option value="ethernet">Solo Ethernet</option>
                            <option value="ambos">Ambos</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* CELULAR */}
                    {form.tipo === 'celular' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label style={labelStyle}>Almacenamiento</label><input type="text" value={form.detalles.almacenamiento || ''} onChange={e => handleDetalleChange('almacenamiento', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>RAM</label><input type="text" value={form.detalles.ram || ''} onChange={e => handleDetalleChange('ram', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Sistema Operativo</label><input type="text" value={form.detalles.sistemaOperativo || ''} onChange={e => handleDetalleChange('sistemaOperativo', e.target.value)} style={inputStyle} /></div>
                      </div>
                    )}

                    {/* ROUTER */}
                    {form.tipo === 'router' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label style={labelStyle}>Dirección MAC</label><input type="text" value={form.detalles.mac || ''} onChange={e => handleDetalleChange('mac', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Puertos WAN</label><input type="number" value={form.detalles.puertosWan || ''} onChange={e => handleDetalleChange('puertosWan', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Puertos LAN</label><input type="number" value={form.detalles.puertosLan || ''} onChange={e => handleDetalleChange('puertosLan', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Puertos USB</label><input type="number" value={form.detalles.puertosUsb || ''} onChange={e => handleDetalleChange('puertosUsb', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Puertos Consola</label><input type="number" value={form.detalles.puertosConsola || ''} onChange={e => handleDetalleChange('puertosConsola', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>IP Predeterminada</label><input type="text" value={form.detalles.ipPredeterminada || ''} onChange={e => handleDetalleChange('ipPredeterminada', e.target.value)} style={inputStyle} /></div>
                      </div>
                    )}
                  </div>

                  {/* PERIFÉRICOS (SOLO ESCRITORIO) */}
                  {form.tipo === 'escritorio' && (
                    <div style={{ padding: '1.5rem', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #ccfbf1', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', color: '#0f766e', marginBottom: '1rem' }}>Periféricos Asignados</h3>
                      
                      <div style={{ marginBottom: '1rem', borderBottom: '1px solid #99f6e4', paddingBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#115e59', marginBottom: '0.5rem' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneTeclado} onChange={e => handleDetalleChange('tieneTeclado', e.target.checked)} />
                          ¿Tiene Teclado Asignado?
                        </label>
                        {form.detalles.tieneTeclado && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                            <div><label style={labelStyle}>No. Inventario Teclado</label><input type="text" value={form.detalles.numeroInventarioTeclado || ''} onChange={e => handleDetalleChange('numeroInventarioTeclado', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Datos (Marca, Modelo, Serie)</label><input type="text" placeholder="Ej: Logitech MX Keys, SN:123..." value={form.detalles.datosTeclado || ''} onChange={e => handleDetalleChange('datosTeclado', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '1rem', borderBottom: '1px solid #99f6e4', paddingBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#115e59', marginBottom: '0.5rem' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneMouse} onChange={e => handleDetalleChange('tieneMouse', e.target.checked)} />
                          ¿Tiene Mouse Asignado?
                        </label>
                        {form.detalles.tieneMouse && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                            <div><label style={labelStyle}>No. Inventario Mouse</label><input type="text" value={form.detalles.numeroInventarioMouse || ''} onChange={e => handleDetalleChange('numeroInventarioMouse', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Datos (Marca, Modelo, Serie)</label><input type="text" placeholder="Ej: Logitech MX Master, SN:456..." value={form.detalles.datosMouse || ''} onChange={e => handleDetalleChange('datosMouse', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#115e59', marginBottom: '0.5rem' }}>
                          <input type="checkbox" checked={!!form.detalles.tieneMonitores} onChange={e => handleDetalleChange('tieneMonitores', e.target.checked)} />
                          ¿Tiene Monitores Asignados?
                        </label>
                        {form.detalles.tieneMonitores && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                            <div><label style={labelStyle}>No. Inventario Monitor(es)</label><input type="text" value={form.detalles.numeroInventarioMonitores || ''} onChange={e => handleDetalleChange('numeroInventarioMonitores', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Datos (Cant, Marca, Mod, Serie)</label><input type="text" placeholder="Ej: 2x Dell P2419H, SN:789..." value={form.detalles.datosMonitores || ''} onChange={e => handleDetalleChange('datosMonitores', e.target.value)} style={inputStyle} /></div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '0.65rem 1.5rem', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                    <button type="submit" style={{ padding: '0.65rem 1.5rem', border: 'none', backgroundColor: '#691B31', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Guardar</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' };
const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' };
