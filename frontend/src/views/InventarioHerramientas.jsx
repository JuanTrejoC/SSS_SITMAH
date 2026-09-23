import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaWrench,
  FaHammer,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaFileExcel,
  FaImage,
  FaEye,
  FaUpload,
  FaCheckCircle,
  FaImages
} from 'react-icons/fa';

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

  // Tab activo: 'herramienta_infra' o 'herramienta_tec'
  const [tabActiva, setTabActiva] = useState(
    user?.rol === 'infraestructura' ? 'herramienta_infra' : 'herramienta_infra'
  );

  const [herramientas, setHerramientas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalInfra, setTotalInfra] = useState(0);
  const [totalTec, setTotalTec] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(10);
  const [busqueda, setBusqueda] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const [dashboardExpandido, setDashboardExpandido] = useState(false);

  // Modal de registro / edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(getInitialForm());
  const [sedesList, setSedesList] = useState(['CCGO', 'CETRAM', 'Oficinas Téllez', 'Oficinas Patio Téllez', 'Mantenimiento']);

  // Modal para ver imagen ampliada (Lightbox con soporte para hasta 3 imágenes)
  const [imagenModal, setImagenModal] = useState({
    abierta: false,
    imagenes: [],
    indiceActual: 0,
    titulo: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const cargarSedes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/catalogos/sedes`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.length > 0) {
            setSedesList(json.data.map((s) => s.nombre));
          }
        }
      } catch (err) {
        console.error('Error al cargar sedes:', err);
      }
    };
    cargarSedes();
  }, []);

  function getInitialForm(tipoSelected = tabActiva) {
    return {
      tipo: tipoSelected,
      numeroInventario: '',
      numeroSerie: '',
      marca: '',
      modelo: '',
      responsable: '',
      cargoResponsable: '',
      areaUbicacion: tipoSelected === 'herramienta_infra' ? 'Infraestructura' : 'Mantenimiento',
      detalles: {
        equipo: '',
        modeloTecnico: '',
        cantidad: 1,
        estadoFisico: 'Bueno',
        imagen: '',
        imagenes: []
      }
    };
  }

  // Cargar totales para cada pestaña
  const cargarContadores = async () => {
    if (!user?.token) return;
    try {
      const [resInfra, resTec] = await Promise.all([
        fetch(`${API_BASE_URL}/api/inventario-tecnologico?page=1&limit=1&tipo=herramienta_infra`, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        fetch(`${API_BASE_URL}/api/inventario-tecnologico?page=1&limit=1&tipo=herramienta_tec`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);

      if (resInfra.ok) {
        const jInfra = await resInfra.json();
        if (jInfra.ok && jInfra.meta) setTotalInfra(jInfra.meta.total);
      }
      if (resTec.ok) {
        const jTec = await resTec.json();
        if (jTec.ok && jTec.meta) setTotalTec(jTec.meta.total);
      }
    } catch (err) {
      console.error('Error cargando contadores:', err);
    }
  };

  const cargarHerramientas = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      const query = new URLSearchParams({
        page: pagina,
        limit: limite,
        search: busqueda,
        tipo: tabActiva
      });
      const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?${query}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setHerramientas(json.data);
        setTotal(json.meta.total);
        if (tabActiva === 'herramienta_infra') {
          setTotalInfra(json.meta.total);
        } else {
          setTotalTec(json.meta.total);
        }
      }
    } catch (err) {
      console.error('Error al cargar herramientas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHerramientas();
    cargarContadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, busqueda, tabActiva]);

  useEffect(() => {
    if (modalAbierto || imagenModal.abierta) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalAbierto, imagenModal.abierta]);

  // Manejo y compresión de imagen fotográfica
  const comprimirYConvertirImagen = (archivo) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 900;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(event.target.result);
      };
      reader.onerror = () => resolve('');
    });
  };

  // Permite hasta un máximo de 3 imágenes
  const handleSeleccionarImagenes = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imagenesActuales = form.detalles?.imagenes?.length
      ? form.detalles.imagenes
      : form.detalles?.imagen
      ? [form.detalles.imagen]
      : [];

    const disponibles = 3 - imagenesActuales.length;

    if (disponibles <= 0) {
      Swal.fire('Límite alcanzado', 'Solo se permite un máximo de 3 imágenes por herramienta.', 'warning');
      return;
    }

    const aProcesar = files.slice(0, disponibles);
    if (files.length > disponibles) {
      Swal.fire('Aviso', `Solo se agregarán ${disponibles} imagen(es) para no exceder el máximo de 3.`, 'info');
    }

    try {
      const nuevasDataUrls = await Promise.all(
        aProcesar
          .filter((f) => f.type.startsWith('image/'))
          .map((f) => comprimirYConvertirImagen(f))
      );

      const combinadas = [...imagenesActuales, ...nuevasDataUrls].slice(0, 3);

      setForm((prev) => ({
        ...prev,
        detalles: {
          ...prev.detalles,
          imagenes: combinadas,
          imagen: combinadas[0] || ''
        }
      }));
    } catch (err) {
      console.error('Error al procesar las imágenes:', err);
      Swal.fire('Error', 'No se pudieron cargar las imágenes seleccionadas.', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuitarImagenIndividual = (index) => {
    const actuales = form.detalles?.imagenes?.length
      ? form.detalles.imagenes
      : form.detalles?.imagen
      ? [form.detalles.imagen]
      : [];

    const filtradas = actuales.filter((_, idx) => idx !== index);
    setForm((prev) => ({
      ...prev,
      detalles: {
        ...prev.detalles,
        imagenes: filtradas,
        imagen: filtradas[0] || ''
      }
    }));
  };

  const handleExport = async () => {
    if (!user?.token) return;

    const nombreTipo = tabActiva === 'herramienta_infra' ? 'Infraestructura' : 'Tecnológicas';
    const confirm = await Swal.fire({
      title: '¿Desea descargar el archivo Excel?',
      text: `Se descargará el inventario de herramientas de ${nombreTipo}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    const query = new URLSearchParams({
      search: busqueda,
      tipo: tabActiva,
      mes: mesFiltro,
      includeImages: 'true',
      order: 'asc'
    });
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/tecnologico/export?${query}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_herramientas_${tabActiva}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const json = await res.json();
        Swal.fire('Error', json.error || 'Error al exportar a Excel', 'error');
      }
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      Swal.fire('Error', 'Error al exportar a Excel', 'error');
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    const nombreEquipo = form.detalles?.equipo || form.modelo || '';
    if (!nombreEquipo.trim()) {
      Swal.fire('Campo requerido', 'El nombre del equipo / herramienta es obligatorio.', 'warning');
      return;
    }

    const isInfra = form.tipo === 'herramienta_infra';
    const areaFinal = isInfra ? (form.areaUbicacion || 'Infraestructura') : form.areaUbicacion;

    if (!isInfra && (!areaFinal || !areaFinal.trim())) {
      Swal.fire('Campo requerido', 'La ubicación (área) es obligatoria.', 'warning');
      return;
    }

    const imagenesArray = form.detalles?.imagenes?.length
      ? form.detalles.imagenes
      : form.detalles?.imagen
      ? [form.detalles.imagen]
      : [];

    // Normalizar datos para compatibilidad
    const payload = {
      tipo: form.tipo,
      numeroInventario: form.numeroInventario || null,
      numeroSerie: isInfra ? null : (form.numeroSerie || null),
      marca: form.marca || null,
      modelo: nombreEquipo, // Guardamos el nombre en modelo para compatibilidad
      responsable: form.responsable || null,
      cargoResponsable: form.cargoResponsable || null,
      areaUbicacion: areaFinal,
      estatus: form.detalles?.estadoFisico || 'Bueno',
      detalles: {
        equipo: nombreEquipo,
        modeloTecnico: form.detalles?.modeloTecnico || '',
        cantidad: parseInt(form.detalles?.cantidad, 10) || 1,
        estadoFisico: form.detalles?.estadoFisico || 'Bueno',
        imagen: imagenesArray[0] || '',
        imagenes: imagenesArray
      }
    };

    try {
      const url = editandoId
        ? `${API_BASE_URL}/api/inventario-tecnologico/${editandoId}`
        : `${API_BASE_URL}/api/inventario-tecnologico`;
      const method = editandoId ? 'PUT' : 'POST';

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
        Swal.fire('Éxito', editandoId ? 'Herramienta actualizada' : 'Herramienta registrada exitosamente', 'success');
        setModalAbierto(false);
        cargarHerramientas();
        cargarContadores();
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
    const itemDetalles = item.detalles || {};
    const itemTipo = item.tipo || tabActiva;

    const imagenesArray = itemDetalles.imagenes?.length
      ? itemDetalles.imagenes
      : itemDetalles.imagen
      ? [itemDetalles.imagen]
      : [];

    setForm({
      tipo: itemTipo,
      numeroInventario: item.numeroInventario || '',
      numeroSerie: item.numeroSerie || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      responsable: item.responsable || '',
      cargoResponsable: item.cargoResponsable || '',
      areaUbicacion: item.areaUbicacion || (itemTipo === 'herramienta_infra' ? 'Infraestructura' : 'Mantenimiento'),
      detalles: {
        equipo: itemDetalles.equipo || item.modelo || '',
        modeloTecnico: itemDetalles.modeloTecnico || (itemDetalles.equipo ? item.modelo : ''),
        cantidad: itemDetalles.cantidad !== undefined ? itemDetalles.cantidad : 1,
        estadoFisico: itemDetalles.estadoFisico || item.estatus || 'Bueno',
        imagen: imagenesArray[0] || '',
        imagenes: imagenesArray
      }
    });
    setModalAbierto(true);
  };

  const handleEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro de eliminar?',
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
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          Swal.fire('Eliminado', 'La herramienta ha sido eliminada correctamente.', 'success');
          cargarHerramientas();
          cargarContadores();
        }
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  const resetForm = () => {
    setEditandoId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm(getInitialForm(tabActiva));
  };

  // Color de badge según estado físico
  const getBadgeEstadoFisico = (estado) => {
    const est = (estado || 'Bueno').toLowerCase();
    if (est.includes('buen') || est.includes('excelente')) {
      return {
        bg: '#ECFDF5',
        color: '#065F46',
        border: '#A7F3D0',
        label: estado || 'Bueno'
      };
    }
    if (est.includes('reg') || est.includes('usado')) {
      return {
        bg: '#FFFBEB',
        color: '#92400E',
        border: '#FDE68A',
        label: estado || 'Regular'
      };
    }
    if (est.includes('mal') || est.includes('dañad') || est.includes('repara')) {
      return {
        bg: '#FEF2F2',
        color: '#991B1B',
        border: '#FECACA',
        label: estado || 'Malo'
      };
    }
    return {
      bg: '#F1F5F9',
      color: '#334155',
      border: '#CBD5E1',
      label: estado || 'Activo'
    };
  };

  // Renderizador de celda de imagen en la tabla
  const renderImagenesTabla = (item, equipoNombre) => {
    const detalles = item.detalles || {};
    const imagenes = detalles.imagenes?.length
      ? detalles.imagenes
      : detalles.imagen
      ? [detalles.imagen]
      : [];

    if (imagenes.length === 0) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '45px',
            height: '45px',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            color: '#94a3b8'
          }}
          title="Sin imagen registrada"
        >
          <FaImage size={18} />
        </span>
      );
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
        {imagenes.map((imgSrc, idx) => (
          <div
            key={idx}
            className="img-thumb-container"
            onClick={() =>
              setImagenModal({
                abierta: true,
                imagenes: imagenes,
                indiceActual: idx,
                titulo: `${equipoNombre} (${item.numeroInventario || 'Sin Inv'}) - Foto ${idx + 1} de ${imagenes.length}`
              })
            }
            title={`Foto ${idx + 1} de ${imagenes.length} - Clic para ampliar`}
          >
            <img src={imgSrc} alt={`${equipoNombre} ${idx + 1}`} />
            <div className="img-hover-overlay">
              <FaEye size={14} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="inventario-main">
      <style>{`
        .inventario-main {
          padding: 2.5rem;
          flex: 1;
          background-color: #f8fafc;
          overflow-y: auto;
          min-height: 800px;
          padding-bottom: 15rem;
        }
        .inventario-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.85rem 1.6rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 2px solid transparent;
        }
        .tab-btn-active {
          background-color: #691B31;
          color: white;
          box-shadow: 0 4px 12px rgba(105, 27, 49, 0.25);
          border-color: #691B31;
        }
        .tab-btn-inactive {
          background-color: white;
          color: #475569;
          border-color: #E2E8F0;
        }
        .tab-btn-inactive:hover {
          background-color: #f1f5f9;
          color: #1e293b;
          border-color: #cbd5e1;
        }
        .tab-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .tab-btn-active .tab-badge {
          background-color: rgba(255, 255, 255, 0.25);
          color: white;
        }
        .tab-btn-inactive .tab-badge {
          background-color: #e2e8f0;
          color: #475569;
        }
        .table-custom {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 950px;
        }
        .table-custom th {
          background-color: #f1f5f9;
          color: #475569;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 1.1rem 1.25rem;
          font-weight: 700;
          border-bottom: 2px solid #e2e8f0;
        }
        .table-custom td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .img-thumb-container {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
        }
        .img-thumb-container:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          border-color: #BC955B;
        }
        .img-thumb-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .img-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .img-thumb-container:hover .img-hover-overlay {
          opacity: 1;
        }
        .modal-container-custom {
          background-color: white;
          border-radius: 16px;
          padding: 2.25rem;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        @media (max-width: 768px) {
          .inventario-main {
            padding: 1rem 1rem 12rem 1rem;
          }
          .inventario-grid-2col {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .modal-container-custom {
            padding: 1.25rem;
          }
        }
      `}</style>

      {/* ENCABEZADO DE PÁGINA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#691B31',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <FaWrench /> Inventario de Herramientas
          </h1>
          <p style={{ color: '#6F7271', margin: '0.4rem 0 0', fontSize: '0.98rem' }}>
            Gestione las herramientas físicas clasificadas por departamento con formato estructurado y evidencia fotográfica.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setModalAbierto(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            backgroundColor: '#691B31',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(105,27,49,0.22)',
            transition: 'background-color 0.2s, transform 0.1s',
            fontSize: '0.95rem'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#8a2441')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#691B31')}
        >
          <FaPlus /> Agregar Herramienta
        </button>
      </div>

      {/* ================= DASHBOARD SUMMARY ================= */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          marginBottom: '1.75rem'
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setDashboardExpandido(!dashboardExpandido)}
        >
          <h2
            style={{
              fontSize: '1.15rem',
              color: '#1E293B',
              fontWeight: '700',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <span style={{ color: '#BC955B' }}>📊</span> Dashboard de Herramientas
          </h2>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#691B31',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {dashboardExpandido ? '▲ Ocultar' : '▼ Mostrar'}
          </button>
        </div>

        {dashboardExpandido && (
          <div
            style={{
              marginTop: '1.25rem',
              borderTop: '1px solid #F1F5F9',
              paddingTop: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem'
            }}
          >
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaHammer color="#691B31" /> Herramientas Infraestructura
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem', marginBottom: 0 }}>
                  Equipos de obra y campo
                </p>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#691B31' }}>
                {totalInfra}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaWrench color="#0284c7" /> Herramientas Tecnológicas
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem', marginBottom: 0 }}>
                  Herramientas físicas de tecnologías
                </p>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0284c7' }}>
                {totalTec}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTONES / PESTAÑAS DE NAVEGACIÓN ================= */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setTabActiva('herramienta_infra');
            setPagina(1);
          }}
          className={`tab-btn ${tabActiva === 'herramienta_infra' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <FaHammer size={18} />
          <span>Herramientas de Infraestructura</span>
          <span className="tab-badge">{totalInfra}</span>
        </button>

        {user?.rol !== 'infraestructura' && (
          <button
            type="button"
            onClick={() => {
              setTabActiva('herramienta_tec');
              setPagina(1);
            }}
            className={`tab-btn ${tabActiva === 'herramienta_tec' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          >
            <FaWrench size={18} />
            <span>Herramientas Tecnológicas</span>
            <span className="tab-badge">{totalTec}</span>
          </button>
        )}
      </div>

      {/* ================= BARRA DE BÚSQUEDA Y ACCIONES ================= */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder={
              tabActiva === 'herramienta_infra'
                ? 'Buscar por equipo, inventario, marca, modelo...'
                : 'Buscar por herramienta tecnológica, serie, marca...'
            }
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            style={{ ...inputStyle, paddingLeft: '2.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          />
          <FaSearch
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }}
          />
        </div>

        <input
          type="month"
          value={mesFiltro}
          onChange={(e) => {
            setMesFiltro(e.target.value);
            setPagina(1);
          }}
          style={{ ...inputStyle, maxWidth: '170px' }}
        />

        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
          }}
        >
          <FaFileExcel size={16} />
          Exportar Excel
        </button>
      </div>

      {/* ================= TABLAS DE CONTENIDO ================= */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '1.1rem' }}>
          Cargando inventario de herramientas...
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '14px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            border: '1px solid #E2E8F0',
            overflowX: 'auto'
          }}
        >
          {tabActiva === 'herramienta_infra' ? (
            /* TABLA 1: HERRAMIENTAS DE INFRAESTRUCTURA (FORMATO EXCEL) */
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Tipo</th>
                  <th style={{ width: '160px' }}>No. Inventario</th>
                  <th>Equipo</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Cantidad</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Estado Físico</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Imagen</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {herramientas.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.05rem' }}>
                      No se encontraron herramientas de infraestructura registradas.
                    </td>
                  </tr>
                ) : (
                  herramientas.map((item) => {
                    const detalles = item.detalles || {};
                    const equipoNombre = detalles.equipo || item.modelo || 'Sin nombre';
                    const modeloTec = detalles.modeloTecnico || (detalles.equipo ? item.modelo : '-');
                    const cantidad = detalles.cantidad !== undefined ? detalles.cantidad : 1;
                    const estadoFisico = detalles.estadoFisico || item.estatus || 'Bueno';
                    const badge = getBadgeEstadoFisico(estadoFisico);

                    return (
                      <tr
                        key={item.id}
                        style={{ transition: 'background-color 0.15s' }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* TIPO */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              backgroundColor: '#fdf2f8',
                              color: '#691B31',
                              border: '1px solid #fbcfe8',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '9999px',
                              fontSize: '0.78rem',
                              fontWeight: '700'
                            }}
                          >
                            <FaHammer size={12} /> Infraestructura
                          </span>
                        </td>

                        {/* NO. INVENTARIO */}
                        <td>
                          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.92rem' }}>
                            {item.numeroInventario || 'INF-S/N'}
                          </div>
                        </td>

                        {/* EQUIPO */}
                        <td>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                            {equipoNombre}
                          </div>
                        </td>

                        {/* CANTIDAD */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.65rem',
                              backgroundColor: '#f1f5f9',
                              color: '#1e293b',
                              borderRadius: '6px',
                              fontWeight: '800',
                              fontSize: '0.95rem'
                            }}
                          >
                            {cantidad}
                          </span>
                        </td>

                        {/* MARCA */}
                        <td>
                          <div style={{ fontWeight: '600', color: '#334155' }}>
                            {item.marca || '-'}
                          </div>
                        </td>

                        {/* MODELO */}
                        <td>
                          <div style={{ fontWeight: '500', color: '#475569' }}>
                            {modeloTec || '-'}
                          </div>
                        </td>

                        {/* ESTADO FÍSICO */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: '0.3rem 0.7rem',
                              borderRadius: '9999px',
                              fontSize: '0.82rem',
                              fontWeight: '700'
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* IMAGEN (HASTA 3 FOTOS) */}
                        <td style={{ textAlign: 'center' }}>
                          {renderImagenesTabla(item, equipoNombre)}
                        </td>

                        {/* ACCIONES */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleEditar(item)}
                              title="Editar herramienta"
                              style={{
                                backgroundColor: '#fef3c7',
                                border: 'none',
                                color: '#d97706',
                                cursor: 'pointer',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fde68a')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fef3c7')}
                            >
                              <FaEdit size={15} />
                            </button>
                            <button
                              onClick={() => handleEliminar(item.id)}
                              title="Eliminar herramienta"
                              style={{
                                backgroundColor: '#fee2e2',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fecaca')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                            >
                              <FaTrashAlt size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* TABLA 2: HERRAMIENTAS TECNOLÓGICAS */
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Tipo</th>
                  <th style={{ width: '160px' }}>No. Inventario / Serie</th>
                  <th>Nombre / Modelo</th>
                  <th>Marca</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Cantidad</th>
                  <th>Ubicación</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Estado Físico</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Imagen</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {herramientas.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.05rem' }}>
                      No se encontraron herramientas tecnológicas registradas.
                    </td>
                  </tr>
                ) : (
                  herramientas.map((item) => {
                    const detalles = item.detalles || {};
                    const equipoNombre = detalles.equipo || item.modelo || 'Sin nombre';
                    const cantidad = detalles.cantidad !== undefined ? detalles.cantidad : 1;
                    const estadoFisico = detalles.estadoFisico || item.estatus || 'Bueno';
                    const badge = getBadgeEstadoFisico(estadoFisico);

                    return (
                      <tr
                        key={item.id}
                        style={{ transition: 'background-color 0.15s' }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* TIPO */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              backgroundColor: '#f0f9ff',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '9999px',
                              fontSize: '0.78rem',
                              fontWeight: '700'
                            }}
                          >
                            <FaWrench size={12} /> Tecnológica
                          </span>
                        </td>

                        {/* NO. INVENTARIO / SERIE */}
                        <td>
                          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.92rem' }}>
                            {item.numeroInventario || 'TEC-S/N'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Serie: {item.numeroSerie || '-'}
                          </div>
                        </td>

                        {/* NOMBRE / MODELO */}
                        <td>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                            {equipoNombre}
                          </div>
                        </td>

                        {/* MARCA */}
                        <td>
                          <div style={{ fontWeight: '600', color: '#334155' }}>
                            {item.marca || '-'}
                          </div>
                        </td>

                        {/* CANTIDAD */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.65rem',
                              backgroundColor: '#f1f5f9',
                              color: '#1e293b',
                              borderRadius: '6px',
                              fontWeight: '800',
                              fontSize: '0.95rem'
                            }}
                          >
                            {cantidad}
                          </span>
                        </td>

                        {/* UBICACIÓN */}
                        <td>
                          <div style={{ fontWeight: '600', color: '#334155' }}>
                            {item.areaUbicacion || 'Mantenimiento'}
                          </div>
                        </td>

                        {/* ESTADO FÍSICO */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: '0.3rem 0.7rem',
                              borderRadius: '9999px',
                              fontSize: '0.82rem',
                              fontWeight: '700'
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* IMAGEN (HASTA 3 FOTOS) */}
                        <td style={{ textAlign: 'center' }}>
                          {renderImagenesTabla(item, equipoNombre)}
                        </td>

                        {/* ACCIONES */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleEditar(item)}
                              title="Editar herramienta"
                              style={{
                                backgroundColor: '#fef3c7',
                                border: 'none',
                                color: '#d97706',
                                cursor: 'pointer',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fde68a')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fef3c7')}
                            >
                              <FaEdit size={15} />
                            </button>
                            <button
                              onClick={() => handleEliminar(item.id)}
                              title="Eliminar herramienta"
                              style={{
                                backgroundColor: '#fee2e2',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fecaca')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                            >
                              <FaTrashAlt size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* PAGINACIÓN */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.1rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Mostrando {total === 0 ? 0 : (pagina - 1) * limite + 1} a {Math.min(pagina * limite, total)} de {total} registros
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.45rem 0.9rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: '600'
                }}
              >
                <FaChevronLeft size={11} /> Anterior
              </button>
              <button
                disabled={pagina * limite >= total}
                onClick={() => setPagina((p) => p + 1)}
                style={{
                  padding: '0.45rem 0.9rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  cursor: pagina * limite >= total ? 'not-allowed' : 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: '600'
                }}
              >
                Siguiente <FaChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE REGISTRO / EDICIÓN ================= */}
      {modalAbierto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '1.25rem'
          }}
        >
          <div className="modal-container-custom" style={{ maxWidth: '680px' }}>
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                border: 'none',
                background: '#f1f5f9',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            >
              <FaTimes size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#fdf2f8',
                  color: '#691B31',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {form.tipo === 'herramienta_infra' ? <FaHammer size={20} /> : <FaWrench size={20} />}
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  {editandoId ? 'Actualizar Herramienta' : 'Registrar Nueva Herramienta'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  {form.tipo === 'herramienta_infra'
                    ? 'Inventario de Herramientas de Infraestructura'
                    : 'Inventario de Herramientas Tecnológicas'}
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardar}>
              {/* SELECTOR DE TIPO (si es admin) */}
              {user?.rol !== 'infraestructura' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Tipo de Herramienta *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, tipo: 'herramienta_infra', areaUbicacion: 'Infraestructura' }))}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: form.tipo === 'herramienta_infra' ? '2px solid #691B31' : '1px solid #CBD5E1',
                        backgroundColor: form.tipo === 'herramienta_infra' ? '#fdf2f8' : 'white',
                        color: form.tipo === 'herramienta_infra' ? '#691B31' : '#475569',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FaHammer /> Infraestructura
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, tipo: 'herramienta_tec' }))}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: form.tipo === 'herramienta_tec' ? '2px solid #0284c7' : '1px solid #CBD5E1',
                        backgroundColor: form.tipo === 'herramienta_tec' ? '#f0f9ff' : 'white',
                        color: form.tipo === 'herramienta_tec' ? '#0284c7' : '#475569',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FaWrench /> Tecnológica
                    </button>
                  </div>
                </div>
              )}

              {/* CAMPOS DINÁMICOS SEGÚN EL TIPO DE HERRAMIENTA */}
              {form.tipo === 'herramienta_infra' ? (
                /* SOLO LOS CAMPOS DE EXCEL PARA INFRAESTRUCTURA */
                <div className="inventario-grid-2col">
                  {/* EQUIPO */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Equipo *</label>
                    <input
                      type="text"
                      value={form.detalles?.equipo || form.modelo || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          modelo: e.target.value,
                          detalles: { ...prev.detalles, equipo: e.target.value }
                        }))
                      }
                      placeholder="Ej: Planta de generadora de energía eléctrica, Hidrolavadora de alta presión..."
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* CANTIDAD */}
                  <div>
                    <label style={labelStyle}>Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.detalles?.cantidad !== undefined ? form.detalles.cantidad : 1}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          detalles: { ...prev.detalles, cantidad: parseInt(e.target.value, 10) || 1 }
                        }))
                      }
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* ESTADO FÍSICO */}
                  <div>
                    <label style={labelStyle}>Estado Físico *</label>
                    <select
                      value={form.detalles?.estadoFisico || 'Bueno'}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          detalles: { ...prev.detalles, estadoFisico: e.target.value }
                        }))
                      }
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Malo">Malo</option>
                      <option value="En Reparación">En Reparación</option>
                    </select>
                  </div>

                  {/* MARCA */}
                  <div>
                    <label style={labelStyle}>Marca</label>
                    <input
                      type="text"
                      value={form.marca || ''}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      placeholder="Ej: ENERWELL, POWERMATE, Karcher, DEWALT"
                      style={inputStyle}
                    />
                  </div>

                  {/* MODELO */}
                  <div>
                    <label style={labelStyle}>Modelo</label>
                    <input
                      type="text"
                      value={form.detalles?.modeloTecnico || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          detalles: { ...prev.detalles, modeloTecnico: e.target.value }
                        }))
                      }
                      placeholder="Ej: G8000, PM8010, HD 8/23 G, DW3017"
                      style={inputStyle}
                    />
                  </div>

                  {/* NO. INVENTARIO */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>No. Inventario</label>
                    <input
                      type="text"
                      value={form.numeroInventario || ''}
                      onChange={(e) => setForm({ ...form, numeroInventario: e.target.value })}
                      placeholder="Ej: INF-01-001"
                      style={inputStyle}
                    />
                  </div>

                  {/* FOTOGRAFÍAS (MÁXIMO 3) */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>
                        Fotografías / Evidencias de la Herramienta
                      </label>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: (form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) >= 3 ? '#DC2626' : '#64748B' }}>
                        {form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)} de 3 permitidas
                      </span>
                    </div>

                    <div
                      style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        backgroundColor: '#f8fafc',
                        position: 'relative'
                      }}
                    >
                      {/* Galería de imágenes cargadas (hasta 3) */}
                      {(form.detalles?.imagenes?.length ? form.detalles.imagenes : form.detalles?.imagen ? [form.detalles.imagen] : []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                          {(form.detalles?.imagenes?.length ? form.detalles.imagenes : [form.detalles.imagen]).map((imgSrc, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: 'relative',
                                width: '105px',
                                height: '105px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: '2px solid #BC955B',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                              }}
                            >
                              <img
                                src={imgSrc}
                                alt={`Foto ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleQuitarImagenIndividual(idx)}
                                title="Eliminar foto"
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: 'rgba(220, 38, 38, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                <FaTimes size={12} />
                              </button>
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  fontWeight: '700',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px'
                                }}
                              >
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Botón para subir imágenes si no se ha alcanzado el límite de 3 */}
                      {(form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) < 3 ? (
                        <div style={{ textAlign: 'center' }}>
                          <FaImages size={28} color="#94A3B8" style={{ marginBottom: '0.4rem' }} />
                          <p style={{ margin: '0 0 0.3rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                            {(form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) === 0
                              ? 'Adjunte hasta 3 fotografías de la herramienta'
                              : 'Agregar otra fotografía (máximo 3)'}
                          </p>
                          <p style={{ margin: '0 0 0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            JPG, PNG o WEBP (se optimizan automáticamente)
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              padding: '0.5rem 1.25rem',
                              backgroundColor: '#691B31',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <FaUpload /> Seleccionar Imagen{(form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) > 0 ? ' adicional' : ''}
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#059669', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <FaCheckCircle /> Has alcanzado el límite máximo de 3 fotografías.
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSeleccionarImagenes}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* CAMPOS PARA HERRAMIENTAS TECNOLÓGICAS */
                <div className="inventario-grid-2col">
                  {/* NOMBRE DE HERRAMIENTA */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Nombre de la Herramienta Tecnológica *</label>
                    <input
                      type="text"
                      value={form.detalles?.equipo || form.modelo || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          modelo: e.target.value,
                          detalles: { ...prev.detalles, equipo: e.target.value }
                        }))
                      }
                      placeholder="Ej: Ponchadora de impacto RJ45, Multímetro digital, Tester de red"
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* CANTIDAD */}
                  <div>
                    <label style={labelStyle}>Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.detalles?.cantidad !== undefined ? form.detalles.cantidad : 1}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          detalles: { ...prev.detalles, cantidad: parseInt(e.target.value, 10) || 1 }
                        }))
                      }
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* ESTADO FÍSICO */}
                  <div>
                    <label style={labelStyle}>Estado Físico *</label>
                    <select
                      value={form.detalles?.estadoFisico || 'Bueno'}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          detalles: { ...prev.detalles, estadoFisico: e.target.value }
                        }))
                      }
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Malo">Malo</option>
                      <option value="En Reparación">En Reparación</option>
                    </select>
                  </div>

                  {/* MARCA */}
                  <div>
                    <label style={labelStyle}>Marca</label>
                    <input
                      type="text"
                      value={form.marca || ''}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      placeholder="Ej: Fluke, Truper, Klein Tools"
                      style={inputStyle}
                    />
                  </div>

                  {/* MODELO */}
                  <div>
                    <label style={labelStyle}>Modelo</label>
                    <input
                      type="text"
                      value={form.detalles?.modeloTecnico || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          detalles: { ...prev.detalles, modeloTecnico: e.target.value }
                        }))
                      }
                      placeholder="Ej: 117 Electrician, TL-828"
                      style={inputStyle}
                    />
                  </div>

                  {/* NO. INVENTARIO */}
                  <div>
                    <label style={labelStyle}>No. Inventario</label>
                    <input
                      type="text"
                      value={form.numeroInventario || ''}
                      onChange={(e) => setForm({ ...form, numeroInventario: e.target.value })}
                      placeholder="Ej: TEC-HER-001"
                      style={inputStyle}
                    />
                  </div>

                  {/* NO. SERIE */}
                  <div>
                    <label style={labelStyle}>No. Serie</label>
                    <input
                      type="text"
                      value={form.numeroSerie || ''}
                      onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
                      placeholder="Ej: SN-495832"
                      style={inputStyle}
                    />
                  </div>

                  {/* UBICACIÓN */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Ubicación (Área / Sede) *</label>
                    <select
                      value={form.areaUbicacion}
                      onChange={(e) => setForm({ ...form, areaUbicacion: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      required
                    >
                      <option value="">-- Seleccionar Ubicación --</option>
                      {sedesList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FOTOGRAFÍAS (MÁXIMO 3) */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>
                        Fotografías / Evidencias de la Herramienta
                      </label>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: (form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) >= 3 ? '#DC2626' : '#64748B' }}>
                        {form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)} de 3 permitidas
                      </span>
                    </div>

                    <div
                      style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        backgroundColor: '#f8fafc',
                        position: 'relative'
                      }}
                    >
                      {(form.detalles?.imagenes?.length ? form.detalles.imagenes : form.detalles?.imagen ? [form.detalles.imagen] : []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                          {(form.detalles?.imagenes?.length ? form.detalles.imagenes : [form.detalles.imagen]).map((imgSrc, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: 'relative',
                                width: '105px',
                                height: '105px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: '2px solid #0284c7',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                              }}
                            >
                              <img
                                src={imgSrc}
                                alt={`Foto ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleQuitarImagenIndividual(idx)}
                                title="Eliminar foto"
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: 'rgba(220, 38, 38, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                <FaTimes size={12} />
                              </button>
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  fontWeight: '700',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px'
                                }}
                              >
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) < 3 ? (
                        <div style={{ textAlign: 'center' }}>
                          <FaImages size={28} color="#94A3B8" style={{ marginBottom: '0.4rem' }} />
                          <p style={{ margin: '0 0 0.3rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                            {(form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) === 0
                              ? 'Adjunte hasta 3 fotografías de la herramienta'
                              : 'Agregar otra fotografía (máximo 3)'}
                          </p>
                          <p style={{ margin: '0 0 0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            JPG, PNG o WEBP (se optimizan automáticamente)
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              padding: '0.5rem 1.25rem',
                              backgroundColor: '#0284c7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <FaUpload /> Seleccionar Imagen{(form.detalles?.imagenes?.length || (form.detalles?.imagen ? 1 : 0)) > 0 ? ' adicional' : ''}
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#059669', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <FaCheckCircle /> Has alcanzado el límite máximo de 3 fotografías.
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSeleccionarImagenes}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BOTONES DE ACCIÓN */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    padding: '0.65rem 1.4rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#6F7271',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.92rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.6rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#691B31',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    boxShadow: '0 4px 8px rgba(105,27,49,0.2)'
                  }}
                >
                  {editandoId ? 'Guardar Cambios' : 'Registrar Herramienta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL LIGHTBOX PARA AMPLIAR IMAGEN (HASTA 3 FOTOS) ================= */}
      {imagenModal.abierta && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000,
            padding: '1.5rem'
          }}
          onClick={() => setImagenModal({ abierta: false, imagenes: [], indiceActual: 0, titulo: '' })}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '1.25rem',
              maxWidth: '850px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: '800' }}>
                📷 {imagenModal.titulo}
              </h3>
              <button
                type="button"
                onClick={() => setImagenModal({ abierta: false, imagenes: [], indiceActual: 0, titulo: '' })}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Visor de imagen activa con controles de navegación si hay más de 1 */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '65vh',
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a'
              }}
            >
              {imagenModal.imagenes.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setImagenModal((prev) => ({
                      ...prev,
                      indiceActual: (prev.indiceActual - 1 + prev.imagenes.length) % prev.imagenes.length
                    }))
                  }
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    color: '#1e293b',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <FaChevronLeft size={16} />
                </button>
              )}

              <img
                src={imagenModal.imagenes[imagenModal.indiceActual] || ''}
                alt={`Vista ${imagenModal.indiceActual + 1}`}
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              />

              {imagenModal.imagenes.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setImagenModal((prev) => ({
                      ...prev,
                      indiceActual: (prev.indiceActual + 1) % prev.imagenes.length
                    }))
                  }
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    color: '#1e293b',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <FaChevronRight size={16} />
                </button>
              )}
            </div>

            {/* Miniaturas inferiores para saltar entre las imágenes en el modal */}
            {imagenModal.imagenes.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                {imagenModal.imagenes.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setImagenModal((prev) => ({ ...prev, indiceActual: idx }))}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: idx === imagenModal.indiceActual ? '3px solid #691B31' : '1px solid #CBD5E1',
                      opacity: idx === imagenModal.indiceActual ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={imgSrc} alt={`Min ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
