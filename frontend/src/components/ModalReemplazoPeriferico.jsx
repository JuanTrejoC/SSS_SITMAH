import React, { useState, useEffect } from 'react';
import { FaTimes, FaDesktop, FaCogs } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';

export default function ModalReemplazoPeriferico({ isOpen, onClose, user, onSuccess }) {
  const [equiposPrincipales, setEquiposPrincipales] = useState([]);
  const [perifericosStock, setPerifericosStock] = useState([]);
  
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [perifericoViejoSeleccionado, setPerifericoViejoSeleccionado] = useState('');
  const [perifericoNuevoSeleccionado, setPerifericoNuevoSeleccionado] = useState('');
  const [estadoViejo, setEstadoViejo] = useState('Mantenimiento');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (isOpen && user?.token) {
      cargarDatos();
    }
  }, [isOpen, user]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      // Cargar todos los equipos para encontrar principales (PCs, Laptops, etc.) y periféricos en stock
      const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?limit=2000`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        const items = json.data.items || [];
        
        // Equipos que pueden ser principales (que tengan o puedan tener componentes)
        const principales = items.filter(i => !['mouse', 'teclado', 'monitor', 'regulador'].includes(i.tipo.toLowerCase()));
        setEquiposPrincipales(principales);

        // Periféricos en Stock
        const stock = items.filter(i => i.estatus === 'Stock' && i.equipoPrincipalId === null);
        setPerifericosStock(stock);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!equipoSeleccionado || !perifericoViejoSeleccionado || !perifericoNuevoSeleccionado) {
      Swal.fire('Atención', 'Complete todos los campos requeridos', 'warning');
      return;
    }

    try {
      const payload = {
        equipoPrincipalId: equipoSeleccionado,
        perifericoViejoId: perifericoViejoSeleccionado,
        perifericoNuevoId: perifericoNuevoSeleccionado,
        nuevoEstadoViejo: estadoViejo
      };

      const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico/reemplazar-periferico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (res.ok && json.ok) {
        Swal.fire('Éxito', 'Periférico reemplazado correctamente', 'success');
        onSuccess(); // Refrescar vista
        onClose();
      } else {
        Swal.fire('Error', json.error || 'Ocurrió un error', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error de red', 'error');
    }
  };

  if (!isOpen) return null;

  const equipoActual = equiposPrincipales.find(e => e.id === Number(equipoSeleccionado));
  const componentesViejos = equipoActual?.componentes || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCogs color="#691B31" /> Reemplazar Periférico / Componente Mayor
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}><FaTimes /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleGuardar} style={{ padding: '1.5rem' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Cargando inventario...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Seleccionar Equipo Principal */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  1. Seleccionar Computadora / Equipo Principal
                </label>
                <select 
                  required
                  value={equipoSeleccionado}
                  onChange={e => {
                    setEquipoSeleccionado(e.target.value);
                    setPerifericoViejoSeleccionado('');
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b' }}
                >
                  <option value="">-- Seleccionar Equipo Principal --</option>
                  {equiposPrincipales.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tipo.toUpperCase()} - {eq.marca || ''} {eq.modelo || ''} (Inv: {eq.numeroInventario || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleccionar Periferico a Reemplazar */}
              {equipoSeleccionado && (
                <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#9a3412' }}>
                    2. Seleccionar Periférico Dañado a Reemplazar
                  </label>
                  {componentesViejos.length > 0 ? (
                    <select 
                      required
                      value={perifericoViejoSeleccionado}
                      onChange={e => setPerifericoViejoSeleccionado(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fdba74', backgroundColor: 'white', color: '#1e293b' }}
                    >
                      <option value="">-- Seleccionar Periférico --</option>
                      {componentesViejos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.tipo} - {p.marca || ''} {p.modelo || ''} (Inv: {p.numeroInventario || 'S/N'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ color: '#9a3412', fontSize: '0.9rem' }}>Este equipo no tiene periféricos asignados independientes.</div>
                  )}
                </div>
              )}

              {/* Seleccionar Periferico Nuevo */}
              {perifericoViejoSeleccionado && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#166534' }}>
                    3. Seleccionar Nuevo Periférico (Desde Stock)
                  </label>
                  <select 
                    required
                    value={perifericoNuevoSeleccionado}
                    onChange={e => setPerifericoNuevoSeleccionado(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #86efac', backgroundColor: '#f0fdf4', color: '#1e293b' }}
                  >
                    <option value="">-- Seleccionar Periférico en Stock --</option>
                    {perifericosStock
                      .filter(p => p.tipo.toLowerCase() === componentesViejos.find(c => c.id === Number(perifericoViejoSeleccionado))?.tipo.toLowerCase())
                      .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.tipo} - {p.marca || ''} {p.modelo || ''} (Inv: {p.numeroInventario || 'S/N'})
                      </option>
                    ))}
                  </select>
                  {perifericoNuevoSeleccionado && perifericosStock.filter(p => p.tipo.toLowerCase() === componentesViejos.find(c => c.id === Number(perifericoViejoSeleccionado))?.tipo.toLowerCase()).length === 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#dc2626' }}>
                      No hay periféricos de este tipo en Stock.
                    </div>
                  )}
                </div>
              )}

              {/* Estado del viejo */}
              {perifericoNuevoSeleccionado && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                    4. Nuevo estado del periférico reemplazado (el dañado)
                  </label>
                  <select 
                    required
                    value={estadoViejo}
                    onChange={e => setEstadoViejo(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b' }}
                  >
                    <option value="Mantenimiento">Mantenimiento (Por reparar)</option>
                    <option value="Baja">Baja Definitiva</option>
                  </select>
                </div>
              )}

            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={cargando || !equipoSeleccionado || !perifericoViejoSeleccionado || !perifericoNuevoSeleccionado} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#691B31', color: 'white', fontWeight: '600', cursor: (!equipoSeleccionado || !perifericoViejoSeleccionado || !perifericoNuevoSeleccionado) ? 'not-allowed' : 'pointer', opacity: (!equipoSeleccionado || !perifericoViejoSeleccionado || !perifericoNuevoSeleccionado) ? 0.5 : 1 }}>
              Confirmar Reemplazo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
