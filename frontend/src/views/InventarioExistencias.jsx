import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaBoxes, FaPlus, FaEdit, FaTimes, FaSearch, FaCogs, FaWrench, FaTools, FaHdd, FaChevronRight
} from 'react-icons/fa';

const ARTICULOS_AGRUPADOS = {
  'Componentes': [
    { value: 'Memoria RAM DDR4 8GB', label: 'Memoria RAM DDR4 8GB', icon: FaCogs },
    { value: 'Memoria RAM DDR4 16GB', label: 'Memoria RAM DDR4 16GB', icon: FaCogs },
    { value: 'Disco Duro HDD 1TB', label: 'Disco Duro HDD 1TB', icon: FaCogs },
    { value: 'Disco Estado Sólido SSD 240GB', label: 'Disco Estado Sólido SSD 240GB', icon: FaCogs },
    { value: 'Disco Estado Sólido SSD 480GB', label: 'Disco Estado Sólido SSD 480GB', icon: FaCogs },
    { value: 'Disco Estado Sólido SSD 1TB', label: 'Disco Estado Sólido SSD 1TB', icon: FaCogs },
    { value: 'Fuente de Poder', label: 'Fuente de Poder', icon: FaCogs },
    { value: 'Pasta Térmica', label: 'Pasta Térmica', icon: FaCogs },
    { value: 'Pila CR2032', label: 'Pila CR2032', icon: FaCogs }
  ],
  'Accesorios': [
    { value: 'Cable HDMI', label: 'Cable HDMI', icon: FaWrench },
    { value: 'Cable de Red RJ45 (Cat 6)', label: 'Cable de Red RJ45 (Cat 6)', icon: FaWrench },
    { value: 'Conectores RJ45', label: 'Conectores RJ45', icon: FaWrench },
    { value: 'Adaptador USB a Ethernet', label: 'Adaptador USB a Ethernet', icon: FaWrench },
    { value: 'Adaptador HDMI a VGA', label: 'Adaptador HDMI a VGA', icon: FaWrench },
    { value: 'Cinta de Aislar', label: 'Cinta de Aislar', icon: FaWrench },
    { value: 'Cinchos plásticos', label: 'Cinchos plásticos', icon: FaWrench }
  ],
  'Periféricos': [
    { value: 'Mouse USB', label: 'Mouse USB', icon: FaHdd },
    { value: 'Teclado USB', label: 'Teclado USB', icon: FaHdd },
    { value: 'Lector de Tarjetas USB', label: 'Lector de Tarjetas USB', icon: FaHdd }
  ],
  'Equipos': [
    { value: 'Switch de 5 puertos', label: 'Switch de 5 puertos', icon: FaTools },
    { value: 'Access Point', label: 'Access Point', icon: FaTools }
  ]
};

const ARTICULOS_COMUNES = Object.values(ARTICULOS_AGRUPADOS).flat().map(item => item.value);

