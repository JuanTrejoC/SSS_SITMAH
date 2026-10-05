import { useState, useEffect, useMemo } from 'react';
import { FaClipboardCheck, FaPlus, FaSearch, FaFileWord, FaCheck } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { generarResguardoDocx } from '../utils/resguardoDocx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Resguardos() {
  const { user, logout } = useAuth();
  const [resguardos, setResguardos] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  
  const [form, setForm] = useState({
    tipoOpcion: 'mobiliario',
    tipoInventario: 'mobiliario', // actual type for db
    itemId: '',
    nombreResguardante: '',
    cargo: '',
    direccion: '',
    area: '',
    observaciones: '',
    descripcionPdf: '',
    numeroSeriePdf: ''
  });

  const [itemsDisponibles, setItemsDisponibles] = useState([]);
  const [personasConocidas, setPersonasConocidas] = useState([]);

  // Recolectar personas conocidas a partir de resguardos e inventarios para autocompletar cargo y dirección
  const actualizarPersonasConocidas = (listaResguardos = [], listaItems = []) => {
    const mapa = new Map();

    listaResguardos.forEach(r => {
      if (r.nombreResguardante && r.nombreResguardante.trim()) {
        const key = r.nombreResguardante.trim().toLowerCase();
        if (!mapa.has(key)) {
          mapa.set(key, {
            nombre: r.nombreResguardante.trim(),
            cargo: r.cargo || '',
            direccion: r.direccion || r.area || ''
          });
        }
      }
    });

    listaItems.forEach(i => {
      const nombre = i.nombreResguardante || i.responsable;
      if (nombre && nombre.trim()) {
        const key = nombre.trim().toLowerCase();
        if (!mapa.has(key)) {
          mapa.set(key, {
            nombre: nombre.trim(),
            cargo: i.cargo || i.cargoResponsable || '',
            direccion: i.direccion || i.areaUbicacion || ''
          });
        }
      }
    });

    setPersonasConocidas(Array.from(mapa.values()));
  };

  const cargarResguardos = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      const token = user.token;
      const res = await fetch(`${API_BASE_URL}/api/resguardos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 401 || data.error === 'Token inválido o expirado') {
        Swal.fire('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'warning').then(() => logout());
        return;
      }
      if (data.ok) {
        setResguardos(data.data);
        actualizarPersonasConocidas(data.data, itemsDisponibles);
      }
    } catch (err) {
      console.error('Error al cargar resguardos:', err);
    }
    setCargando(false);
  };

  const cargarItemsDisponibles = async (tipoOpcion) => {
    if (!user?.token) return;
    try {
      const token = user.token;
      let items = [];
      let debugInfo = [];

      if (tipoOpcion === 'mobiliario') {
        const res = await fetch(`${API_BASE_URL}/api/inventario/mobiliario?limit=2000`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.ok && data.data) {
          const arr = Array.isArray(data.data) ? data.data : (data.data.items || []);
          items = arr.map(i => {
            const titulo = (i.bien || 'MOBILIARIO').toUpperCase();
            const desc = i.descripcion ? `${titulo}\n\n${i.descripcion}` : titulo;
            return {
              ...i,
              __formTipo: 'mobiliario',
              label: `${i.bien}${i.numeroInventario ? ` — Inv: ${i.numeroInventario}` : ''}${i.marca ? ` (${i.marca})` : ''}`,
              desc: desc,
              sn: i.numeroSerie || 'S/S',
              nombreResguardante: i.nombreResguardante || '',
              cargo: i.cargo || '',
              direccion: i.direccion || ''
            };
          });
        } else { debugInfo.push('Mobiliario not ok: ' + JSON.stringify(data)); }
      } else if (tipoOpcion === 'ti') {
        const [resTec, resExis] = await Promise.all([
          fetch(`${API_BASE_URL}/api/inventario/tecnologico?limit=2000`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/inventario/existencias?limit=2000`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const dataTec = await resTec.json();
        const dataExis = await resExis.json();
        
        if (dataTec.ok && dataTec.data) {
          const arrTec = Array.isArray(dataTec.data) ? dataTec.data : (dataTec.data.items || []);
          items = [...items, ...arrTec.map(i => {
            const titulo = `EQUIPO ${i.tipo || 'TECNOLÓGICO'} ${i.marca || ''} ${i.modelo || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
            const detalle = i.observaciones || i.caracteristicas || `MARCA ${i.marca || 'S/M'}, MODELO ${i.modelo || 'S/M'}`;
            const desc = detalle ? `${titulo}\n\n${detalle}` : titulo;
            return {
              ...i,
              __formTipo: 'tecnologico',
              label: `[Tecnológico] ${i.tipo} - ${i.numeroInventario || i.marca || ''}`,
              desc: desc,
              sn: i.numeroSerie || 'S/S',
              nombreResguardante: i.responsable || '',
              cargo: i.cargoResponsable || '',
              direccion: i.direccion || i.areaUbicacion || ''
            };
          })];
        } else { debugInfo.push('Tec not ok: ' + JSON.stringify(dataTec)); }
        
        if (dataExis.ok && dataExis.data) {
          const arrExis = Array.isArray(dataExis.data) ? dataExis.data : (dataExis.data.items || []);
          const exisTi = arrExis.filter(i => i.tipoInventario !== 'semaforos' && (i.categoria === 'herramienta' || i.categoria === 'equipo' || i.categoria === 'accesorio'));
          items = [...items, ...exisTi.map(i => {
            const titulo = (i.nombre || 'HERRAMIENTA / EQUIPO').toUpperCase();
            const detalle = `MARCA ${i.marca || 'S/M'}${i.descripcion ? `, ${i.descripcion}` : ''}`;
            return {
              ...i,
              __formTipo: 'existencia',
              label: `[Existencia] ${i.nombre} - ${i.marca || ''}`,
              desc: `${titulo}\n\n${detalle}`,
              sn: i.numeroSerie || 'S/S',
              nombreResguardante: i.responsable || '',
              cargo: i.cargoResponsable || '',
              direccion: i.areaUbicacion || ''
            };
          })];
        } else { debugInfo.push('Exis not ok: ' + JSON.stringify(dataExis)); }
      } else if (tipoOpcion === 'semaforos') {
        const res = await fetch(`${API_BASE_URL}/api/inventario/controladores?limit=2000`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.ok && data.data) {
          const arr = Array.isArray(data.data) ? data.data : (data.data.items || []);
          items = arr.map(i => {
            const titulo = `CONTROLADOR SEMAFÓRICO MODELO ${i.modelo || 'S/M'}`.toUpperCase();
            const detalle = `CRUCERO: ${i.crucero?.nombre || (i.cruceroId ? `ID ${i.cruceroId}` : 'S/C')}`;
            return {
              ...i,
              __formTipo: 'semaforos',
              label: `[Semáforos] Controlador ${i.modelo} — Crucero: ${i.crucero?.nombre || (i.cruceroId ? `ID ${i.cruceroId}` : 'S/C')}`,
              desc: `${titulo}\n\n${detalle}`,
              sn: 'S/S',
              nombreResguardante: '',
              cargo: '',
              direccion: 'DIRECCIÓN DE OPERACIÓN Y SUPERVISIÓN'
            };
          });
        } else { debugInfo.push('Semaforos not ok: ' + JSON.stringify(data)); }
      }
      
      setItemsDisponibles(items);
      actualizarPersonasConocidas(resguardos, items);
    } catch (err) {
      console.error('Error al cargar items:', err);
      Swal.fire('Error', 'Fallo al cargar ítems: ' + err.message, 'error');
    }
  };

  const cargarCatalogos = async () => {
    if (!user?.token) return;
    try {
      const token = user.token;
      const [resDir, resCargo] = await Promise.all([
        fetch(`${API_BASE_URL}/api/catalogos/areas`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/catalogos/cargos`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const jsonDir = await resDir.json();
      const jsonCargo = await resCargo.json();
      if (jsonDir.ok) setDirecciones(jsonDir.data);
      if (jsonCargo.ok) setCargos(jsonCargo.data);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  useEffect(() => {
    cargarResguardos();
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (modalAbierto) {
      cargarItemsDisponibles(form.tipoOpcion);
    }
  }, [modalAbierto, form.tipoOpcion]);

  const abrirNuevoResguardo = () => {
    setForm({
      tipoOpcion: 'mobiliario',
      tipoInventario: 'mobiliario',
      itemId: '',
      nombreResguardante: '',
      cargo: '',
      direccion: '',
      area: '',
      observaciones: '',
      descripcionPdf: '',
      numeroSeriePdf: ''
    });
    cargarItemsDisponibles('mobiliario');
    setModalAbierto(true);
  };

  const handleOpcionChange = (e) => {
    const newVal = e.target.value;
    setForm({
      ...form,
      tipoOpcion: newVal,
      itemId: '',
      tipoInventario: '',
      descripcionPdf: '',
      numeroSeriePdf: '',
      nombreResguardante: '',
      cargo: '',
      direccion: '',
      area: ''
    });
    cargarItemsDisponibles(newVal);
  };

  const handleItemChange = (e) => {
    const idVal = e.target.value;
    if (!idVal) {
      setForm(prev => ({
        ...prev,
        itemId: '',
        tipoInventario: '',
        descripcionPdf: '',
        numeroSeriePdf: ''
      }));
      return;
    }

    const id = Number(idVal);
    const item = itemsDisponibles.find(i => i.id === id);
    if (item) {
      setForm(prev => ({
        ...prev,
        itemId: id,
        tipoInventario: item.__formTipo,
        descripcionPdf: item.desc || '',
        numeroSeriePdf: item.sn || 'S/S'
      }));
    }
  };

  const handleNombreResguardanteChange = (valor) => {
    const conocido = personasConocidas.find(p => p.nombre?.toLowerCase().trim() === valor.toLowerCase().trim());
    if (conocido) {
      setForm(prev => ({
        ...prev,
        nombreResguardante: valor,
        cargo: conocido.cargo || prev.cargo,
        direccion: conocido.direccion || prev.direccion,
        area: conocido.direccion || prev.area
      }));
    } else {
      setForm(prev => ({
        ...prev,
        nombreResguardante: valor
      }));
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.itemId) return Swal.fire('Error', 'Seleccione un dispositivo o equipo', 'error');
    if (!form.nombreResguardante.trim()) return Swal.fire('Error', 'El nombre del resguardante es requerido', 'warning');
    if (!user?.token) return;

    try {
      const token = user.token;
      const res = await fetch(`${API_BASE_URL}/api/resguardos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          area: form.direccion || form.area || 'General'
        })
      });
      const data = await res.json();
      if (data.ok) {
        Swal.fire('Guardado', 'Resguardo registrado exitosamente', 'success');
        setModalAbierto(false);
        setForm({
          tipoOpcion: 'mobiliario',
          tipoInventario: 'mobiliario',
          itemId: '',
          nombreResguardante: '',
          cargo: '',
          direccion: '',
          area: '',
          observaciones: '',
          descripcionPdf: '',
          numeroSeriePdf: ''
        });
        cargarItemsDisponibles('mobiliario');
        cargarResguardos();
      } else {
        Swal.fire('Error', data.message || 'Error al guardar', 'error');
      }
    } catch {
      Swal.fire('Error', 'No se pudo registrar el resguardo', 'error');
    }
  };

  const marcarDevuelto = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Marcar como devuelto?',
      text: 'El equipo regresará a estar disponible y el resguardo pasará a historial.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, devuelto',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#691B31'
    });

    if (confirm.isConfirmed) {
      if (!user?.token) return;
      try {
        const token = user.token;
        const res = await fetch(`${API_BASE_URL}/api/resguardos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ estado: 'Devuelto', fechaDevolucion: new Date() })
        });
        const data = await res.json();
        if (data.ok) {
          Swal.fire('Actualizado', 'Resguardo marcado como devuelto', 'success');
          cargarResguardos();
        }
      } catch {
        Swal.fire('Error', 'Ocurrió un problema', 'error');
      }
    }
  };

  const getNombreItem = (r) => {
    if (r.tipoInventario === 'mobiliario' && r.mobiliario) return `${r.mobiliario.bien} - ${r.mobiliario.numeroInventario || ''}`;
    if (r.tipoInventario === 'tecnologico' && r.equipoTecnologico) return `${r.equipoTecnologico.tipo} - ${r.equipoTecnologico.numeroInventario || r.equipoTecnologico.marca}`;
    if (r.tipoInventario === 'existencia' && r.existencia) return `${r.existencia.nombre} - ${r.existencia.marca || ''}`;
    if (r.tipoInventario === 'semaforos' && r.controladorSemaforo) return `Controlador ${r.controladorSemaforo.modelo}`;
    return 'Desconocido';
  };

  const resguardosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return resguardos;
    const term = busqueda.toLowerCase().trim();

    return resguardos.filter(r => {
      const nombreItem = getNombreItem(r).toLowerCase();
      const nombre = (r.nombreResguardante || '').toLowerCase();
      const cargo = (r.cargo || '').toLowerCase();
      const direccion = (r.direccion || r.area || '').toLowerCase();
      const tipo = (r.tipoInventario || '').toLowerCase();
      const estado = (r.estado || '').toLowerCase();
      const descPdf = (r.descripcionPdf || '').toLowerCase();
      const seriePdf = (r.numeroSeriePdf || '').toLowerCase();
      const obs = (r.observaciones || '').toLowerCase();

      // Mobiliario
      const mobBien = (r.mobiliario?.bien || '').toLowerCase();
      const mobInv = (r.mobiliario?.numeroInventario || '').toLowerCase();
      const mobSerie = (r.mobiliario?.numeroSerie || '').toLowerCase();
      const mobDesc = (r.mobiliario?.descripcion || '').toLowerCase();

      // Equipo Tecnológico
      const tecTipo = (r.equipoTecnologico?.tipo || '').toLowerCase();
      const tecMarca = (r.equipoTecnologico?.marca || '').toLowerCase();
      const tecModelo = (r.equipoTecnologico?.modelo || '').toLowerCase();
      const tecInv = (r.equipoTecnologico?.numeroInventario || '').toLowerCase();
      const tecSerie = (r.equipoTecnologico?.numeroSerie || '').toLowerCase();

      // Existencia / Herramienta
      const exNombre = (r.existencia?.nombre || '').toLowerCase();
      const exMarca = (r.existencia?.marca || '').toLowerCase();
      const exModelo = (r.existencia?.modelo || '').toLowerCase();
      const exInv = (r.existencia?.numeroInventario || '').toLowerCase();
      const exSerie = (r.existencia?.numeroSerie || '').toLowerCase();

      // Semáforos
      const semModelo = (r.controladorSemaforo?.modelo || '').toLowerCase();
      const semMarca = (r.controladorSemaforo?.marca || '').toLowerCase();

      return (
        nombreItem.includes(term) ||
        nombre.includes(term) ||
        cargo.includes(term) ||
        direccion.includes(term) ||
        tipo.includes(term) ||
        estado.includes(term) ||
        descPdf.includes(term) ||
        seriePdf.includes(term) ||
        obs.includes(term) ||
        mobBien.includes(term) ||
        mobInv.includes(term) ||
        mobSerie.includes(term) ||
        mobDesc.includes(term) ||
        tecTipo.includes(term) ||
        tecMarca.includes(term) ||
        tecModelo.includes(term) ||
        tecInv.includes(term) ||
        tecSerie.includes(term) ||
        exNombre.includes(term) ||
        exMarca.includes(term) ||
        exModelo.includes(term) ||
        exInv.includes(term) ||
        exSerie.includes(term) ||
        semModelo.includes(term) ||
        semMarca.includes(term)
      );
    });
  }, [resguardos, busqueda]);

  const exportarDocx = async (resguardo) => {
    try {
      Swal.fire({
        title: 'Generando Word...',
        text: 'Por favor espere un momento.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      await generarResguardoDocx(resguardo);
      Swal.close();
    } catch (err) {
      console.error('Error al generar Word:', err);
      Swal.fire('Error Word', err.message || 'Error al exportar a Word', 'error');
    }
  };

  return (
    <main style={{ padding: '2.5rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto', minHeight: '800px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaClipboardCheck /> Resguardos
          </h1>
          <p style={{ color: '#6F7271', margin: '0.5rem 0 0', fontSize: '1rem' }}>
            Gestión de préstamos y asignaciones de dispositivos y mobiliario con exportación de documentos oficiales.
          </p>
        </div>
        <button 
          onClick={abrirNuevoResguardo}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#BC955B', color: 'white',
            border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(188,149,91,0.25)', transition: 'all 0.2s', fontSize: '1rem'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <FaPlus /> Nuevo Resguardo
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Buscar por dispositivo, no. inventario, nombre o dirección..." 
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' }}
        />
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>DISPOSITIVO / MUEBLE</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>TIPO</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>NOMBRE DEL RESGUARDANTE</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>CARGO</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>DIRECCIÓN</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>FECHA PRÉSTAMO / DEVOLUCIÓN</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600' }}>ESTADO</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>EXPORTAR / ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Cargando...</td></tr>
            ) : resguardosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  {busqueda.trim() ? 'No se encontraron resguardos que coincidan con la búsqueda.' : 'No hay resguardos registrados.'}
                </td>
              </tr>
            ) : (
              resguardosFiltrados.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '500' }}>{getNombreItem(r)}</td>
                  <td style={{ padding: '1rem', color: '#1e293b', textTransform: 'capitalize' }}>{r.tipoInventario}</td>
                  <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '600' }}>{r.nombreResguardante}</td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {r.cargo ? <span style={{ fontWeight: '600', color: '#BC955B' }}>{r.cargo}</span> : '—'}
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {r.direccion || r.area || '—'}
                  </td>
                  <td style={{ padding: '1rem', color: '#1e293b' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Préstamo: </span>
                      <span>{new Date(r.fechaPrestamo).toLocaleDateString('es-MX')}</span>
                    </div>
                    {r.fechaDevolucion && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600' }}>Devolución: </span>
                        <span style={{ color: '#0284c7', fontWeight: '500' }}>{new Date(r.fechaDevolucion).toLocaleDateString('es-MX')}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: r.estado === 'Activo' ? '#dcfce7' : '#f1f5f9', color: r.estado === 'Activo' ? '#166534' : '#475569' }}>
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      {r.estado === 'Activo' && (
                        <button onClick={() => marcarDevuelto(r.id)} title="Marcar como Devuelto" style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.4rem' }}>
                          <FaCheck size={18} />
                        </button>
                      )}
                      <button
                        title="Exportar a Word (.docx)"
                        onClick={() => exportarDocx(r)}
                        style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#1D4ED8',
                          cursor: 'pointer',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: '700',
                          fontSize: '0.8rem'
                        }}
                      >
                        <FaFileWord size={16} /> Word
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b' }}>
            Mostrando {resguardosFiltrados.length} {resguardosFiltrados.length === 1 ? 'resguardo' : 'resguardos'}
          </span>
        </div>
      </div>

      {/* Modal Nuevo Resguardo */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '700' }}>Nuevo Resguardo</h2>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleGuardar} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Categoría *</label>
                  <select required value={form.tipoOpcion} onChange={handleOpcionChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', backgroundColor: 'white' }}>
                    <option value="ti">TI (Tecnologías y Existencias)</option>
                    <option value="mobiliario">Mobiliario</option>
                    <option value="semaforos">Semáforos</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Dispositivo/Equipo *</label>
                  <select required value={form.itemId} onChange={handleItemChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', backgroundColor: 'white' }}>
                    <option value="">Seleccione un ítem...</option>
                    {itemsDisponibles.map((item, idx) => (
                      <option key={`${item.__formTipo}-${item.id}-${idx}`} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1. Primero: Nombre del Resguardante (con autocompletado inteligente de cargo y dirección) */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                    1. Nombre del Resguardante *
                  </label>
                  <input
                    required
                    type="text"
                    list="lista-personas-resguardantes"
                    value={form.nombreResguardante}
                    onChange={e => handleNombreResguardanteChange(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}
                    placeholder="Escriba o seleccione el nombre del resguardante"
                  />
                  <datalist id="lista-personas-resguardantes">
                    {personasConocidas.map((p, idx) => (
                      <option key={idx} value={p.nombre}>
                        {p.cargo ? `${p.cargo} — ${p.direccion || ''}` : p.direccion || ''}
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* 2. Segundo: Cargo */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                    2. Cargo
                  </label>
                  <input
                    type="text"
                    list="lista-cargos-resguardo"
                    value={form.cargo}
                    onChange={e => setForm({...form, cargo: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}
                    placeholder="Cargo del resguardante"
                  />
                  <datalist id="lista-cargos-resguardo">
                    {cargos.map(c => <option key={c.id} value={c.nombre} />)}
                  </datalist>
                </div>

                {/* 3. Tercero: Dirección */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                    3. Dirección
                  </label>
                  <input
                    type="text"
                    list="lista-direcciones-resguardo"
                    value={form.direccion}
                    onChange={e => setForm({...form, direccion: e.target.value, area: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}
                    placeholder="Dirección o área"
                  />
                  <datalist id="lista-direcciones-resguardo">
                    {direcciones.map(d => <option key={d.id} value={d.nombre} />)}
                  </datalist>
                </div>

              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#334155', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem' }}>Datos para el Documento Word (Editables)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Descripción (Detalle del Bien)</label>
                    <textarea value={form.descripcionPdf} onChange={e => setForm({...form, descripcionPdf: e.target.value})} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', minHeight: '75px', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Número de Serie</label>
                    <input type="text" value={form.numeroSeriePdf} onChange={e => setForm({...form, numeroSeriePdf: e.target.value})} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} />
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Observaciones del préstamo</label>
                <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', minHeight: '55px', resize: 'vertical' }} placeholder="Opcional. Ej. Pantalla intacta, incluye cargador..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '0.65rem 1.25rem', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.65rem 1.5rem', backgroundColor: '#691B31', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(105,27,49,0.2)' }}>
                  Guardar Resguardo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Resguardos;
