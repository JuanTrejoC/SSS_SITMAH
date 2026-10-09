import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FaLaptop, FaUser, FaBuilding, FaLink, FaTimes, FaSave } from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from './SearchableSelect';

export default function ModalAsignacionEquipo({ isOpen, onClose, reporteId, onSuccess }) {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [equiposStock, setEquiposStock] = useState([]);
  const [equiposActivos, setEquiposActivos] = useState([]);
  
  const [form, setForm] = useState({
    equipoNuevoId: '',
    responsable: '',
    cargoResponsable: '',
    areaUbicacion: '',
    direccion: '',
    equipoPrincipalId: ''
  });

  useEffect(() => {
    if (isOpen) {
      cargarEquipos();
      setForm({
        equipoNuevoId: '',
        responsable: '',
        cargoResponsable: '',
        areaUbicacion: '',
        direccion: '',
        equipoPrincipalId: ''
      });
    }
  }, [isOpen]);

  const cargarEquipos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?limit=5000`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setEquiposStock(data.filter(e => e.estatus === 'Stock'));
        setEquiposActivos(data.filter(e => e.estatus === 'Activo'));
      }
    } catch (err) {
      console.error('Error cargando equipos', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.equipoNuevoId) {
      return Swal.fire('Error', 'Selecciona el equipo a asignar', 'error');
    }

    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reportes/oficina/${reporteId}/asignar-equipo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(form)
      });
      
      const json = await res.json();
      if (res.ok) {
        Swal.fire('Éxito', 'Equipo asignado correctamente', 'success');
        onSuccess();
        onClose();
      } else {
        Swal.fire('Error', json.error || 'Error al asignar equipo', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px 12px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaLaptop color="#0284C7" /> Asignar Equipo / Componente
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* EQUIPO A ASIGNAR */}
            <div style={{ backgroundColor: '#F0F9FF', padding: '1rem', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#0369A1', marginBottom: '0.5rem' }}>
                Equipo en Stock a Asignar *
              </label>
              <SearchableSelect 
                value={form.equipoNuevoId}
                onChange={(val) => setForm({...form, equipoNuevoId: val})}
                placeholder='-- Buscar Equipo en Stock --'
                options={equiposStock.map(eq => ({
                  value: eq.id,
                  label: eq.tipo.toUpperCase() + ' - ' + eq.marca + ' ' + eq.modelo + ' (Inv: ' + (eq.numeroInventario || 'S/N') + ')',
                  searchTerms: [eq.tipo, eq.marca, eq.modelo, eq.numeroInventario, eq.numeroSerie].filter(Boolean)
                }))}
              />
            </div>

            {/* DATOS DE ASIGNACIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}><FaUser /> Responsable</label>
                <input 
                  type="text" 
                  value={form.responsable} 
                  onChange={e => setForm({...form, responsable: e.target.value})} 
                  placeholder="Nombre de la persona"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Cargo del Responsable</label>
                <input 
                  type="text" 
                  value={form.cargoResponsable} 
                  onChange={e => setForm({...form, cargoResponsable: e.target.value})} 
                  placeholder="Ej. Director, Analista..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}><FaBuilding /> Ubicación / Sede</label>
                <input 
                  type="text" 
                  value={form.areaUbicacion} 
                  onChange={e => setForm({...form, areaUbicacion: e.target.value})} 
                  placeholder="Ej. Bicentenario"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Área</label>
                <input 
                  type="text" 
                  value={form.direccion} 
                  onChange={e => setForm({...form, direccion: e.target.value})} 
                  placeholder="Ej. Recursos Humanos"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none' }}
                />
              </div>
            </div>

            {/* VINCULACIÓN */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                <FaLink /> Vincular a Equipo Principal (Opcional)
              </label>
              <SearchableSelect 
                  value={form.equipoPrincipalId}
                  onChange={(val) => setForm({...form, equipoPrincipalId: val})}
                  placeholder='-- Ninguno --'
                  options={[{ value: '', label: '-- Ninguno --' }, ...equiposActivos.map(eq => ({
                    value: eq.id,
                    label: eq.tipo.toUpperCase() + ' - ' + eq.marca + ' ' + eq.modelo + ' (Inv: ' + (eq.numeroInventario || 'S/N') + ') - Resp: ' + eq.responsable,
                    searchTerms: [eq.tipo, eq.marca, eq.modelo, eq.numeroInventario, eq.numeroSerie, eq.responsable].filter(Boolean)
                  }))]}
                />
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>Útil si estás asignando un monitor, teclado, o componente menor a una computadora.</p>
            </div>

          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={cargando} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#0284C7', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaSave /> {cargando ? 'Asignando...' : 'Asignar Equipo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