export default function InventarioExistencias() {
  const { user } = useAuth();
  const [existencias, setExistencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [esNombrePersonalizado, setEsNombrePersonalizado] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'componente',
    cantidad: 1,
    marca: '',
    modelo: '',
    numeroSerie: '',
    numeroInventario: '',
    tipoInventario: 'tecnologico'
  });

  const cargarExistencias = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      let url = `${API_BASE_URL}/api/inventario/existencias?tipoInventario=tecnologico`;
      if (filtroCategoria) {
        url += `&categoria=${filtroCategoria}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          setExistencias(json.data);
        }
      }
    } catch (err) {
      console.error('Error al cargar existencias:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarExistencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCategoria]);

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

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      Swal.fire('Error', 'El nombre del componente/artículo es obligatorio.', 'error');
      return;
    }

    const url = editandoId
      ? `${API_BASE_URL}/api/inventario/existencias/${editandoId}`
      : `${API_BASE_URL}/api/inventario/existencias`;
    const method = editandoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          Swal.fire({
            title: 'Éxito',
            text: editandoId ? 'Existencias actualizadas correctamente.' : 'Existencias ingresadas correctamente.',
            icon: 'success',
            confirmButtonColor: '#691B31'
          });
          setModalAbierto(false);
          resetForm();
          cargarExistencias();
        } else {
          Swal.fire('Error', json.error || 'No se pudo guardar la existencia.', 'error');
        }
      }
    } catch (err) {
      console.error('Error al guardar existencias:', err);
      Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
    }
  };

  const handleEditar = (item) => {
    setEditandoId(item.id);
    const esComun = ARTICULOS_COMUNES.includes(item.nombre || '');
    setEsNombrePersonalizado(!esComun && !!item.nombre);
    setForm({
      nombre: item.nombre || '',
      categoria: item.categoria || 'componente',
      cantidad: item.cantidad || 0,
      marca: item.marca || '',
      modelo: item.modelo || '',
      numeroSerie: item.numeroSerie || '',
      numeroInventario: item.numeroInventario || '',
      tipoInventario: 'tecnologico'
    });
    setModalAbierto(true);
  };

  // eslint-disable-next-line no-unused-vars
  const handleEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Se eliminará este artículo por completo del stock.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/existencias/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          Swal.fire('Eliminado', 'Artículo eliminado correctamente.', 'success');
          cargarExistencias();
        } else {
          Swal.fire('Error', json.error || 'No se pudo eliminar el artículo.', 'error');
        }
      } catch (err) {
        console.error('Error al eliminar:', err);
        Swal.fire('Error', 'Error al conectar con el servidor.', 'error');
      }
    }
  };

  const resetForm = () => {
    setEditandoId(null);
    setEsNombrePersonalizado(false);
    setForm({
      nombre: '',
      categoria: 'componente',
      cantidad: 1,
      marca: '',
      modelo: '',
      numeroSerie: '',
      numeroInventario: '',
      tipoInventario: 'tecnologico'
    });
  };

  const getCategoriaLabel = (cat) => {
    const categories = {
      componente: 'Componente',
      accesorio: 'Accesorio',
      periferico: 'Periférico',
      equipo: 'Equipo',
      herramienta: 'Herramienta'
    };
    return categories[cat] || cat;
  };

  const getCategoriaIcon = (cat) => {
    switch (cat) {
      case 'componente': return <FaCogs style={{ color: '#4f46e5' }} />;
      case 'accesorio': return <FaWrench style={{ color: '#0d9488' }} />;
      case 'periferico': return <FaHdd style={{ color: '#ea580c' }} />;
      case 'equipo': return <FaTools style={{ color: '#eab308' }} />;
      default: return <FaBoxes style={{ color: '#64748b' }} />;
    }
  };

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

  return (
    <main style={{ padding: '2.5rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto', minHeight: '800px', paddingBottom: '15rem' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaBoxes /> Inventario de Existencias
          </h1>
          <p style={{ color: '#6F7271', margin: '0.5rem 0 0', fontSize: '1rem' }}>
            Gestione el stock de componentes, accesorios, periféricos y equipos.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setModalAbierto(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
            border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(105,27,49,0.2)', transition: 'all 0.2s', fontSize: '1rem'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#8a2441'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#691B31'}
        >
          <FaPlus /> Ingresar Existencias
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        {/* Buscador */}
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Buscar existencias por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: '2.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          />
          <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>

        {/* Categoria */}
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={{
            padding: '0.75rem 1.25rem',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            fontSize: '0.95rem',
            color: '#475569',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
            minWidth: '220px'
          }}
        >
          <option value="">Todas las categorías</option>
          <option value="componente">Componentes</option>
          <option value="accesorio">Accesorios</option>
          <option value="periferico">Periféricos</option>
          <option value="equipo">Equipos</option>
          <option value="herramienta">Herramientas</option>
        </select>
      </div>

      {/* LISTA / GRID DE EXISTENCIAS */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '1.1rem' }}>Cargando inventario...</div>
      ) : existencias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#64748b' }}>
          No hay artículos registrados en el stock actualmente.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {existencias
            .filter(item => item.nombre.toLowerCase().includes(busqueda.toLowerCase()))
            .map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.06)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#691B31' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#475569',
                      textTransform: 'uppercase',
                      backgroundColor: '#f1f5f9',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px'
                    }}>
                      {getCategoriaIcon(item.categoria)}
                      {getCategoriaLabel(item.categoria)}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', margin: '0.75rem 0 0.25rem', fontWeight: '800', color: '#1e293b', textTransform: 'capitalize' }}>
                      {item.nombre}
                    </h3>
                    {(item.marca || item.modelo) && (
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {item.marca && <span style={{ fontWeight: '600' }}>{item.marca}</span>}
                        {item.marca && item.modelo && ' - '}
                        {item.modelo && <span>{item.modelo}</span>}
                      </div>
                    )}
                    {(item.numeroSerie || item.numeroInventario) && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        {item.numeroSerie && <span>S/N: {item.numeroSerie}</span>}
                        {item.numeroInventario && <span>Inv: {item.numeroInventario}</span>}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleEditar(item)}
                      title="Editar existencias"
                      style={{
                        backgroundColor: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                    >
                      <FaEdit size={14} />
                    </button>
                    {/* Botón de eliminar deshabilitado según requerimiento (solo se permite ajustar stock) */}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Stock Disponible:</span>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: item.cantidad > 5 ? '#0f766e' : item.cantidad > 0 ? '#b45309' : '#be123c',
                    backgroundColor: item.cantidad > 5 ? '#f0fdf4' : item.cantidad > 0 ? '#fffbeb' : '#fdf2f2',
                    padding: '0.1rem 0.8rem',
                    borderRadius: '8px'
                  }}>
                    {item.cantidad}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* FORM MODAL */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
            <button type="button" onClick={() => setModalAbierto(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
              <FaTimes size={16} />
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '2rem' }}>
              {editandoId ? 'Editar Existencias' : 'Ingresar Existencias'}
            </h2>

            <form onSubmit={handleGuardar}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Nombre del artículo *</label>
                <CustomArticleSelect
                  value={form.nombre}
                  onChange={nuevoNombre => setForm(prev => ({ ...prev, nombre: nuevoNombre }))}
                  esPersonalizado={esNombrePersonalizado}
                  setEsPersonalizado={setEsNombrePersonalizado}
                />

                {esNombrePersonalizado && (
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    style={{ ...inputStyle, marginTop: '0.75rem' }}
                    placeholder="Escriba el nombre del artículo personalizado"
                    required
                  />
                )}
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="componente">Componente</option>
                  <option value="accesorio">Accesorio</option>
                  <option value="periferico">Periférico</option>
                  <option value="equipo">Equipo</option>
                  <option value="herramienta">Herramienta</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Marca (opcional)</label>
                  <input
                    type="text"
                    value={form.marca}
                    onChange={e => setForm({ ...form, marca: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Modelo (opcional)</label>
                  <input
                    type="text"
                    value={form.modelo}
                    onChange={e => setForm({ ...form, modelo: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>No. de Serie (opcional)</label>
                  <input
                    type="text"
                    value={form.numeroSerie}
                    onChange={e => setForm({ ...form, numeroSerie: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>No. Inventario (opcional)</label>
                  <input
                    type="text"
                    value={form.numeroInventario}
                    onChange={e => setForm({ ...form, numeroInventario: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>{editandoId ? 'Cantidad actual' : 'Cantidad a ingresar'}</label>
                <input
                  type="number"
                  min="0"
                  value={form.cantidad}
                  onChange={e => setForm({ ...form, cantidad: Math.max(0, Number(e.target.value)) })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    padding: '0.65rem 1.25rem', border: '1px solid #CBD5E1', borderRadius: '8px',
                    backgroundColor: 'white', color: '#6F7271', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem', border: 'none', borderRadius: '8px',
                    backgroundColor: '#691B31', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
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

const CustomArticleSelect = ({ value, onChange, esPersonalizado, setEsPersonalizado }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState('Componentes');

  const todasLasOpciones = Object.entries(ARTICULOS_AGRUPADOS).flatMap(([group, items]) =>
    items.map(item => ({ ...item, group }))
  );

  const selectedOption = todasLasOpciones.find(o => o.value === value);

  const filteredOptions = todasLasOpciones.filter(o =>
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
          {esPersonalizado ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '600' }}>
              <FaBoxes color="#691B31" size={18} /> Otro: {value || '(Escriba abajo)'}
            </span>
          ) : selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '600' }}>
              {(() => {
                const Icon = selectedOption.icon;
                return <Icon color="#691B31" size={18} />;
              })()} {selectedOption.label}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>-- Seleccionar artículo --</span>
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
                placeholder="Buscar artículo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div style={{ display: 'flex', height: '280px' }}>
              {search ? (
                <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
                  {filteredOptions.length > 0 ? filteredOptions.map(opcion => {
                    const Icon = opcion.icon;
                    return (
                      <div
                        key={opcion.value}
                        onClick={() => {
                          setEsPersonalizado(false);
                          onChange(opcion.value);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Icon color="#691B31" size={18} />
                        <span style={{ fontWeight: '500', color: '#334155' }}>{opcion.label}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>{opcion.group}</span>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center' }}>
                      No se encontraron artículos para "{search}"
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ width: '45%', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#ffffff' }}>
                    {Object.keys(ARTICULOS_AGRUPADOS).map((group) => (
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
                    
                    <div
                      onMouseEnter={() => setHoveredCategory('Otro')}
                      onClick={() => {
                        setEsPersonalizado(true);
                        onChange('');
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        color: hoveredCategory === 'Otro' ? '#691B31' : '#475569',
                        backgroundColor: hoveredCategory === 'Otro' ? '#fdf2f8' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.5rem',
                        borderTop: '1px dashed #cbd5e1',
                        transition: 'background-color 0.2s, color 0.2s'
                      }}
                    >
                      Otro (Especificar) <FaChevronRight size={10} style={{ opacity: hoveredCategory === 'Otro' ? 1 : 0.3 }} />
                    </div>
                  </div>
                  
                  <div style={{ width: '55%', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#f8fafc' }}>
                    {hoveredCategory === 'Otro' ? (
                      <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '0.5rem' }}>Artículo Personalizado</div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                          Haz clic aquí para poder escribir un nombre personalizado.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEsPersonalizado(true);
                            onChange('');
                            setIsOpen(false);
                          }}
                          style={{
                            backgroundColor: '#691B31', color: 'white', border: 'none',
                            padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          Especificar Otro
                        </button>
                      </div>
                    ) : hoveredCategory ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Artículos en {hoveredCategory}
                        </div>
                        {ARTICULOS_AGRUPADOS[hoveredCategory].map(opcion => {
                          const Icon = opcion.icon;
                          return (
                            <div
                              key={opcion.value}
                              onClick={() => {
                                setEsPersonalizado(false);
                                onChange(opcion.value);
                                setIsOpen(false);
                              }}
                              style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s, color 0.15s' }}
                              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                            >
                              <Icon color="#64748b" size={16} /> <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opcion.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <FaBoxes size={32} color="#cbd5e1" />
                        Selecciona una categoría a la izquierda
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
