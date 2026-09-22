import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaBoxes, FaPlus, FaEdit, FaTimes, FaSearch, FaCogs, FaWrench, FaTools, FaHdd, FaChevronRight,
  FaCheckCircle, FaExclamationTriangle, FaMapMarkerAlt, FaFilter, FaArrowLeft, FaRedoAlt
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
  const navigate = useNavigate();

  const [existencias, setExistencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(''); // '' | 'Buen Estado' | 'Por Reparar' | 'Dañado'

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [itemOrigen, setItemOrigen] = useState('existencia'); // 'existencia' | 'equipo'
  const [esNombrePersonalizado, setEsNombrePersonalizado] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'componente',
    cantidad: 1,
    estadoFisico: 'Buen Estado',
    areaUbicacion: 'Almacén de Sistemas',
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
      // 1. Fetch existencias
      let url = `${API_BASE_URL}/api/inventario/existencias?tipoInventario=tecnologico`;
      if (filtroCategoria) {
        url += `&categoria=${filtroCategoria}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      let exisItems = [];
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          exisItems = json.data.map(ex => {
            let est = ex.estadoFisico || (Number(ex.cantidad) > 0 ? 'Buen Estado' : 'Dañado');
            if (est === 'Regular' || est === 'Por Reparar' || est === 'En Reparación') est = 'Por Reparar';
            else if (est === 'Dañada' || est === 'Dañado' || est === 'Baja') est = 'Dañado';
            else est = 'Buen Estado';

            return {
              id: ex.id,
              origen: 'existencia',
              nombre: ex.nombre,
              categoria: ex.categoria || 'componente',
              cantidad: Number(ex.cantidad) || 0,
              estadoFisico: est,
              areaUbicacion: ex.areaUbicacion || 'Almacén de Sistemas',
              marca: ex.marca || '',
              modelo: ex.modelo || '',
              numeroSerie: ex.numeroSerie || '',
              numeroInventario: ex.numeroInventario || ''
            };
          });
        }
      }

      // 2. Fetch refacciones from equipoTecnologico
      const resEq = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?limit=1000&tipo=refaccion`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      let eqItems = [];
      if (resEq.ok) {
        const jsonEq = await resEq.json();
        if (jsonEq.ok && Array.isArray(jsonEq.data)) {
          eqItems = jsonEq.data.map(item => {
            let est = item.estatus || item.detalles?.estadoFisico || 'Buen Estado';
            if (est === 'Regular' || est === 'Por Reparar' || est === 'En Reparación') est = 'Por Reparar';
            else if (est === 'Dañada' || est === 'Dañado' || est === 'Baja') est = 'Dañado';
            else est = 'Buen Estado';

            return {
              id: item.id,
              origen: 'equipo',
              nombre: item.detalles?.nombre || `${item.marca || ''} ${item.modelo || ''}`.trim() || 'Refacción',
              categoria: item.detalles?.categoria || 'componente',
              cantidad: item.detalles?.cantidad !== undefined ? Number(item.detalles.cantidad) : 1,
              estadoFisico: est,
              areaUbicacion: item.areaUbicacion || item.detalles?.areaUbicacion || 'Almacén de Sistemas',
              marca: item.marca || '',
              modelo: item.modelo || '',
              numeroSerie: item.numeroSerie || '',
              numeroInventario: item.numeroInventario || ''
            };
          });
        }
      }

      setExistencias([...exisItems, ...eqItems]);
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

    const cantidadFinal = form.cantidad === '' || isNaN(Number(form.cantidad)) ? 1 : Math.max(0, Number(form.cantidad));

    try {
      if (editandoId && itemOrigen === 'equipo') {
        const payload = {
          tipo: 'refaccion',
          marca: form.marca || null,
          modelo: form.modelo || null,
          numeroSerie: form.numeroSerie || null,
          numeroInventario: form.numeroInventario || null,
          areaUbicacion: form.areaUbicacion || 'Almacén de Sistemas',
          estatus: form.estadoFisico,
          detalles: {
            nombre: form.nombre,
            categoria: form.categoria,
            cantidad: cantidadFinal,
            estadoFisico: form.estadoFisico,
            areaUbicacion: form.areaUbicacion
          }
        };
        const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico/${editandoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          Swal.fire({ title: 'Éxito', text: 'Refacción actualizada correctamente.', icon: 'success', confirmButtonColor: '#691B31' });
          setModalAbierto(false);
          resetForm();
          cargarExistencias();
        } else {
          Swal.fire('Error', json.error || 'No se pudo actualizar.', 'error');
        }
      } else {
        const url = editandoId
          ? `${API_BASE_URL}/api/inventario/existencias/${editandoId}`
          : `${API_BASE_URL}/api/inventario/existencias`;
        const method = editandoId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ ...form, cantidad: cantidadFinal })
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
      }
    } catch (err) {
      console.error('Error al guardar existencias:', err);
      Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
    }
  };

  const handleEditar = (item) => {
    setEditandoId(item.id);
    setItemOrigen(item.origen || 'existencia');
    const esComun = ARTICULOS_COMUNES.includes(item.nombre || '');
    setEsNombrePersonalizado(!esComun && !!item.nombre);
    setForm({
      nombre: item.nombre || '',
      categoria: item.categoria || 'componente',
      cantidad: item.cantidad !== undefined ? item.cantidad : 0,
      estadoFisico: item.estadoFisico || 'Buen Estado',
      areaUbicacion: item.areaUbicacion || 'Almacén de Sistemas',
      marca: item.marca || '',
      modelo: item.modelo || '',
      numeroSerie: item.numeroSerie || '',
      numeroInventario: item.numeroInventario || '',
      tipoInventario: 'tecnologico'
    });
    setModalAbierto(true);
  };

  const handleEliminar = async (item) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: `Se eliminará "${item.nombre}" del stock.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const url = item.origen === 'equipo'
          ? `${API_BASE_URL}/api/inventario-tecnologico/${item.id}`
          : `${API_BASE_URL}/api/inventario/existencias/${item.id}`;
        const res = await fetch(url, {
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
    setItemOrigen('existencia');
    setEsNombrePersonalizado(false);
    setForm({
      nombre: '',
      categoria: 'componente',
      cantidad: '',
      estadoFisico: 'Buen Estado',
      areaUbicacion: 'Almacén de Sistemas',
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
    return categories[cat?.toLowerCase()] || cat || 'General';
  };

  const getCategoriaBg = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'componente': return '#ede9fe';
      case 'accesorio': return '#ccfbf1';
      case 'periferico': return '#ffedd5';
      case 'equipo': return '#fef9c3';
      case 'herramienta': return '#f1f5f9';
      default: return '#f1f5f9';
    }
  };

  const getCategoriaTextColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'componente': return '#5b21b6';
      case 'accesorio': return '#0f766e';
      case 'periferico': return '#c2410c';
      case 'equipo': return '#854d0e';
      case 'herramienta': return '#334155';
      default: return '#475569';
    }
  };

  const getCategoriaIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'componente': return <FaCogs style={{ color: '#6d28d9' }} />;
      case 'accesorio': return <FaWrench style={{ color: '#0f766e' }} />;
      case 'periferico': return <FaHdd style={{ color: '#ea580c' }} />;
      case 'equipo': return <FaTools style={{ color: '#ca8a04' }} />;
      case 'herramienta': return <FaWrench style={{ color: '#475569' }} />;
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
      </div>

      {/* FILTROS DE ESTADO FÍSICO (3 CUADRIS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Cuadri: Buen Estado */}
        {(() => {
          const countBuenEstado = existencias.filter(i => i.estadoFisico === 'Buen Estado').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
          const totalArticulos = existencias.filter(i => i.estadoFisico === 'Buen Estado').length;
          const isActive = filtroEstado === 'Buen Estado';
          return (
            <div
              onClick={() => setFiltroEstado(isActive ? '' : 'Buen Estado')}
              style={{
                backgroundColor: isActive ? '#ecfdf5' : '#ffffff',
                border: isActive ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isActive ? '0 8px 16px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: '#10b981' }}></div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Buen Estado
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#064e3b', lineHeight: 1.1 }}>
                  {countBuenEstado} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#059669' }}>piezas</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {totalArticulos} {totalArticulos === 1 ? 'artículo registrado' : 'artículos registrados'}
                </div>
              </div>
              <div style={{
                backgroundColor: isActive ? '#10b981' : '#f0fdf4',
                color: isActive ? '#ffffff' : '#059669',
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                <FaCheckCircle />
              </div>
            </div>
          );
        })()}

        {/* Cuadri: Por Reparar */}
        {(() => {
          const countPorReparar = existencias.filter(i => i.estadoFisico === 'Por Reparar').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
          const totalArticulos = existencias.filter(i => i.estadoFisico === 'Por Reparar').length;
          const isActive = filtroEstado === 'Por Reparar';
          return (
            <div
              onClick={() => setFiltroEstado(isActive ? '' : 'Por Reparar')}
              style={{
                backgroundColor: isActive ? '#fffbeb' : '#ffffff',
                border: isActive ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isActive ? '0 8px 16px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: '#f59e0b' }}></div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Por Reparar
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#78350f', lineHeight: 1.1 }}>
                  {countPorReparar} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#d97706' }}>piezas</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {totalArticulos} {totalArticulos === 1 ? 'artículo en revisión' : 'artículos en revisión'}
                </div>
              </div>
              <div style={{
                backgroundColor: isActive ? '#f59e0b' : '#fffbeb',
                color: isActive ? '#ffffff' : '#d97706',
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                <FaTools />
              </div>
            </div>
          );
        })()}

        {/* Cuadri: Dañado */}
        {(() => {
          const countDanado = existencias.filter(i => i.estadoFisico === 'Dañado').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
          const totalArticulos = existencias.filter(i => i.estadoFisico === 'Dañado').length;
          const isActive = filtroEstado === 'Dañado';
          return (
            <div
              onClick={() => setFiltroEstado(isActive ? '' : 'Dañado')}
              style={{
                backgroundColor: isActive ? '#fef2f2' : '#ffffff',
                border: isActive ? '2px solid #ef4444' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isActive ? '0 8px 16px rgba(239, 68, 68, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: '#ef4444' }}></div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Dañado / Baja
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7f1d1d', lineHeight: 1.1 }}>
                  {countDanado} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626' }}>piezas</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {totalArticulos} {totalArticulos === 1 ? 'artículo dañado' : 'artículos dañados'}
                </div>
              </div>
              <div style={{
                backgroundColor: isActive ? '#ef4444' : '#fef2f2',
                color: isActive ? '#ffffff' : '#dc2626',
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                <FaExclamationTriangle />
              </div>
            </div>
          );
        })()}
      </div>

      {/* BANNER DE FILTRO ACTIVO */}
      {filtroEstado && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: filtroEstado === 'Buen Estado' ? '#ecfdf5' : filtroEstado === 'Por Reparar' ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${filtroEstado === 'Buen Estado' ? '#a7f3d0' : filtroEstado === 'Por Reparar' ? '#fde68a' : '#fecaca'}`,
          borderRadius: '10px',
          padding: '0.65rem 1.25rem',
          marginBottom: '1.5rem',
          color: filtroEstado === 'Buen Estado' ? '#065f46' : filtroEstado === 'Por Reparar' ? '#92400e' : '#991b1b',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaFilter size={13} />
            <span>
              Filtrando por estado: <strong>{filtroEstado}</strong>
            </span>
          </div>
          <button
            onClick={() => setFiltroEstado('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'underline'
            }}
          >
            <FaRedoAlt size={11} /> Mostrar todos
          </button>
        </div>
      )}

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
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '1.1rem' }}>Cargando existencias...</div>
      ) : existencias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#64748b' }}>
          No hay artículos registrados en el stock actualmente.
        </div>
      ) : (
        (() => {
          const itemsFiltrados = existencias.filter(item => {
            const coincideTexto = (
              (item.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
              (item.marca || '').toLowerCase().includes(busqueda.toLowerCase()) ||
              (item.modelo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
              (item.numeroSerie || '').toLowerCase().includes(busqueda.toLowerCase()) ||
              (item.numeroInventario || '').toLowerCase().includes(busqueda.toLowerCase()) ||
              (item.areaUbicacion || '').toLowerCase().includes(busqueda.toLowerCase())
            );
            const coincideEstado = !filtroEstado || item.estadoFisico === filtroEstado;
            return coincideTexto && coincideEstado;
          });

          if (itemsFiltrados.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '3.5rem', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <FaBoxes size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#334155', fontWeight: '700' }}>No se encontraron artículos</h3>
                <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem', color: '#64748b' }}>
                  No hay existencias que coincidan con la búsqueda o el filtro de estado seleccionado ({filtroEstado || 'todos'}).
                </p>
                {filtroEstado && (
                  <button
                    onClick={() => setFiltroEstado('')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#691B31',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}
                  >
                    Ver todas las existencias
                  </button>
                )}
              </div>
            );
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {itemsFiltrados.map(item => {
                const bgCat = getCategoriaBg(item.categoria);
                const textCat = getCategoriaTextColor(item.categoria);

                const statusColor = item.estadoFisico === 'Buen Estado'
                  ? { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
                  : item.estadoFisico === 'Por Reparar'
                  ? { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }
                  : { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };

                return (
                  <div
                    key={`${item.origen}-${item.id}`}
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
                    {/* Left vertical accent bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#691B31' }}></div>
                    
                    <div>
                      {/* Top bar: Category badge + Edit button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          color: textCat,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          backgroundColor: bgCat,
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px'
                        }}>
                          {getCategoriaIcon(item.categoria)}
                          {getCategoriaLabel(item.categoria)}
                        </span>

                        <button
                          onClick={() => handleEditar(item)}
                          title="Editar artículo"
                          style={{
                            backgroundColor: '#fef3c7',
                            border: 'none',
                            color: '#d97706',
                            cursor: 'pointer',
                            padding: '0.45rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                        >
                          <FaEdit size={14} />
                        </button>
                      </div>

                      {/* Main Title */}
                      <h3 style={{
                        fontSize: '1.25rem',
                        margin: '0.5rem 0 0.25rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        textTransform: 'capitalize'
                      }}>
                        {item.nombre}
                      </h3>

                      {/* Brand and Model */}
                      {(item.marca || item.modelo) && (
                        <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500', marginBottom: '0.5rem' }}>
                          {item.marca && <span>{item.marca}</span>}
                          {item.marca && item.modelo && ' - '}
                          {item.modelo && <span>{item.modelo}</span>}
                        </div>
                      )}

                      {/* Serial Number & Inventory Number */}
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.35rem' }}>
                        {item.numeroSerie && <span>S/N: {item.numeroSerie}</span>}
                        {item.numeroInventario && <span>Inv: {item.numeroInventario}</span>}
                      </div>

                      {/* Estado Físico & Ubicación Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: statusColor.text,
                          backgroundColor: statusColor.bg,
                          border: `1px solid ${statusColor.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor.text }}></span>
                          {item.estadoFisico}
                        </span>

                        {item.areaUbicacion && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#475569',
                            backgroundColor: '#f1f5f9',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <FaMapMarkerAlt size={10} color="#94a3b8" />
                            {item.areaUbicacion}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '1rem',
                      marginTop: '1.25rem'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Stock Disponible:</span>
                      <span style={{
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: item.cantidad > 5 ? '#047857' : item.cantidad > 0 ? '#b45309' : '#b91c1c',
                        backgroundColor: item.cantidad > 5 ? '#dcfce7' : item.cantidad > 0 ? '#fef3c7' : '#fee2e2',
                        padding: '0.15rem 0.85rem',
                        borderRadius: '8px',
                        minWidth: '2.5rem',
                        textAlign: 'center'
                      }}>
                        {item.cantidad}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()
      )}

      {/* FORM MODAL */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
            <button type="button" onClick={() => setModalAbierto(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
              <FaTimes size={16} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.75rem' }}>
              {editandoId ? 'Editar Existencias / Refacción' : 'Ingresar Existencias / Refacción'}
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

              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
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

                <div>
                  <label style={labelStyle}>Estado Físico</label>
                  <select
                    value={form.estadoFisico}
                    onChange={e => setForm({ ...form, estadoFisico: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer', fontWeight: '600' }}
                  >
                    <option value="Buen Estado">🟢 Buen Estado</option>
                    <option value="Por Reparar">🟡 Por Reparar</option>
                    <option value="Dañado">🔴 Dañado / Baja</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              <div style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Ubicación / Área</label>
                  <input
                    type="text"
                    value={form.areaUbicacion}
                    onChange={e => setForm({ ...form, areaUbicacion: e.target.value })}
                    style={inputStyle}
                    placeholder="Ej. Almacén de Sistemas"
                  />
                </div>
                <div>
                  <label style={labelStyle}>{editandoId ? 'Cantidad actual' : 'Cantidad a ingresar'}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1"
                    value={form.cantidad ?? ''}
                    onFocus={e => e.target.select()}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setForm(prev => ({ ...prev, cantidad: '' }));
                      } else {
                        const num = parseInt(val, 10);
                        setForm(prev => ({ ...prev, cantidad: isNaN(num) ? '' : Math.max(0, num) }));
                      }
                    }}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
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
