import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaWrench, FaHammer, FaPlus, FaEdit, FaTrashAlt, FaSearch, FaTimes, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const TIPOS_HERRAMIENTA = [
  { value: 'herramienta_tec', label: 'Herramienta de Tecnologías', icon: FaWrench },
  { value: 'herramienta_infra', label: 'Herramienta de Infraestructura', icon: FaHammer }
];

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#475569',
  marginBottom: '0.4rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  fontSize: '0.95rem',
  color: '#1E293B',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

export default function InventarioHerramientas() {
  const { user } = useAuth();

  const [herramientas, setHerramientas] = useState([]);
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
      tipo: 'herramienta_tec',
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

  const cargarHerramientas = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      const query = new URLSearchParams({
        page: pagina,
        limit: limite,
        search: busqueda,
        tipo: filtroTipo || 'herramientas' // Load all tools if no specific filter
      });
      const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?${query}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setHerramientas(json.data);
        setTotal(json.meta.total);
      }
    } catch (err) {
      console.error('Error al cargar herramientas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHerramientas();
  }, [pagina, busqueda, filtroTipo]);

  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalAbierto]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.tipo) {
      Swal.fire('Error', 'Seleccione un tipo de herramienta', 'warning');
      return;
    }
    // Validation: if it is herramienta_infra, "nombre de herramienta" (stored in modelo) is required
    if (form.tipo === 'herramienta_infra' && !form.modelo.trim()) {
      Swal.fire('Error', 'El nombre de la herramienta de infraestructura es obligatorio.', 'warning');
      return;
    }
    if (form.tipo === 'herramienta_tec' && !form.modelo.trim()) {
      Swal.fire('Error', 'El modelo de la herramienta de tecnologías es obligatorio.', 'warning');
      return;
    }
    if (!form.areaUbicacion || !form.areaUbicacion.trim()) {
      Swal.fire('Error', 'La ubicación (área) es obligatoria.', 'warning');
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
        Swal.fire('Éxito', editandoId ? 'Herramienta actualizada' : 'Herramienta registrada', 'success');
        setModalAbierto(false);
        cargarHerramientas();
      } else {
        Swal.fire('Error', json.error || 'Error al guardar la herramienta', 'error');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      Swal.fire('Error', 'Error interno del servidor', 'error');
    }
  };

  const handleEditar = (item) => {
    setEditandoId(item.id);
    setForm({
      tipo: item.tipo || 'herramienta_tec',
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
      text: 'Se eliminará esta herramienta del inventario.',
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
          Swal.fire('Eliminado', 'La herramienta ha sido eliminada.', 'success');
          cargarHerramientas();
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
    const found = TIPOS_HERRAMIENTA.find(t => t.value === tipo);
    const Icon = found ? found.icon : FaWrench;
    return <Icon size={16} />;
  };

  return (
    <main style={{ padding: '2.5rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto', minHeight: '800px', paddingBottom: '15rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaWrench /> Inventario de Herramientas
          </h1>
          <p style={{ color: '#6F7271', margin: '0.5rem 0 0', fontSize: '1rem' }}>
            Gestione las herramientas físicas de tecnologías y de infraestructura.
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
          <FaPlus /> Agregar Herramienta
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Buscar por serie, inventario, marca, modelo..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            style={{ ...inputStyle, paddingLeft: '2.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          />
          <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
          style={{
            padding: '0.75rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px',
            fontSize: '0.95rem', color: '#475569', backgroundColor: '#ffffff', cursor: 'pointer', outline: 'none', minWidth: '220px'
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="herramienta_tec">Herramientas de Tecnología</option>
          <option value="herramienta_infra">Herramientas de Infraestructura</option>
        </select>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '1.1rem' }}>Cargando herramientas...</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1.25rem' }}>Tipo</th>
                <th style={{ padding: '1.25rem' }}>No. Inventario / Serie</th>
                <th style={{ padding: '1.25rem' }}>Nombre / Modelo</th>
                <th style={{ padding: '1.25rem' }}>Marca</th>
                <th style={{ padding: '1.25rem' }}>Ubicación</th>
                <th style={{ padding: '1.25rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {herramientas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem' }}>
                    No se encontraron herramientas registradas.
                  </td>
                </tr>
              ) : (
                herramientas.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e2e8f0', color: '#334155', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600' }}>
                        {getIconForTipo(item.tipo)} {TIPOS_HERRAMIENTA.find(t => t.value === item.tipo)?.label || item.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>Inv: {item.numeroInventario || 'N/A'}</div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Serie: {item.numeroSerie || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.modelo || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.marca || 'N/A'}</div>
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
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
            <button type="button" onClick={() => setModalAbierto(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
              <FaTimes size={16} />
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '2rem' }}>
              {editandoId ? 'Actualizar Herramienta' : 'Registrar Nueva Herramienta'}
            </h2>
            <form onSubmit={handleGuardar}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Tipo de Herramienta *</label>
                <CustomToolTypeSelect
                  value={form.tipo}
                  onChange={nuevoTipo => setForm(prev => ({ ...prev, tipo: nuevoTipo }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                {/* Dynamic fields */}
                <div>
                  <label style={labelStyle}>
                    {form.tipo === 'herramienta_infra' ? 'Nombre de la Herramienta *' : 'Modelo / Nombre *'}
                  </label>
                  <input
                    type="text"
                    value={form.modelo}
                    onChange={e => setForm({ ...form, modelo: e.target.value })}
                    placeholder={form.tipo === 'herramienta_infra' ? 'Ej: Martillo de uña' : 'Ej: Crimpadora RJ45'}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {form.tipo === 'herramienta_infra' ? 'Marca (si aplica)' : 'Marca'}
                  </label>
                  <input
                    type="text"
                    value={form.marca}
                    onChange={e => setForm({ ...form, marca: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>No. Inventario</label>
                  <input
                    type="text"
                    value={form.numeroInventario}
                    onChange={e => setForm({ ...form, numeroInventario: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {form.tipo === 'herramienta_infra' ? 'No. Serie (si aplica)' : 'No. Serie'}
                  </label>
                  <input
                    type="text"
                    value={form.numeroSerie}
                    onChange={e => setForm({ ...form, numeroSerie: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Ubicación (Área) *</label>
                  <input
                    type="text"
                    value={form.areaUbicacion}
                    onChange={e => setForm({ ...form, areaUbicacion: e.target.value })}
                    placeholder="Ej: Mantenimiento, Sistemas, Site"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    padding: '0.65rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px',
                    backgroundColor: 'white', color: '#6F7271', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem', border: 'none', borderRadius: '8px',
                    backgroundColor: '#691B31', color: 'white', cursor: 'pointer', fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(105,27,49,0.2)'
                  }}
                >
                  {editandoId ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const CustomToolTypeSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState('herramienta_tec');

  const opciones = [
    { value: 'herramienta_tec', label: 'Herramienta de Tecnologías', group: 'Tecnologías', icon: FaWrench, description: 'Ponchadoras, crimpadoras, multímetros, etc.' },
    { value: 'herramienta_infra', label: 'Herramienta de Infraestructura', group: 'Infraestructura', icon: FaHammer, description: 'Martillos, destornilladores, pinzas, etc.' }
  ];

  const selectedOption = opciones.find(o => o.value === value);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...inputStyle, padding: '0.75rem 1rem', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '600' }}>
              {(() => {
                const Icon = selectedOption.icon;
                return <Icon color="#691B31" size={18} />;
              })()} {selectedOption.label}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>-- Seleccionar tipo de herramienta --</span>
          )}
        </span>
        <FaChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', color: '#64748b' }} />
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 50, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '200px' }}>
              <div style={{ width: '45%', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#ffffff' }}>
                {opciones.map((opcion) => (
                  <div
                    key={opcion.value}
                    onMouseEnter={() => setHoveredCategory(opcion.value)}
                    onClick={() => {
                      onChange(opcion.value);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      color: hoveredCategory === opcion.value ? '#691B31' : '#475569',
                      backgroundColor: hoveredCategory === opcion.value ? '#fdf2f8' : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                      transition: 'background-color 0.2s, color 0.2s'
                    }}
                  >
                    {opcion.group} <FaChevronRight size={10} style={{ opacity: hoveredCategory === opcion.value ? 1 : 0.3 }} />
                  </div>
                ))}
              </div>
              <div style={{ width: '55%', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#f8fafc' }}>
                {hoveredCategory ? (
                  (() => {
                    const opcion = opciones.find(o => o.value === hoveredCategory);
                    const Icon = opcion.icon;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Herramientas en {opcion.group}
                        </div>
                        <div
                          onClick={() => {
                            onChange(opcion.value);
                            setIsOpen(false);
                          }}
                          style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s, color 0.15s' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <Icon color="#64748b" size={16} /> 
                          <div>
                            <span style={{ fontSize: '0.95rem', fontWeight: '500', display: 'block' }}>{opcion.label}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{opcion.description}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <FaWrench size={32} color="#cbd5e1" />
                    Selecciona una categoría a la izquierda
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
