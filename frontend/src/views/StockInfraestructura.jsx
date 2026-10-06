import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBoxes, FaPlus, FaEdit, FaTrashAlt, FaSearch, FaFileExcel, FaTimes, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const CATEGORIAS_SUGERIDAS = [
  'Material Eléctrico',
  'Iluminación',
  'Cerrajería y Accesos',
  'Plomería y Grifería',
  'Pintura y Acabados',
  'Herrería y Estructuras',
  'Equipamiento de Estación',
  'Insumos Generales'
];

export default function StockInfraestructura() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modal State
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Material Eléctrico',
    otraCategoria: '',
    cantidad: 1,
    marca: '',
    modelo: '',
    numeroInventario: '',
    numeroSerie: '',
    estadoFisico: 'Buen Estado'
  });

  const cargarStock = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/existencias?tipoInventario=infraestructura`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setStock(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar stock de infraestructura:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const resetForm = () => {
    setEditandoId(null);
    setForm({
      nombre: '',
      categoria: 'Material Eléctrico',
      otraCategoria: '',
      cantidad: 1,
      marca: '',
      modelo: '',
      numeroInventario: '',
      numeroSerie: '',
      estadoFisico: 'Buen Estado'
    });
  };

  const abrirModalCrear = () => {
    resetForm();
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setEditandoId(item.id);
    const esCategoriaConocida = CATEGORIAS_SUGERIDAS.includes(item.categoria);
    setForm({
      nombre: item.nombre || '',
      categoria: esCategoriaConocida ? item.categoria : 'Otro',
      otraCategoria: esCategoriaConocida ? '' : (item.categoria || ''),
      cantidad: item.cantidad ?? 1,
      marca: item.marca || '',
      modelo: item.modelo || '',
      numeroInventario: item.numeroInventario || '',
      numeroSerie: item.numeroSerie || '',
      estadoFisico: item.estadoFisico || 'Buen Estado'
    });
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      Swal.fire('Atención', 'El nombre de la refacción o material es obligatorio.', 'warning');
      return;
    }

    const categoriaFinal = form.categoria === 'Otro' ? form.otraCategoria.trim() || 'Insumos Generales' : form.categoria;

    const payload = {
      nombre: form.nombre.trim(),
      categoria: categoriaFinal,
      cantidad: Math.max(0, parseInt(form.cantidad, 10) || 0),
      marca: form.marca.trim() || null,
      modelo: form.modelo.trim() || null,
      numeroInventario: form.numeroInventario.trim() || null,
      numeroSerie: form.numeroSerie.trim() || null,
      estadoFisico: form.estadoFisico,
      tipoInventario: 'infraestructura'
    };

    const url = editandoId
      ? `${API_BASE_URL}/api/inventario/existencias/${editandoId}`
      : `${API_BASE_URL}/api/inventario/existencias`;
    const method = editandoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        Swal.fire({
          title: 'Éxito',
          text: editandoId ? 'Refacción actualizada correctamente.' : 'Refacción ingresada al stock correctamente.',
          icon: 'success',
          confirmButtonColor: '#691B31'
        });
        setModalAbierto(false);
        resetForm();
        cargarStock();
      } else {
        Swal.fire('Error', json.error || 'No se pudo guardar la refacción.', 'error');
      }
    } catch (err) {
      console.error('Error al guardar en stock:', err);
      Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
    }
  };

  const handleEliminar = async (id, nombre) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar refacción?',
      text: `Se eliminará "${nombre}" del Stock de Infraestructura.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/existencias/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        Swal.fire('Eliminado', 'La refacción ha sido eliminada del stock.', 'success');
        cargarStock();
      } else {
        Swal.fire('Error', json.error || 'No se pudo eliminar.', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar refacción:', err);
      Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
    }
  };

  const exportarAExcel = () => {
    if (stockFiltrado.length === 0) {
      Swal.fire('Atención', 'No hay registros para exportar.', 'warning');
      return;
    }

    const dataToExport = stockFiltrado.map(item => ({
      'No. Inventario': item.numeroInventario || 'S/N',
      'Refacción / Material': item.nombre,
      'Categoría': item.categoria || 'General',
      'Marca': item.marca || 'S/M',
      'Modelo': item.modelo || 'S/M',
      'No. Serie': item.numeroSerie || 'S/N',
      'Cantidad en Stock': item.cantidad,
      'Estado Físico': item.estadoFisico || 'Buen Estado',
      'Fecha Registro': new Date(item.createdAt).toLocaleDateString('es-MX')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock_Infraestructura');
    XLSX.writeFile(wb, `Stock_Infraestructura_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtrado
  const stockFiltrado = stock.filter(item => {
    const coincideBusqueda =
      (item.nombre && item.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.marca && item.marca.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.modelo && item.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.numeroInventario && item.numeroInventario.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.numeroSerie && item.numeroSerie.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.categoria && item.categoria.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideCategoria = filtroCategoria === 'Todas' || item.categoria === filtroCategoria;
    const coincideEstado = filtroEstado === 'Todos' || item.estadoFisico === filtroEstado;

    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  // Métricas
  const totalItems = stock.length;
  const totalUnidades = stock.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  const stockBajo = stock.filter(item => (Number(item.cantidad) || 0) <= 2).length;
  const buenEstado = stock.filter(item => item.estadoFisico === 'Buen Estado' || !item.estadoFisico).length;

  return (
    <main style={{ padding: '2.5rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto', minHeight: '800px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaBoxes /> Stock de Infraestructura
          </h1>
          <p style={{ color: '#6F7271', margin: '0.5rem 0 0', fontSize: '1rem' }}>
            Gestión de refacciones, insumos y materiales para mantenimiento de infraestructura.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard-infraestructura')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', color: '#4B5563',
              border: '1px solid #D1D5DB', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s', fontSize: '0.95rem'
            }}
          >
            <FaArrowLeft /> Volver al Panel
          </button>
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
            onClick={abrirModalCrear}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(105,27,49,0.2)', transition: 'background-color 0.2s', fontSize: '1rem'
            }}
          >
            <FaPlus /> Agregar al Stock
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #691B31', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>Refacciones Registradas</p>
          <h3 style={{ margin: '0.35rem 0 0', color: '#1E293B', fontSize: '1.8rem', fontWeight: '800' }}>{totalItems}</h3>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #10B981', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>Unidades Disponibles</p>
          <h3 style={{ margin: '0.35rem 0 0', color: '#10B981', fontSize: '1.8rem', fontWeight: '800' }}>{totalUnidades}</h3>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #BC955B', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>En Buen Estado</p>
          <h3 style={{ margin: '0.35rem 0 0', color: '#BC955B', fontSize: '1.8rem', fontWeight: '800' }}>{buenEstado}</h3>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #F59E0B', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>Stock Bajo o Agotado</p>
          <h3 style={{ margin: '0.35rem 0 0', color: stockBajo > 0 ? '#DC2626' : '#1E293B', fontSize: '1.8rem', fontWeight: '800' }}>{stockBajo}</h3>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Buscar por refacción, marca, modelo, no. inventario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', backgroundColor: 'white', fontSize: '0.9rem', color: '#334155' }}
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIAS_SUGERIDAS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', backgroundColor: 'white', fontSize: '0.9rem', color: '#334155' }}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Buen Estado">Buen Estado</option>
            <option value="Regular">Regular</option>
            <option value="Por Reparar">Por Reparar</option>
            <option value="Dañado">Dañado</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', fontSize: '0.85rem' }}>NO. INVENTARIO / SERIE</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', fontSize: '0.85rem' }}>REFACCIÓN / MATERIAL</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', fontSize: '0.85rem' }}>CATEGORÍA</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', fontSize: '0.85rem' }}>MARCA / MODELO</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', fontSize: '0.85rem', textAlign: 'center' }}>EN STOCK</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', fontSize: '0.85rem' }}>ESTADO</th>
              <th style={{ padding: '1rem', color: '#64748B', fontWeight: '600', fontSize: '0.85rem', textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>Cargando catálogo de stock...</td></tr>
            ) : stockFiltrado.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                  {busqueda.trim() || filtroCategoria !== 'Todas' || filtroEstado !== 'Todos'
                    ? 'No se encontraron refacciones con los filtros aplicados.'
                    : 'Aún no hay refacciones registradas en el Stock de Infraestructura. Haz clic en "+ Agregar al Stock" para ingresar la primera.'}
                </td>
              </tr>
            ) : (
              stockFiltrado.map(item => {
                const cantidadNum = Number(item.cantidad) || 0;
                const badgeColor = cantidadNum === 0
                  ? { bg: '#FEE2E2', text: '#DC2626' }
                  : cantidadNum <= 2
                  ? { bg: '#FEF3C7', text: '#D97706' }
                  : { bg: '#DCFCE7', text: '#166534' };

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '1rem', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>
                      {item.numeroInventario || item.numeroSerie || <span style={{ color: '#94A3B8' }}>S/N</span>}
                    </td>
                    <td style={{ padding: '1rem', color: '#0F172A', fontWeight: '600', fontSize: '0.95rem' }}>
                      {item.nombre}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748B', fontSize: '0.875rem' }}>
                      <span style={{ backgroundColor: '#F1F5F9', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '500' }}>
                        {item.categoria || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.875rem' }}>
                      {item.marca || 'S/M'}{item.modelo ? ` - ${item.modelo}` : ''}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        backgroundColor: badgeColor.bg,
                        color: badgeColor.text
                      }}>
                        {cantidadNum} {cantidadNum === 1 ? 'unidad' : 'unidades'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontWeight: '600',
                        backgroundColor: item.estadoFisico === 'Buen Estado' ? '#ECFDF5' : '#FEF2F2',
                        color: item.estadoFisico === 'Buen Estado' ? '#059669' : '#DC2626'
                      }}>
                        {item.estadoFisico || 'Buen Estado'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => abrirModalEditar(item)}
                          title="Editar refacción"
                          style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', padding: '0.4rem' }}
                        >
                          <FaEdit size={17} />
                        </button>
                        <button
                          onClick={() => handleEliminar(item.id, item.nombre)}
                          title="Eliminar del stock"
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                        >
                          <FaTrashAlt size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
            Mostrando {stockFiltrado.length} de {totalItems} {totalItems === 1 ? 'refacción' : 'refacciones'}
          </span>
        </div>
      </div>

      {/* Modal Agregar / Editar */}
      {modalAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', padding: '2rem',
            width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FaBoxes style={{ color: '#691B31' }} />
                {editandoId ? 'Editar Refacción del Stock' : 'Ingresar Refacción al Stock'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleGuardar}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                    Nombre del Material / Refacción <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Lámpara LED 40W, Chapa de seguridad, Llave de paso 1/2..."
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                      Categoría <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', backgroundColor: 'white' }}
                    >
                      {CATEGORIAS_SUGERIDAS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Otro">Otra (Personalizada)...</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                      Cantidad en Existencia <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.cantidad}
                      onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {form.categoria === 'Otro' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                      Especificar Categoría <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Escriba la categoría personalizada..."
                      value={form.otraCategoria}
                      onChange={(e) => setForm({ ...form, otraCategoria: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>Marca</label>
                    <input
                      type="text"
                      placeholder="Ej. Philips, Yale, Truper..."
                      value={form.marca}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>Modelo / Especificación</label>
                    <input
                      type="text"
                      placeholder="Ej. T8 120cm, Sobreponer 50mm..."
                      value={form.modelo}
                      onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>No. de Inventario (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. INF-00123"
                      value={form.numeroInventario}
                      onChange={(e) => setForm({ ...form, numeroInventario: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>No. de Serie (Opcional)</label>
                    <input
                      type="text"
                      placeholder="S/N o lote"
                      value={form.numeroSerie}
                      onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>Estado Físico</label>
                  <select
                    value={form.estadoFisico}
                    onChange={(e) => setForm({ ...form, estadoFisico: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', outlineColor: '#691B31', backgroundColor: 'white' }}
                  >
                    <option value="Buen Estado">Buen Estado (Listo para instalar)</option>
                    <option value="Regular">Regular</option>
                    <option value="Por Reparar">Por Reparar / Reacondicionar</option>
                    <option value="Dañado">Dañado / Para Baja</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.75rem 1.75rem', backgroundColor: '#691B31', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px rgba(105,27,49,0.2)' }}
                  >
                    {editandoId ? 'Actualizar' : 'Guardar en Stock'}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
