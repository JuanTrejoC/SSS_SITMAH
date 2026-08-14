import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FaChair, FaPlus, FaEdit, FaTrashAlt, FaChevronLeft, FaChevronRight, FaTimes, FaFileExcel } from 'react-icons/fa';

export default function InventarioMobiliario() {
  const { user } = useAuth();
  
  const [mobiliario, setMobiliario] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(10);
  const [busqueda, setBusqueda] = useState('');
  
  const [catalogoDirecciones, setCatalogoDirecciones] = useState([]);
  const [catalogoSubdirecciones, setCatalogoSubdirecciones] = useState([]);
  const [catalogoAreas, setCatalogoAreas] = useState([]);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  const getInitialForm = () => ({
    numeroInventario: '',
    bien: 'Mesa de trabajo',
    marca: '',
    modelo: '',
    numeroSerie: '',
    descripcion: '',
    direccion: '',
    subdireccion: '',
    area: '',
    nombreResguardante: ''
  });
  
  const [form, setForm] = useState(getInitialForm());
  
  const cargarMobiliario = async () => {
    setCargando(true);
    try {
      const query = new URLSearchParams({ page: pagina, limit: limite, search: busqueda });
      const res = await fetch(`${API_BASE_URL}/api/inventario/mobiliario?${query}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setMobiliario(json.data.items);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error('Error al cargar mobiliario:', err);
    } finally {
      setCargando(false);
    }
  };
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarMobiliario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, busqueda]);

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resDir, resSub, resArea] = await Promise.all([
          fetch(`${API_BASE_URL}/api/catalogos/areas`), // Dirección
          fetch(`${API_BASE_URL}/api/catalogos/subdirecciones`), // Subdirección
          fetch(`${API_BASE_URL}/api/catalogos/sedes`) // Área
        ]);
        const jsonDir = await resDir.json();
        const jsonSub = await resSub.json();
        const jsonArea = await resArea.json();
        if (jsonDir.ok) setCatalogoDirecciones(jsonDir.data);
        if (jsonSub.ok) setCatalogoSubdirecciones(jsonSub.data);
        if (jsonArea.ok) setCatalogoAreas(jsonArea.data);
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    };
    fetchCatalogos();
  }, []);
  
  const exportarAExcel = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/mobiliario/export?search=${busqueda}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventario_mobiliario.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        Swal.fire('Error', 'Error al exportar a Excel', 'error');
      }
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      Swal.fire('Error', 'Error al exportar a Excel', 'error');
    }
  };
  
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.numeroInventario || !form.bien || !form.descripcion || !form.direccion || !form.subdireccion || !form.area || !form.nombreResguardante) {
      Swal.fire('Error', 'Por favor complete todos los campos obligatorios', 'warning');
      return;
    }
    
    try {
      const url = editandoId 
        ? `${API_BASE_URL}/api/inventario/mobiliario/${editandoId}` 
        : `${API_BASE_URL}/api/inventario/mobiliario`;
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
        Swal.fire('Éxito', editandoId ? 'Mobiliario actualizado' : 'Mobiliario registrado', 'success');
        setModalAbierto(false);
        cargarMobiliario();
      } else {
        Swal.fire('Error', json.error || 'Error al guardar', 'error');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      Swal.fire('Error', 'Error interno del servidor', 'error');
    }
  };
  
  const handleEditar = (item) => {
    setEditandoId(item.id);
    setForm({
      numeroInventario: item.numeroInventario || '',
      bien: item.bien || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      numeroSerie: item.numeroSerie || '',
      descripcion: item.descripcion || '',
      direccion: item.direccion || '',
      subdireccion: item.subdireccion || '',
      area: item.area || '',
      nombreResguardante: item.nombreResguardante || ''
    });
    setModalAbierto(true);
  };
  
  const handleEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Se eliminará este mobiliario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/mobiliario/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          Swal.fire('Eliminado', 'El mobiliario ha sido eliminado.', 'success');
          cargarMobiliario();
        }
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };
  
  return (
    <main style={{ padding: '2.5rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto', minHeight: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaChair /> Mobiliario
          </h1>
          <p style={{ color: '#6F7271', margin: '0.5rem 0 0', fontSize: '1rem' }}>
            Gestione el stock de mesas, sillas y escritorios.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={exportarAExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10b981', color: 'white',
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(16,185,129,0.2)', transition: 'background-color 0.2s', fontSize: '1rem'
            }}
          >
            <FaFileExcel /> Exportar a Excel
          </button>
          <button
            onClick={() => { setEditandoId(null); setForm(getInitialForm()); setModalAbierto(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(105,27,49,0.2)', transition: 'background-color 0.2s', fontSize: '1rem'
            }}
          >
            <FaPlus /> Agregar Mobiliario
          </button>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Buscar mobiliario..." 
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
        />
      </div>
      
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>NO. INVENTARIO</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>BIEN</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>MARCA / MODELO</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>DESCRIPCIÓN</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>ÁREA / RESGUARDANTE</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
            ) : mobiliario.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron registros</td></tr>
            ) : mobiliario.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{m.numeroInventario}</td>
                <td style={{ padding: '1rem' }}>{m.bien}</td>
                <td style={{ padding: '1rem' }}>{m.marca || 'S/M'}<br/><span style={{fontSize:'0.8rem', color:'#64748B'}}>{m.modelo || 'S/M'}</span></td>
                <td style={{ padding: '1rem', maxWidth: '250px' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.descripcion}>
                    {m.descripcion}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {m.area}<br/><span style={{fontSize:'0.8rem', color:'#64748B'}}>{m.nombreResguardante}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button onClick={() => handleEditar(m)} style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', marginRight: '0.5rem' }}>
                    <FaEdit size={18} />
                  </button>
                  <button onClick={() => handleEliminar(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <FaTrashAlt size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b' }}>
            Mostrando {mobiliario.length} de {total}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: pagina === 1 ? 'not-allowed' : 'pointer' }}>
              <FaChevronLeft />
            </button>
            <span style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: '#f1f5f9', fontWeight: '500' }}>{pagina}</span>
            <button onClick={() => setPagina(p => p + 1)} disabled={pagina * limite >= total} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: pagina * limite >= total ? 'not-allowed' : 'pointer' }}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
      
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                {editandoId ? 'Editar Mobiliario' : 'Registrar Mobiliario'}
              </h2>
              <button onClick={() => setModalAbierto(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleGuardar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>No. de Inventario *</label>
                  <input required type="text" value={form.numeroInventario} onChange={e => setForm({...form, numeroInventario: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Bien *</label>
                  <select required value={form.bien} onChange={e => setForm({...form, bien: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}>
                    <option value="Mesa de trabajo">Mesa de trabajo</option>
                    <option value="Mesa tipo L">Mesa tipo L</option>
                    <option value="Silla ejecutiva">Silla ejecutiva</option>
                    <option value="Silla de visita">Silla de visita</option>
                    <option value="Escritorio">Escritorio</option>
                    <option value="Archivero">Archivero</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Marca</label>
                  <input type="text" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} placeholder="S/M" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Modelo</label>
                  <input type="text" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})} placeholder="S/M" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>No. de Serie</label>
                  <input type="text" value={form.numeroSerie} onChange={e => setForm({...form, numeroSerie: e.target.value})} placeholder="S/S" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Descripción *</label>
                <textarea required rows="3" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', resize: 'vertical' }}></textarea>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', margin: '0 0 1rem 0' }}>Ubicación y Resguardo</h3>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Dirección *</label>
                  <select required value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}>
                    <option value="">Seleccione una dirección</option>
                    <option value="S/N">S/N</option>
                    {catalogoDirecciones.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Subdirección *</label>
                  <select required value={form.subdireccion} onChange={e => setForm({...form, subdireccion: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}>
                    <option value="">Seleccione una subdirección</option>
                    <option value="S/N">S/N</option>
                    {catalogoSubdirecciones.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Área *</label>
                  <select required value={form.area} onChange={e => setForm({...form, area: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}>
                    <option value="">Seleccione un área</option>
                    <option value="S/N">S/N</option>
                    {catalogoAreas.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Nombre del Resguardante *</label>
                  <input required type="text" value={form.nombreResguardante} onChange={e => setForm({...form, nombreResguardante: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', backgroundColor: '#691B31', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px rgba(105,27,49,0.2)' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
