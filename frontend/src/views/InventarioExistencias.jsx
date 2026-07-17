import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaBoxes, FaPlus, FaEdit, FaTrashAlt, FaTimes, FaSearch, FaCogs, FaWrench, FaTools, FaHdd
} from 'react-icons/fa';

export default function InventarioExistencias() {
  const { user } = useAuth();
  const [existencias, setExistencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [modoAjusteDirecto, setModoAjusteDirecto] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'componente',
    cantidad: 1
  });

  const cargarExistencias = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      let url = `${API_BASE_URL}/api/inventario/existencias`;
      if (filtroCategoria) {
        url += `?categoria=${filtroCategoria}`;
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
    cargarExistencias();
  }, [filtroCategoria]);

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
    setModoAjusteDirecto(false);
    setForm({
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad
    });
    setModalAbierto(true);
  };

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
    setModoAjusteDirecto(false);
    setForm({
      nombre: '',
      categoria: 'componente',
      cantidad: 1
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
                    <button
                      onClick={() => handleEliminar(item.id)}
                      title="Eliminar refacción"
                      style={{
                        backgroundColor: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    >
                      <FaTrashAlt size={14} />
                    </button>
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
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Lector USB, Cable HDMI, Memoria RAM"
                  required
                />
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
