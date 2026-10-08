import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FaLaptop, FaExchangeAlt, FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from './SearchableSelect';

export default function ModalReemplazoEquipo({ isOpen, onClose, reporteId, onSuccess }) {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [equiposStock, setEquiposStock] = useState([]);
  const [equiposActivos, setEquiposActivos] = useState([]);
  
  const [form, setForm] = useState({
    equipoViejoId: '',
    equipoNuevoId: '',
    estadoViejo: 'Baja',
    observacionesBaja: ''
  });

  useEffect(() => {
    if (isOpen) {
      cargarEquipos();
      setForm({
        equipoViejoId: '',
        equipoNuevoId: '',
        estadoViejo: 'Baja',
        observacionesBaja: ''
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
        setEquiposActivos(data.filter(e => e.estatus === 'Activo' || e.estatus === 'Mantenimiento'));
      }
    } catch (err) {
      console.error('Error cargando equipos', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.equipoViejoId || !form.equipoNuevoId) {
      return Swal.fire('Error', 'Selecciona ambos equipos para el reemplazo', 'error');
    }

    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reportes/oficina/${reporteId}/reemplazar-equipo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(form)
      });
      
      const json = await res.json();
      if (res.ok) {
        Swal.fire('Éxito', 'Equipo reemplazado correctamente', 'success');
        onSuccess();
        onClose();
      } else {
        Swal.fire('Error', json.error || 'Error al reemplazar equipo', 'error');
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
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: '12px 12px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaExchangeAlt color="#D97706" /> Reemplazar Equipo / Componente
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748B', fontSize: '0.875rem' }}>
            El equipo nuevo heredará automáticamente el responsable, la ubicación y las vinculaciones del equipo viejo.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* EQUIPO A RETIRAR */}
            <div style={{ backgroundColor: '#FEF2F2', padding: '1rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#B91C1C', marginBottom: '0.5rem' }}>
                Equipo Viejo a Retirar (Baja / Refacciones) *
              </label>
              <SearchableSelect 
                value={form.equipoViejoId}
                onChange={(val) => setForm({...form, equipoViejoId: val})}
                placeholder='-- Buscar Equipo Activo --'
                options={equiposActivos.map(eq => ({
                  value: eq.id,
                  label: eq.tipo.toUpperCase() + ' - ' + eq.marca + ' ' + eq.modelo + ' (Inv: ' + (eq.numeroInventario || 'S/N') + ') - Resp: ' + eq.responsable,
                  searchTerms: [eq.tipo, eq.marca, eq.modelo, eq.numeroInventario, eq.numeroSerie, eq.responsable].filter(Boolean)
                }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: '#94A3B8' }}>
              <FaExchangeAlt size={24} />
            </div>

            {/* EQUIPO NUEVO */}
            <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#15803D', marginBottom: '0.5rem' }}>
                Equipo Nuevo (En Stock) *
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

            {/* DESTINO DEL VIEJO */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                Destino del equipo viejo *
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" name="estadoViejo" value="Baja" checked={form.estadoViejo === 'Baja'} onChange={() => setForm({...form, estadoViejo: 'Baja'})} />
                  Dar de Baja
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" name="estadoViejo" value="Refacciones" checked={form.estadoViejo === 'Refacciones'} onChange={() => setForm({...form, estadoViejo: 'Refacciones'})} />
                  Refacciones
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" name="estadoViejo" value="Mantenimiento" checked={form.estadoViejo === 'Mantenimiento'} onChange={() => setForm({...form, estadoViejo: 'Mantenimiento'})} />
                  Mantenimiento
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" name="estadoViejo" value="Stock" checked={form.estadoViejo === 'Stock'} onChange={() => setForm({...form, estadoViejo: 'Stock'})} />
                  Stock
                </label>
              </div>

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                Observaciones sobre la baja/retiro
              </label>
              <input 
                type="text" 
                value={form.observacionesBaja} 
                onChange={e => setForm({...form, observacionesBaja: e.target.value})} 
                placeholder="Motivo o detalle adicional..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none' }}
              />
            </div>

          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={cargando} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#D97706', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaSave /> {cargando ? 'Procesando...' : 'Realizar Reemplazo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
