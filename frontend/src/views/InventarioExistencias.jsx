import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
  FaBoxes, FaPlus, FaEdit, FaTimes, FaSearch, FaCogs, FaWrench, FaTools, FaHdd, FaChevronRight,
  FaCheckCircle, FaExclamationTriangle, FaMapMarkerAlt, FaFilter, FaArrowLeft, FaRedoAlt,
  FaFilePdf, FaDownload, FaFileAlt, FaChevronDown,
  FaDesktop, FaLaptop, FaMobileAlt, FaNetworkWired, FaServer, FaShieldAlt, FaWifi, FaVideo,
  FaBroadcastTower, FaPrint, FaTv, FaMemory, FaThLarge, FaGlobe, FaFan, FaPhone, FaMicrophone,
  FaPlug, FaTabletAlt, FaChevronLeft, FaLink, FaUnlink, FaTrashAlt, FaExclamationCircle
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

const normalizarEstado = (est) => {
  const e = String(est || '').toLowerCase().trim();
  if (e === 'baja' || e === 'dañado' || e === 'danado' || e === 'danada') return 'Baja';
  if (e === 'mantenimiento' || e === 'por reparar' || e === 'refacciones' || e === 'reparacion') return 'Mantenimiento';
  return 'Stock';
};

const obtenerGrupoBase = (item) => {
  const nombreRaw = (item.nombre || '').trim();
  const n = nombreRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const catRaw = (item.categoria || item.tipo || '').toLowerCase();

  // Detección por palabras clave para agrupar todos los teclados, mouses, rams, etc.
  if (n.includes('teclado') || n.includes('keyboard') || catRaw.includes('teclado')) {
    return {
      nombreBase: 'Teclado USB',
      categoria: 'periferico',
      tipoKey: 'teclados'
    };
  }
  if (n.includes('mouse') || n.includes('raton') || catRaw.includes('mouse')) {
    return {
      nombreBase: 'Mouse USB',
      categoria: 'periferico',
      tipoKey: 'mouses'
    };
  }
  if (n.includes('memoria ram') || n.includes('ram')) {
    let capacidad = '';
    if (n.includes('16gb') || n.includes('16 gb')) capacidad = ' 16GB';
    else if (n.includes('8gb') || n.includes('8 gb')) capacidad = ' 8GB';
    else if (n.includes('32gb') || n.includes('32 gb')) capacidad = ' 32GB';
    else if (n.includes('4gb') || n.includes('4 gb')) capacidad = ' 4GB';
    return {
      nombreBase: `Memoria RAM DDR4${capacidad}`,
      categoria: 'componente',
      tipoKey: `ram_${capacidad || 'general'}`
    };
  }
  if (n.includes('disco') || n.includes('ssd') || n.includes('hdd') || n.includes('solido') || n.includes('sólido')) {
    let cap = '';
    if (n.includes('1tb') || n.includes('1 tb')) cap = ' 1TB';
    else if (n.includes('480gb') || n.includes('480 gb')) cap = ' 480GB';
    else if (n.includes('240gb') || n.includes('240 gb')) cap = ' 240GB';
    else if (n.includes('512gb') || n.includes('512 gb')) cap = ' 512GB';
    else if (n.includes('256gb') || n.includes('256 gb')) cap = ' 256GB';
    const tipo = n.includes('ssd') || n.includes('solido') ? 'SSD' : n.includes('hdd') ? 'HDD' : 'Disco';
    return {
      nombreBase: `Disco Estado Sólido ${tipo}${cap}`,
      categoria: 'componente',
      tipoKey: `disco_${tipo}_${cap}`
    };
  }
  if (n.includes('fuente') || n.includes('poder') || n.includes('power supply')) {
    return {
      nombreBase: 'Fuente de Poder',
      categoria: 'componente',
      tipoKey: 'fuente_poder'
    };
  }
  if (n.includes('cable hdmi') || (n.includes('cable') && n.includes('hdmi'))) {
    return {
      nombreBase: 'Cable HDMI',
      categoria: 'accesorio',
      tipoKey: 'cable_hdmi'
    };
  }
  if (n.includes('cable de red') || n.includes('rj45') || n.includes('cat 6') || n.includes('patch cord')) {
    return {
      nombreBase: 'Cable de Red RJ45 (Cat 6)',
      categoria: 'accesorio',
      tipoKey: 'cable_red'
    };
  }
  if (n.includes('conector')) {
    return {
      nombreBase: 'Conectores RJ45',
      categoria: 'accesorio',
      tipoKey: 'conectores_rj45'
    };
  }
  if (n.includes('adaptador') && n.includes('vga')) {
    return {
      nombreBase: 'Adaptador HDMI a VGA',
      categoria: 'accesorio',
      tipoKey: 'adaptador_vga'
    };
  }
  if (n.includes('adaptador') && (n.includes('ethernet') || n.includes('red'))) {
    return {
      nombreBase: 'Adaptador USB a Ethernet',
      categoria: 'accesorio',
      tipoKey: 'adaptador_ethernet'
    };
  }
  if (n.includes('adaptador')) {
    return {
      nombreBase: 'Adaptadores',
      categoria: 'accesorio',
      tipoKey: 'adaptadores'
    };
  }
  if (n.includes('cinta')) {
    return {
      nombreBase: 'Cinta de Aislar',
      categoria: 'accesorio',
      tipoKey: 'cinta_aislar'
    };
  }
  if (n.includes('cincho')) {
    return {
      nombreBase: 'Cinchos plásticos',
      categoria: 'accesorio',
      tipoKey: 'cinchos'
    };
  }
  if (n.includes('pasta')) {
    return {
      nombreBase: 'Pasta Térmica',
      categoria: 'componente',
      tipoKey: 'pasta_termica'
    };
  }
  if (n.includes('pila') || n.includes('cr2032')) {
    return {
      nombreBase: 'Pila CR2032',
      categoria: 'componente',
      tipoKey: 'pila_cr2032'
    };
  }
  if (n.includes('switch')) {
    return {
      nombreBase: 'Switch de Red',
      categoria: 'equipo',
      tipoKey: 'switch'
    };
  }
  if (n.includes('access point') || n.includes('ap')) {
    return {
      nombreBase: 'Access Point',
      categoria: 'equipo',
      tipoKey: 'access_point'
    };
  }
  if (n.includes('lector')) {
    return {
      nombreBase: 'Lector de Tarjetas USB',
      categoria: 'periferico',
      tipoKey: 'lector_tarjetas'
    };
  }

  // Fallback a nombre base
  return {
    nombreBase: nombreRaw || 'Artículo General',
    categoria: item.categoria || item.tipo || 'componente',
    tipoKey: n.replace(/[^a-z0-9]/g, '_')
  };
};

function getInitialForm() {
  return {
    tipo: '',
    numeroInventario: '',
    numeroSerie: '',
    marca: '',
    modelo: '',
    responsable: '',
    cargoResponsable: '',
    direccion: '',
    areaUbicacion: 'Almacén de Sistemas',
    procedencia: '',
    estatus: 'Stock',
    detalles: {
      cantidad: 1
    }
  };
}

export default function InventarioExistencias() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [existencias, setExistencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Stock'); // 'Stock' | 'Mantenimiento' | 'Baja' | ''
  const [filtroOrigen, setFiltroOrigen] = useState(''); // '' | 'reemplazadas' | 'almacen'
  const [menuExportarAbierto, setMenuExportarAbierto] = useState(false);
  const exportDropdownRef = useRef(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [itemOrigen, setItemOrigen] = useState('existencia'); // 'existencia' | 'equipo'
  const [form, setForm] = useState(getInitialForm());
  const [mostrarDetallesForm, setMostrarDetallesForm] = useState(false);
  const [esClonIndividual, setEsClonIndividual] = useState(false);

  const [todosLosEquipos, setTodosLosEquipos] = useState([]);
  const [sedesList, setSedesList] = useState([]);
  const [cargosList, setCargosList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [estacionesList, setEstacionesList] = useState([]);

  const procesadoresUnicos = useMemo(() => {
    const todos = todosLosEquipos
      .map(eq => eq.detalles?.procesador)
      .filter(p => typeof p === 'string' && p.trim() !== '');
    return [...new Set(todos)].sort();
  }, [todosLosEquipos]);

  const graficasUnicas = useMemo(() => {
    const todos = todosLosEquipos
      .map(eq => eq.detalles?.tarjetaGrafica)
      .filter(p => typeof p === 'string' && p.trim() !== '');
    return [...new Set(todos)].sort();
  }, [todosLosEquipos]);

  const marcasUnicas = useMemo(() => {
    const todos = todosLosEquipos
      .map(eq => eq.marca)
      .filter(p => typeof p === 'string' && p.trim() !== '');
    return [...new Set(todos)].sort();
  }, [todosLosEquipos]);

  const modelosUnicos = useMemo(() => {
    const todos = todosLosEquipos
      .map(eq => eq.modelo)
      .filter(p => typeof p === 'string' && p.trim() !== '');
    return [...new Set(todos)].sort();
  }, [todosLosEquipos]);

  const seriesUnicas = useMemo(() => {
    const todos = todosLosEquipos
      .map(eq => eq.numeroSerie)
      .filter(p => typeof p === 'string' && p.trim() !== '');
    return [...new Set(todos)].sort();
  }, [todosLosEquipos]);

  const inventariosUnicos = useMemo(() => {
    const todos = todosLosEquipos
      .map(eq => eq.numeroInventario)
      .filter(p => typeof p === 'string' && p.trim() !== '');
    return [...new Set(todos)].sort();
  }, [todosLosEquipos]);

  const tieneMAC = ['switch', 'servidor', 'firewall', 'access_point', 'camara', 'dvr', 'antena', 'impresora', 'plotter', 'router'].includes(form.tipo);
  const tieneIP = ['switch', 'servidor', 'firewall', 'access_point', 'camara', 'dvr', 'antena', 'impresora', 'plotter', 'router'].includes(form.tipo);
  const tienePuertosRed = ['switch', 'firewall', 'router', 'dvr'].includes(form.tipo);
  const tieneAlmacenamiento = ['servidor', 'escritorio', 'laptop', 'celular', 'tableta'].includes(form.tipo);
  const tieneProcesador = ['servidor', 'escritorio', 'laptop'].includes(form.tipo);
  const sinInventario = ['internet', 'aire'].includes(form.tipo);
  const requiereResponsable = ['escritorio', 'laptop', 'radio', 'no_break', 'tableta'].includes(form.tipo);

  const gruposOpciones = TIPOS_EQUIPO.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {});

  const handleDetalleChange = (key, value) => {
    setForm(prev => ({ ...prev, detalles: { ...prev.detalles, [key]: value } }));
  };

  const handleNuevo = () => {
    resetForm();
    setMostrarDetallesForm(true);
    setEsClonIndividual(false);
    setModalAbierto(true);
  };

  const cargarExistencias = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      const resEq = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?limit=2000&estatusNot=Activo`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      let eqItems = [];
      if (resEq.ok) {
        const jsonEq = await resEq.json();
        if (jsonEq.ok && Array.isArray(jsonEq.data)) {
          eqItems = jsonEq.data.map(item => {
            return {
              id: item.id,
              origen: 'equipo',
              nombre: item.detalles?.nombre || `${item.marca || ''} ${item.modelo || ''}`.trim() || item.tipo,
              categoria: item.detalles?.categoria || item.tipo,
              cantidad: 1,
              estadoFisico: normalizarEstado(item.estatus || item.detalles?.estadoFisico),
              areaUbicacion: item.areaUbicacion || item.detalles?.areaUbicacion || 'Almacén de Sistemas',
              marca: item.marca || '',
              modelo: item.modelo || '',
              numeroSerie: item.numeroSerie || '',
              numeroInventario: item.numeroInventario || '',
              equipoOriginal: item
            };
          });
        }
      }
      setExistencias(eqItems);
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
    const cargarCatalogos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/catalogos/sedes`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.length > 0) setSedesList(json.data.map(s => s.nombre));
        }
      } catch (err) { console.error('Error al cargar sedes:', err); }

      try {
        const res = await fetch(`${API_BASE_URL}/api/catalogos/cargos`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.length > 0) setCargosList(json.data.map(c => c.nombre));
        }
      } catch (err) { console.error('Error al cargar cargos:', err); }

      try {
        const res = await fetch(`${API_BASE_URL}/api/catalogos/areas`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.length > 0) setAreasList(json.data.map(a => a.nombre));
        }
      } catch (err) { console.error('Error al cargar areas:', err); }

      try {
        const res = await fetch(`${API_BASE_URL}/api/catalogos/estaciones`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.length > 0) setEstacionesList(json.data);
        }
      } catch (err) { console.error('Error al cargar estaciones:', err); }
    };

    const cargarTodosLosEquipos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario-tecnologico?limit=1000`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const json = await res.json();
        if (res.ok && json.ok) setTodosLosEquipos(json.data);
      } catch (err) { console.error('Error al cargar todos los equipos:', err); }
    };

    cargarCatalogos();
    if (user?.token) cargarTodosLosEquipos();
  }, [user]);

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
    if (!form.tipo) {
      Swal.fire('Error', 'Seleccione un tipo de equipo.', 'error');
      return;
    }

    try {
      const payload = {
        tipo: form.tipo,
        marca: form.marca || null,
        modelo: form.modelo || null,
        numeroSerie: form.numeroSerie || null,
        numeroInventario: form.numeroInventario || null,
        areaUbicacion: form.areaUbicacion || 'Almacén de Sistemas',
        estatus: form.estatus,
        procedencia: form.procedencia || null,
        responsable: form.responsable || null,
        cargoResponsable: form.cargoResponsable || null,
        direccion: form.direccion || null,
        detalles: { ...form.detalles }
      };

      const url = editandoId
        ? `${API_BASE_URL}/api/inventario-tecnologico/${editandoId}`
        : `${API_BASE_URL}/api/inventario-tecnologico`;
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        Swal.fire({
          title: 'Éxito',
          text: editandoId ? 'Actualizado correctamente.' : 'Registrado correctamente.',
          icon: 'success',
          confirmButtonColor: '#691B31'
        });
        setModalAbierto(false);
        resetForm();
        cargarExistencias();
      } else {
        Swal.fire('Error', json.error || 'No se pudo guardar.', 'error');
      }
    } catch (err) {
      console.error('Error al guardar existencias:', err);
      Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
    }
  };

  const handleEditar = (item) => {
    setEditandoId(item.id);
    setItemOrigen(item.origen || 'existencia');
    const original = item.equipoOriginal || item;
    setForm({
      tipo: original.tipo || '',
      numeroInventario: original.numeroInventario || '',
      numeroSerie: original.numeroSerie || '',
      marca: original.marca || '',
      modelo: original.modelo || '',
      responsable: original.responsable || '',
      cargoResponsable: original.cargoResponsable || '',
      direccion: original.direccion || '',
      areaUbicacion: original.areaUbicacion || 'Almacén de Sistemas',
      procedencia: original.procedencia || '',
      estatus: original.estatus || 'Stock',
      detalles: original.detalles || { cantidad: original.cantidad || 1 }
    });
    setMostrarDetallesForm(true);
    setEsClonIndividual(false);
    setModalAbierto(true);
  };

  const handleClonar = (item) => {
    setEditandoId(null);
    setItemOrigen(item.origen || 'existencia');
    const original = item.equipoOriginal || item;
    setForm({
      tipo: original.tipo || '',
      numeroInventario: '',
      numeroSerie: '',
      marca: original.marca || '',
      modelo: original.modelo || '',
      responsable: '',
      cargoResponsable: '',
      direccion: '',
      areaUbicacion: '',
      procedencia: original.procedencia || '',
      estatus: original.estatus || 'Stock',
      detalles: { ...(original.detalles || {}), cantidad: 1 }
    });
    setMostrarDetallesForm(false);
    setEsClonIndividual(false);
    setModalAbierto(true);
  };

  const handleClonarIndividual = (item) => {
    setEditandoId(null);
    setItemOrigen(item.origen || 'existencia');
    const original = item.equipoOriginal || item;
    setForm({
      tipo: original.tipo || '',
      numeroInventario: '',
      numeroSerie: '',
      marca: original.marca || '',
      modelo: original.modelo || '',
      responsable: original.responsable || '',
      cargoResponsable: original.cargoResponsable || '',
      direccion: original.direccion || '',
      areaUbicacion: original.areaUbicacion || 'Almacén de Sistemas',
      procedencia: original.procedencia || '',
      estatus: original.estatus || 'Stock',
      detalles: { ...(original.detalles || {}), cantidad: 1 }
    });
    setMostrarDetallesForm(false);
    setEsClonIndividual(true);
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
        const url = `${API_BASE_URL}/api/inventario-tecnologico/${item.id}`;
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
    setForm(getInitialForm());
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setMenuExportarAbierto(false);
      }
    };
    if (menuExportarAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuExportarAbierto]);

  const exportarReportePDF = async (tipo = 'actual') => {
    try {
      let registros = [];
      let tituloDoc = 'INVENTARIO DE EXISTENCIAS';
      let subtituloDoc = 'REPORTE GENERAL DE STOCK Y REFACCIONES';

      if (tipo === 'Stock' || tipo === 'buen_estado') {
        registros = existencias.filter(i => normalizarEstado(i.estadoFisico) === 'Stock');
        tituloDoc = 'REPORTE DE PIEZAS EN BUEN ESTADO / STOCK';
        subtituloDoc = 'Componentes, accesorios y equipos operativos en buen estado';
      } else if (tipo === 'Mantenimiento' || tipo === 'Refacciones' || tipo === 'por_reparar') {
        registros = existencias.filter(i => normalizarEstado(i.estadoFisico) === 'Mantenimiento');
        tituloDoc = 'REPORTE DE PIEZAS POR REPARAR / MANTENIMIENTO';
        subtituloDoc = 'Piezas retiradas o en proceso de revisión o reparación';
      } else if (tipo === 'Baja' || tipo === 'danado') {
        registros = existencias.filter(i => normalizarEstado(i.estadoFisico) === 'Baja');
        tituloDoc = 'REPORTE DE PIEZAS DAÑADAS / BAJA';
        subtituloDoc = 'Piezas no operativas o descartadas tras reemplazo';
      } else {
        // 'actual' (con filtros aplicados)
        registros = existencias.filter(item => {
          const coincideTexto = (
            (item.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (item.marca || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (item.modelo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (item.numeroSerie || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (item.numeroInventario || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (item.areaUbicacion || '').toLowerCase().includes(busqueda.toLowerCase())
          );
          const coincideEstado = !filtroEstado || normalizarEstado(item.estadoFisico) === normalizarEstado(filtroEstado);
          const coincideOrigen = !filtroOrigen || (
              filtroOrigen === 'reemplazadas'
                ? (item.nombre?.includes('Reemplazada') || item.nombre?.includes('Retirada') || item.numeroInventario?.includes('-RET'))
                : (!item.nombre?.includes('Reemplazada') && !item.nombre?.includes('Retirada') && !item.numeroInventario?.includes('-RET'))
            );
            const normalizar = str => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/s$/, '');
            const catFiltro = normalizar(filtroCategoria);
            const catItem = normalizar(item.categoria || item.tipo || 'componente');
            const coincideCategoria = !filtroCategoria || catItem.includes(catFiltro);
            return coincideTexto && coincideEstado && coincideOrigen && coincideCategoria;
        });

        if (filtroEstado) {
          const nombreEstadoFiltro = normalizarEstado(filtroEstado) === 'Stock' ? 'BUEN ESTADO' : normalizarEstado(filtroEstado) === 'Mantenimiento' ? 'POR REPARAR' : 'DAÑADAS / BAJA';
          tituloDoc = `REPORTE DE PIEZAS - ${nombreEstadoFiltro}`;
          subtituloDoc = `Filtro aplicado por estado físico: ${nombreEstadoFiltro}`;
        }
      }

      if (registros.length === 0) {
        Swal.fire({
          title: 'Sin registros',
          text: 'No hay piezas o artículos para exportar con el criterio seleccionado.',
          icon: 'info',
          confirmButtonColor: '#691B31'
        });
        return;
      }

      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Cargar logos institucionales
      const loadImg = (src, tintColor) => new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          if (tintColor) {
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = tintColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
      });

      const logoHidalgo = await loadImg('/images/sitmah_logo.webp', '#691B31');
      const logoSitmah = await loadImg('/images/sistema de tm.webp');

      const totalPiezas = registros.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
      const countBuen = registros.filter(r => normalizarEstado(r.estadoFisico) === 'Stock').reduce((a, r) => a + (Number(r.cantidad) || 0), 0);
      const countRep = registros.filter(r => normalizarEstado(r.estadoFisico) === 'Mantenimiento').reduce((a, r) => a + (Number(r.cantidad) || 0), 0);
      const countDan = registros.filter(r => normalizarEstado(r.estadoFisico) === 'Baja').reduce((a, r) => a + (Number(r.cantidad) || 0), 0);

      const drawHeaderFooter = (data) => {
        // Franja superior institucional
        doc.setFillColor(105, 27, 49);
        doc.rect(0, 0, pageWidth, 5, 'F');

        // Franja inferior institucional
        doc.setFillColor(105, 27, 49);
        doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Página ${data.pageNumber}`, pageWidth - 15, pageHeight - 3, { align: 'right' });
        doc.text('SISTEMA INTEGRAL DE CONTROL SITMAH - INVENTARIO DE EXISTENCIAS', 15, pageHeight - 3);

        if (data.pageNumber === 1) {
          if (logoHidalgo) doc.addImage(logoHidalgo, 'PNG', 14, 8, 30, 10);

          doc.setTextColor(105, 27, 49);
          doc.setFontSize(16);
          doc.setFont(undefined, 'bold');
          doc.text(tituloDoc, pageWidth / 2, 14, { align: 'center' });

          doc.setTextColor(184, 134, 11);
          doc.setFontSize(9);
          doc.text(subtituloDoc.toUpperCase(), pageWidth / 2, 19, { align: 'center' });

          doc.setTextColor(100);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.text(`Fecha de emisión:\n${new Date().toLocaleString()}`, pageWidth - 14, 11, { align: 'right' });

          // Tarjetas de resumen en el encabezado
          const drawMiniCard = (x, y, w, h, label, val, bgHex, textHex) => {
            doc.setFillColor(bgHex[0], bgHex[1], bgHex[2]);
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.roundedRect(x, y, w, h, 2, 2, 'FD');

            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text(label, x + w / 2, y + 5.5, { align: 'center' });

            doc.setFontSize(11);
            doc.setTextColor(textHex[0], textHex[1], textHex[2]);
            doc.setFont(undefined, 'bold');
            doc.text(val.toString(), x + w / 2, y + 12, { align: 'center' });
            doc.setFont(undefined, 'normal');
          };

          const cardW = 56;
          const gap = 10;
          const startX = (pageWidth - (4 * cardW + 3 * gap)) / 2;
          const cardY = 24;

          drawMiniCard(startX, cardY, cardW, 15, 'TOTAL PIEZAS', `${totalPiezas} uds.`, [248, 250, 252], [15, 23, 42]);
          drawMiniCard(startX + (cardW + gap), cardY, cardW, 15, 'BUEN ESTADO', `${countBuen} uds.`, [236, 253, 245], [4, 120, 87]);
          drawMiniCard(startX + 2 * (cardW + gap), cardY, cardW, 15, 'POR REPARAR', `${countRep} uds.`, [255, 251, 235], [180, 83, 9]);
          drawMiniCard(startX + 3 * (cardW + gap), cardY, cardW, 15, 'DAÑADAS / BAJA', `${countDan} uds.`, [254, 242, 242], [185, 28, 28]);
        } else {
          // Encabezado compacto
          if (logoHidalgo) doc.addImage(logoHidalgo, 'PNG', 14, 6, 22, 7);
          doc.setTextColor(105, 27, 49);
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(`${tituloDoc} (Continuación)`, pageWidth / 2, 11, { align: 'center' });
          doc.setTextColor(184, 134, 11);
          doc.setFontSize(8);
          doc.text('SISTEMA DE TRANSPORTE METROPOLITANO DE HIDALGO', pageWidth / 2, 15, { align: 'center' });
        }

        if (logoSitmah) {
          doc.addImage(logoSitmah, 'PNG', pageWidth / 2 - 15, pageHeight - 22, 30, 9);
        }
      };

      const getEstadoFisicoTexto = (est) => {
        const norm = normalizarEstado(est);
        if (norm === 'Stock') return 'BUEN ESTADO';
        if (norm === 'Mantenimiento') return 'POR REPARAR';
        if (norm === 'Baja') return 'DAÑADO / BAJA';
        return (est || 'BUEN ESTADO').toUpperCase();
      };

      const tableColumn = [
        "#",
        "ARTÍCULO / COMPONENTE",
        "CATEGORÍA",
        "CANT.",
        "MARCA / MODELO",
        "N° INVENTARIO",
        "N° SERIE",
        "UBICACIÓN",
        "ORIGEN",
        "ESTADO FÍSICO"
      ];

      const tableRows = registros.map((item, index) => {
        const esReemplazada = item.nombre?.includes('Reemplazada') || item.nombre?.includes('Retirada') || item.numeroInventario?.includes('-RET');
        const origenTexto = esReemplazada ? 'Reporte / Reemplazo' : 'Stock General';

        return [
          index + 1,
          item.nombre || 'N/A',
          (item.categoria || 'Componente').toUpperCase(),
          item.cantidad || 0,
          `${item.marca || '—'} ${item.modelo || ''}`.trim() || '—',
          item.numeroInventario || '—',
          item.numeroSerie || '—',
          item.areaUbicacion || 'Almacén de Sistemas',
          origenTexto,
          getEstadoFisicoTexto(item.estadoFisico)
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 44,
        margin: { top: 18, bottom: 25, left: 12, right: 12 },
        showHead: 'everyPage',
        pageBreak: 'auto',
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2.5, halign: 'center', valign: 'middle', lineColor: [229, 231, 235], overflow: 'linebreak' },
        headStyles: { fillColor: [105, 27, 49], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { halign: 'left', cellWidth: 55, fontStyle: 'bold' },
          2: { cellWidth: 25 },
          3: { cellWidth: 14, fontStyle: 'bold' },
          4: { halign: 'left', cellWidth: 40 },
          5: { cellWidth: 28 },
          6: { cellWidth: 28 },
          7: { halign: 'left', cellWidth: 35 },
          8: { cellWidth: 24, fontSize: 6.5 },
          9: { cellWidth: 25, fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [255, 253, 248] },
        didDrawPage: drawHeaderFooter,
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 9) {
            doc.setTextColor(255, 255, 255);
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 9) {
            const estado = String(data.cell.raw || '').toUpperCase();
            let bgColor = [220, 252, 231];
            let textColor = [22, 163, 74];

            if (estado.includes('POR REPARAR') || estado.includes('MANTENIMIENTO') || estado.includes('REPARACIÓN')) {
              bgColor = [254, 249, 195];
              textColor = [180, 83, 9];
            } else if (estado.includes('DAÑAD') || estado.includes('BAJA')) {
              bgColor = [254, 226, 226];
              textColor = [220, 38, 38];
            }

            const x = data.cell.x + 2;
            const y = data.cell.y + 2;
            const w = data.cell.width - 4;
            const h = data.cell.height - 4;

            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.roundedRect(x, y, w, h, 2, 2, 'F');

            doc.setFontSize(6.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont(undefined, 'bold');
            doc.text(estado, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1.5, { align: 'center' });
          }
        }
      });

      const sufijo = tipo === 'buen_estado' || tipo === 'Stock' ? 'Buen_Estado' : tipo === 'por_reparar' || tipo === 'Mantenimiento' ? 'Por_Reparar' : tipo === 'danado' || tipo === 'Baja' ? 'Danados' : 'Existencias';
      const nombreArchivo = `Reporte_SITMAH_${sufijo}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(nombreArchivo);

      Swal.fire({
        title: '¡PDF Generado!',
        text: `Se ha descargado "${nombreArchivo}" exitosamente.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
    }
  };

  return (
    <main style={{ padding: '2.5rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto', minHeight: '800px', paddingBottom: '15rem' }}>
      <style>{`
        .inventario-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .inventario-grid-spec {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .dropdown-select-container {
          display: flex;
          height: 320px;
        }
        .dropdown-left-pane {
          width: 45%;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
          padding: 0.5rem;
          background-color: #ffffff;
        }
        .dropdown-right-pane {
          width: 55%;
          overflow-y: auto;
          padding: 0.5rem;
          background-color: #f8fafc;
        }
        @media (max-width: 768px) {
          .inventario-grid-2col, .inventario-grid-spec {
            grid-template-columns: 1fr;
          }
          .dropdown-select-container {
            flex-direction: column;
            height: auto;
          }
          .dropdown-left-pane, .dropdown-right-pane {
            width: 100%;
          }
        }
      `}</style>
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

        {/* BOTONES DE ACCIÓN: INGRESAR STOCK Y EXPORTAR REPORTES PDF */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleNuevo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: '#BC955B',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 1.25rem',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(188, 149, 91, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#9e7943'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#BC955B'}
          >
            <FaPlus size={14} />
            <span>Ingresar Stock</span>
          </button>

          <div ref={exportDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuExportarAbierto(!menuExportarAbierto)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: '#691B31',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.25rem',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(105, 27, 49, 0.25)',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#531325'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#691B31'}
            >
              <FaFilePdf size={16} />
              <span>Exportar Reportes PDF</span>
              <FaChevronDown size={11} style={{ transform: menuExportarAbierto ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>

          {menuExportarAbierto && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              border: '1px solid #E5E7EB',
              width: '280px',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out'
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #F3F4F6', backgroundColor: '#F8FAFC' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Seleccione el reporte:
                </span>
              </div>

              <div style={{ padding: '0.4rem' }}>
                {/* 1. Stock */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuExportarAbierto(false);
                    exportarReportePDF('Stock');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                    <FaCheckCircle size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#065F46' }}>1. Piezas en Buen Estado</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Stock operativo disponible</div>
                  </div>
                </button>

                {/* 2. Mantenimiento / Revisión */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuExportarAbierto(false);
                    exportarReportePDF('Mantenimiento');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FFFBEB'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                    <FaTools size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#92400E' }}>2. Piezas Por Reparar / Mantenimiento</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>En proceso de revisión o reparación</div>
                  </div>
                </button>

                {/* 3. Dañadas / Baja */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuExportarAbierto(false);
                    exportarReportePDF('Baja');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                    <FaExclamationTriangle size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991B1B' }}>3. Piezas Dañadas / Baja</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Descartadas tras reemplazo</div>
                  </div>
                </button>

                <div style={{ height: '1px', backgroundColor: '#F3F4F6', margin: '0.35rem 0' }}></div>

                {/* 4. Vista Actual Filtrada */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuExportarAbierto(false);
                    exportarReportePDF('actual');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                    <FaFileAlt size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>Exportar Vista Actual</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Con los filtros que tienes activos</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* FILTROS DE ESTADO FÍSICO (3 TARJETAS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Cuadri: Stock */}
        {(() => {
          const countBuenEstado = existencias.filter(i => i.estadoFisico === 'Stock' || i.estadoFisico === 'Buen Estado').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
          const totalArticulos = existencias.filter(i => i.estadoFisico === 'Stock' || i.estadoFisico === 'Buen Estado').length;
          const isActive = filtroEstado === 'Stock';
          return (
            <div
              onClick={() => setFiltroEstado(isActive ? '' : 'Stock')}
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
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Stock / Disponible
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#064e3b', lineHeight: 1.1 }}>
                  {countBuenEstado} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#059669' }}>piezas</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {totalArticulos} {totalArticulos === 1 ? 'artículo registrado' : 'artículos registrados'}
                </div>
                
                {/* Botón rápido de PDF en la tarjeta */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportarReportePDF('Stock');
                  }}
                  title="Descargar Reporte PDF de Stock"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    backgroundColor: '#DCFCE7',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#BBF7D0'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#DCFCE7'}
                >
                  <FaDownload size={10} /> PDF Stock
                </button>
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
                fontSize: '1.3rem',
                flexShrink: 0
              }}>
                <FaCheckCircle />
              </div>
            </div>
          );
        })()}

        {/* Cuadri: Mantenimiento / Revisión */}
        {(() => {
          const countMantenimiento = existencias.filter(i => i.estadoFisico === 'Mantenimiento' || i.estadoFisico === 'Refacciones' || i.estadoFisico === 'reparacion').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
          const totalArticulos = existencias.filter(i => i.estadoFisico === 'Mantenimiento' || i.estadoFisico === 'Refacciones' || i.estadoFisico === 'reparacion').length;
          const isActive = filtroEstado === 'Mantenimiento';
          return (
            <div
              onClick={() => setFiltroEstado(isActive ? '' : 'Mantenimiento')}
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
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    En Mantenimiento / Revisión
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#78350f', lineHeight: 1.1 }}>
                  {countMantenimiento} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#d97706' }}>piezas</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {totalArticulos} {totalArticulos === 1 ? 'artículo en revisión' : 'artículos en revisión'}
                </div>

                {/* Botón rápido de PDF en la tarjeta */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportarReportePDF('Mantenimiento');
                  }}
                  title="Descargar Reporte PDF de Mantenimiento"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FDE68A',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FDE68A'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                >
                  <FaDownload size={10} /> PDF Mantenimiento
                </button>
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
                fontSize: '1.3rem',
                flexShrink: 0
              }}>
                <FaTools />
              </div>
            </div>
          );
        })()}

        {/* Cuadri: Baja */}
        {(() => {
          const countDanado = existencias.filter(i => i.estadoFisico === 'Baja' || i.estadoFisico === 'Dañado').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
          const totalArticulos = existencias.filter(i => i.estadoFisico === 'Baja' || i.estadoFisico === 'Dañado').length;
          const isActive = filtroEstado === 'Baja';
          return (
            <div
              onClick={() => setFiltroEstado(isActive ? '' : 'Baja')}
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
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Baja / Dañado
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7f1d1d', lineHeight: 1.1 }}>
                  {countDanado} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626' }}>piezas</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {totalArticulos} {totalArticulos === 1 ? 'artículo en baja' : 'artículos en baja'}
                </div>

                {/* Botón rápido de PDF en la tarjeta */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportarReportePDF('Baja');
                  }}
                  title="Descargar Reporte PDF de Bajas"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    backgroundColor: '#FEE2E2',
                    color: '#B91C1C',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FECACA'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                >
                  <FaDownload size={10} /> PDF Bajas
                </button>
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
                fontSize: '1.3rem',
                flexShrink: 0
              }}>
                <FaExclamationTriangle />
              </div>
            </div>
          );
        })()}
      </div>

      {/* BANNER DE FILTRO ACTIVO */}
      {(filtroEstado || filtroOrigen) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: filtroEstado === 'Stock' ? '#ecfdf5' : filtroEstado === 'Mantenimiento' || filtroEstado === 'Refacciones' ? '#fffbeb' : filtroEstado === 'Baja' ? '#fef2f2' : '#f1f5f9',
          border: `1px solid ${filtroEstado === 'Stock' ? '#a7f3d0' : filtroEstado === 'Mantenimiento' || filtroEstado === 'Refacciones' ? '#fde68a' : filtroEstado === 'Baja' ? '#fecaca' : '#cbd5e1'}`,
          borderRadius: '10px',
          padding: '0.65rem 1.25rem',
          marginBottom: '1.5rem',
          color: filtroEstado === 'Stock' ? '#065f46' : filtroEstado === 'Mantenimiento' || filtroEstado === 'Refacciones' ? '#92400e' : filtroEstado === 'Baja' ? '#991b1b' : '#334155',
          fontWeight: '600',
          fontSize: '0.9rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <FaFilter size={13} />
            <span>
              Filtros activos:{' '}
              {filtroEstado && (
                <span>
                  Estado: <strong>{filtroEstado}</strong>
                </span>
              )}
              {filtroEstado && filtroOrigen && ' | '}
              {filtroOrigen && (
                <span>
                  Procedencia: <strong>{filtroOrigen === 'reemplazadas' ? 'De Reportes (Reemplazadas)' : 'Stock de Almacén'}</strong>
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setFiltroEstado('');
              setFiltroOrigen('');
            }}
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
            <FaRedoAlt size={11} /> Limpiar filtros
          </button>
        </div>
      )}

      {/* FILTROS Y BÚSQUEDA */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Buscador */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Buscar existencias por nombre, serie, inventario..."
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

        {/* Filtro por Categoría */}
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={{
            padding: '0.75rem 1.25rem',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            fontSize: '0.92rem',
            color: '#475569',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
            minWidth: '190px'
          }}
        >
          <option value="">Todas las categorías</option>
          <option value="componente">Componentes</option>
          <option value="accesorio">Accesorios</option>
          <option value="periferico">Periféricos</option>
          <option value="equipo">Equipos</option>
          <option value="herramienta">Herramientas</option>
        </select>

        {/* Filtro por Procedencia / Reporte */}
        <select
          value={filtroOrigen}
          onChange={(e) => setFiltroOrigen(e.target.value)}
          style={{
            padding: '0.75rem 1.25rem',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            fontSize: '0.92rem',
            color: '#475569',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
            minWidth: '210px'
          }}
        >
          <option value="">Todos los orígenes</option>
          <option value="reemplazadas">De Reportes (Reemplazadas)</option>
          <option value="almacen">Stock General de Almacén</option>
        </select>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN POR ESTADO */}
      {(() => {
        const countStock = existencias.filter(i => normalizarEstado(i.estadoFisico) === 'Stock').reduce((sum, i) => sum + (Number(i.cantidad) || 1), 0);
        const countMantenimiento = existencias.filter(i => normalizarEstado(i.estadoFisico) === 'Mantenimiento').reduce((sum, i) => sum + (Number(i.cantidad) || 1), 0);
        const countBaja = existencias.filter(i => normalizarEstado(i.estadoFisico) === 'Baja').reduce((sum, i) => sum + (Number(i.cantidad) || 1), 0);
        const countTotal = existencias.reduce((sum, i) => sum + (Number(i.cantidad) || 1), 0);

        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            backgroundColor: '#ffffff',
            padding: '0.6rem 0.75rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <button
              type="button"
              onClick={() => setFiltroEstado('Stock')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filtroEstado === 'Stock' ? '#10b981' : 'transparent',
                color: filtroEstado === 'Stock' ? '#ffffff' : '#475569',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: filtroEstado === 'Stock' ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none'
              }}
              onMouseOver={e => {
                if (filtroEstado !== 'Stock') e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseOut={e => {
                if (filtroEstado !== 'Stock') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaCheckCircle size={13} />
              <span>Stock / Disponibles ({countStock})</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('Mantenimiento')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filtroEstado === 'Mantenimiento' ? '#f59e0b' : 'transparent',
                color: filtroEstado === 'Mantenimiento' ? '#ffffff' : '#475569',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: filtroEstado === 'Mantenimiento' ? '0 4px 10px rgba(245, 158, 11, 0.25)' : 'none'
              }}
              onMouseOver={e => {
                if (filtroEstado !== 'Mantenimiento') e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseOut={e => {
                if (filtroEstado !== 'Mantenimiento') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaTools size={13} />
              <span>En Mantenimiento ({countMantenimiento})</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('Baja')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filtroEstado === 'Baja' ? '#ef4444' : 'transparent',
                color: filtroEstado === 'Baja' ? '#ffffff' : '#475569',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: filtroEstado === 'Baja' ? '0 4px 10px rgba(239, 68, 68, 0.25)' : 'none'
              }}
              onMouseOver={e => {
                if (filtroEstado !== 'Baja') e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseOut={e => {
                if (filtroEstado !== 'Baja') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaExclamationTriangle size={13} />
              <span>Bajas / Dañados ({countBaja})</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filtroEstado === '' ? '#691B31' : 'transparent',
                color: filtroEstado === '' ? '#ffffff' : '#64748b',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: filtroEstado === '' ? '0 4px 10px rgba(105, 27, 49, 0.25)' : 'none'
              }}
              onMouseOver={e => {
                if (filtroEstado !== '') e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseOut={e => {
                if (filtroEstado !== '') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaBoxes size={13} />
              <span>Ver Todos ({countTotal})</span>
            </button>
          </div>
        );
      })()}

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
            const estadoItem = normalizarEstado(item.estadoFisico);
            const coincideEstado = !filtroEstado || estadoItem === filtroEstado;
            const coincideOrigen = !filtroOrigen || (
              filtroOrigen === 'reemplazadas'
                ? (item.nombre?.includes('Reemplazada') || item.nombre?.includes('Retirada') || item.numeroInventario?.includes('-RET'))
                : (!item.nombre?.includes('Reemplazada') && !item.nombre?.includes('Retirada') && !item.numeroInventario?.includes('-RET'))
            );
            const normalizar = str => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/s$/, '');
            const catFiltro = normalizar(filtroCategoria);
            const catItem = normalizar(item.categoria || item.tipo || 'componente');
            const coincideCategoria = !filtroCategoria || catItem.includes(catFiltro);
            return coincideTexto && coincideEstado && coincideOrigen && coincideCategoria;
          });

          if (itemsFiltrados.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '3.5rem', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                <FaBoxes size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#334155', fontWeight: '700' }}>No se encontraron artículos en este apartado</h3>
                <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem', color: '#64748b' }}>
                  {filtroEstado === 'Stock'
                    ? 'No hay piezas disponibles en Stock con los filtros aplicados.'
                    : filtroEstado === 'Mantenimiento'
                    ? 'No hay piezas en Mantenimiento / Revisión actualmente.'
                    : filtroEstado === 'Baja'
                    ? 'No hay piezas registradas en Bajas / Dañados.'
                    : 'No hay existencias que coincidan con la búsqueda.'}
                </p>
                {(filtroEstado || filtroOrigen || filtroCategoria || busqueda) && (
                  <button
                    onClick={() => {
                      setFiltroEstado('');
                      setFiltroOrigen('');
                      setFiltroCategoria('');
                      setBusqueda('');
                    }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              {(() => {
                // AGRUPAR itemsFiltrados por tipo base Y estadoFisico (todos los teclados juntos, mouses juntos, etc.)
                const gruposObj = {};
                itemsFiltrados.forEach(item => {
                  const estNorm = normalizarEstado(item.estadoFisico);
                  const baseInfo = obtenerGrupoBase(item);
                  const key = `${baseInfo.tipoKey}_${estNorm}`;

                  if (!gruposObj[key]) {
                    gruposObj[key] = {
                      key,
                      nombre: baseInfo.nombreBase,
                      categoria: baseInfo.categoria || item.categoria,
                      estadoFisico: estNorm,
                      cantidadTotal: 0,
                      items: [],
                      marcasModelosSet: new Set()
                    };
                  }
                  const cant = Number(item.cantidad) || 1;
                  gruposObj[key].items.push(item);
                  gruposObj[key].cantidadTotal += cant;

                  const mm = `${item.marca || ''} ${item.modelo || ''}`.trim() || item.nombre;
                  if (mm && mm !== baseInfo.nombreBase) {
                    gruposObj[key].marcasModelosSet.add(mm);
                  }
                });
                
                return Object.values(gruposObj).map(grupo => {
                  const isExpanded = !!expandedGroups[grupo.key];
                  const toggleExpand = () => setExpandedGroups(prev => ({...prev, [grupo.key]: !prev[grupo.key]}));
                  
                  const esStock = grupo.estadoFisico === 'Stock';
                  const esBaja = grupo.estadoFisico === 'Baja';
                  const colorStripe = esStock ? '#10b981' : esBaja ? '#ef4444' : '#f59e0b';
                  const colorQtyText = esStock ? '#047857' : esBaja ? '#b91c1c' : '#b45309';
                  const bgQtyPill = esStock ? '#ecfdf5' : esBaja ? '#fef2f2' : '#fffbeb';

                  const modelosDistintos = Array.from(grupo.marcasModelosSet);
                  const subtitulo = modelosDistintos.length === 1
                    ? modelosDistintos[0]
                    : modelosDistintos.length > 1
                    ? `${modelosDistintos.length} modelos (${modelosDistintos.slice(0, 2).join(', ')}${modelosDistintos.length > 2 ? '...' : ''})`
                    : '';

                  return (
                    <div
                      key={grupo.key}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                      }}
                    >
                      {/* Left accent bar correspondiente al estado */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: colorStripe }}></div>
                      
                      {/* Top Row: Category and State Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingLeft: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            color: '#475569',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backgroundColor: '#f1f5f9',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px'
                          }}>
                            {getCategoriaIcon(grupo.categoria)}
                            {getCategoriaLabel(grupo.categoria)}
                          </span>

                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: bgQtyPill,
                            color: colorQtyText
                          }}>
                            {esStock ? '🟢 Stock' : esBaja ? '🔴 Baja' : '🟡 Mantenimiento'}
                          </span>
                        </div>

                        {/* Top right toggle button */}
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            onClick={toggleExpand}
                            title={isExpanded ? "Ocultar piezas" : "Ver piezas"}
                            style={{
                              backgroundColor: '#e0f2fe',
                              border: 'none',
                              color: '#0284c7',
                              cursor: 'pointer',
                              padding: '0.4rem',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.2s',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>

                      {/* Middle: Title & Subtitle */}
                      <div style={{ paddingLeft: '0.5rem', flex: 1, minHeight: '55px' }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          margin: '0 0 0.25rem 0',
                          fontWeight: '800',
                          color: '#0f172a',
                          textTransform: 'capitalize'
                        }}>
                          {grupo.nombre}
                        </h3>
                        {subtitulo && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                            {subtitulo}
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Adjust Stock & Quantity */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        paddingLeft: '0.5rem',
                        marginTop: '1rem'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={toggleExpand}
                            style={{
                              padding: '0.35rem 0.75rem',
                              backgroundColor: '#f1f5f9',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#691B31',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          >
                            {isExpanded ? 'Ocultar' : 'Ver Piezas'}
                          </button>

                          <button 
                            onClick={() => {
                              if (grupo.items && grupo.items.length > 0) {
                                handleClonar(grupo.items[0]);
                              }
                            }}
                            title="Clonar / Agregar otra pieza igual"
                            style={{
                              padding: '0.35rem 0.75rem',
                              backgroundColor: '#e0f2fe',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#0284c7',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#bae6fd'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                          >
                            <FaPlus size={10} /> Agregar
                          </button>
                        </div>
                        
                        <span style={{
                          fontSize: '1.35rem',
                          fontWeight: '800',
                          color: colorQtyText,
                          backgroundColor: bgQtyPill,
                          padding: '0.2rem 0.8rem',
                          borderRadius: '8px',
                          minWidth: '2.5rem',
                          textAlign: 'center',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          {grupo.cantidadTotal}
                        </span>
                      </div>

                      {/* Expanded View with individual item cards */}
                      {isExpanded && (
                        <div style={{ 
                          marginTop: '1.5rem', 
                          paddingTop: '1rem', 
                          borderTop: '1px solid #e2e8f0',
                          paddingLeft: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {grupo.items.map((item, idx) => {
                              const nombreModeloItem = `${item.marca || ''} ${item.modelo || ''}`.trim() || item.nombre;
                              const mostrarNombreItem = nombreModeloItem && nombreModeloItem.toLowerCase() !== grupo.nombre.toLowerCase();

                              return (
                                <div key={item.id || idx} style={{
                                  backgroundColor: '#f8fafc', 
                                  border: '1px solid #e2e8f0', 
                                  borderRadius: '8px', 
                                  padding: '0.75rem',
                                  position: 'relative'
                                }}>
                                  {mostrarNombreItem && (
                                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                                      {nombreModeloItem}
                                    </div>
                                  )}

                                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    {item.numeroSerie && <span><strong style={{color:'#64748b'}}>S/N:</strong> {item.numeroSerie}</span>}
                                    {item.numeroInventario && <span><strong style={{color:'#64748b'}}>Inv:</strong> {item.numeroInventario}</span>}
                                    {item.cantidad > 1 && <span><strong style={{color:'#64748b'}}>Cantidad:</strong> {item.cantidad} uds.</span>}
                                  </div>

                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                    <span style={{
                                      backgroundColor: (item.estadoFisico === 'Stock' || item.estadoFisico === 'Buen Estado') ? '#ecfdf5' : (item.estadoFisico === 'Baja' || item.estadoFisico === 'Dañado') ? '#fef2f2' : '#fffbeb',
                                      color: (item.estadoFisico === 'Stock' || item.estadoFisico === 'Buen Estado') ? '#047857' : (item.estadoFisico === 'Baja' || item.estadoFisico === 'Dañado') ? '#b91c1c' : '#b45309',
                                      padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold'
                                    }}>
                                      {item.estadoFisico === 'Refacciones' || item.estadoFisico === 'reparacion' ? 'Mantenimiento' : item.estadoFisico}
                                    </span>

                                    {(item.areaUbicacion || item.equipoOriginal?.responsable || item.equipoOriginal?.area) && (
                                      <span style={{ fontSize: '0.7rem', color: '#475569', backgroundColor: '#e2e8f0', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                        {item.equipoOriginal?.responsable || item.equipoOriginal?.area || item.areaUbicacion}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => handleClonarIndividual(item)}
                                    title="Clonar / Agregar otra pieza igual"
                                    style={{
                                      position: 'absolute',
                                      top: '0.5rem',
                                      right: '2.3rem',
                                      backgroundColor: '#e0f2fe',
                                      border: 'none',
                                      color: '#0284c7',
                                      cursor: 'pointer',
                                      padding: '0.35rem',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#bae6fd'}
                                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                                  >
                                    <FaPlus size={12} />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleEditar(item)}
                                    title="Editar pieza"
                                    style={{
                                      position: 'absolute',
                                      top: '0.5rem',
                                      right: '0.5rem',
                                      backgroundColor: '#fef3c7',
                                      border: 'none',
                                      color: '#d97706',
                                      cursor: 'pointer',
                                      padding: '0.35rem',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          );
        })()
      )}

      {/* FORM MODAL */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', minHeight: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
            <button type="button" onClick={() => setModalAbierto(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748b', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
              <FaTimes size={16} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.75rem' }}>
              {editandoId ? 'Actualizar Equipo / Stock' : 'Registrar Nuevo Equipo / Stock'}
            </h2>

            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>Tipo de Equipo *</label>
                <CustomEquipmentSelect
                  value={form.tipo}
                  onChange={(nuevoTipo) => {
                    setForm(prev => ({ ...prev, tipo: nuevoTipo, detalles: {} }));
                  }}
                  opciones={TIPOS_EQUIPO}
                  gruposOpciones={gruposOpciones}
                />
                {form.tipo === 'otro' && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <label style={labelStyle}>Especificar Tipo / Nombre de Equipo *</label>
                    <input
                      type="text"
                      value={form.detalles?.nombre || ''}
                      onChange={e => setForm({ ...form, detalles: { ...form.detalles, nombre: e.target.value } })}
                      style={inputStyle}
                      placeholder="Ej. Servidor NAS, Consola, Pantalla Interactiva, etc."
                      required
                    />
                  </div>
                )}
              </div>

              {form.tipo ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setMostrarDetallesForm(!mostrarDetallesForm)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: mostrarDetallesForm ? '#fef2f2' : '#f0fdf4',
                        color: mostrarDetallesForm ? '#ef4444' : '#16a34a',
                        border: '1px solid',
                        borderColor: mostrarDetallesForm ? '#fca5a5' : '#86efac',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {mostrarDetallesForm ? 'Ocultar Detalles' : 'Mostrar Detalles Avanzados'}
                    </button>
                  </div>
                  <div className="inventario-grid-2col">
                    {/* Campos Base */}
                    {mostrarDetallesForm && (
                      <>
                        <div>
                          <label style={labelStyle}>Marca</label>
                          <input type="text" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} style={inputStyle} list="marcas-list" />
                          <datalist id="marcas-list">
                            {marcasUnicas.filter(m => m.toLowerCase().includes(form.marca?.toLowerCase() || '')).slice(0, 5).map(m => <option key={m} value={m} />)}
                          </datalist>
                        </div>
                        <div>
                          <label style={labelStyle}>Modelo</label>
                          <input type="text" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} style={inputStyle} list="modelos-list" />
                          <datalist id="modelos-list">
                            {modelosUnicos.filter(m => m.toLowerCase().includes(form.modelo?.toLowerCase() || '')).slice(0, 5).map(m => <option key={m} value={m} />)}
                          </datalist>
                        </div>
                      </>
                    )}

                    {!sinInventario && (
                      <div>
                        <label style={labelStyle}>No. Inventario {form.tipo === 'router' ? '*' : ''}</label>
                        <input type="text" value={form.numeroInventario} onChange={e => setForm({ ...form, numeroInventario: e.target.value })} style={inputStyle} required={form.tipo === 'router'} list="inventarios-list" />
                        <datalist id="inventarios-list">
                          {inventariosUnicos.filter(i => i.toLowerCase().includes(form.numeroInventario?.toLowerCase() || '')).slice(0, 5).map(i => <option key={i} value={i} />)}
                        </datalist>
                      </div>
                    )}
                    <div>
                      <label style={labelStyle}>No. Serie</label>
                      <input type="text" value={form.numeroSerie} onChange={e => setForm({ ...form, numeroSerie: e.target.value })} style={inputStyle} list="series-list" />
                      <datalist id="series-list">
                        {seriesUnicas.filter(s => s.toLowerCase().includes(form.numeroSerie?.toLowerCase() || '')).slice(0, 5).map(s => <option key={s} value={s} />)}
                      </datalist>
                    </div>

                    {(!esClonIndividual || mostrarDetallesForm) && (
                      <>
                        <div>
                          <label style={labelStyle}>Área *</label>
                          <select
                            value={form.direccion}
                            onChange={e => setForm({ ...form, direccion: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer', backgroundColor: esClonIndividual ? '#f1f5f9' : 'white' }}
                            disabled={esClonIndividual && !mostrarDetallesForm}
                            required
                          >
                            <option value="">-- Seleccionar Área --</option>
                            {areasList.map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>Ubicación *</label>
                          <select
                            value={form.areaUbicacion}
                            onChange={e => setForm({ ...form, areaUbicacion: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer', backgroundColor: esClonIndividual ? '#f1f5f9' : 'white' }}
                            disabled={esClonIndividual && !mostrarDetallesForm}
                            required
                          >
                            <option value="">-- Seleccionar Ubicación --</option>
                            {(form.tipo === 'camara' ? estacionesList.map(e => typeof e === 'string' ? e : e.nombre) : sedesList).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>Procedencia</label>
                          <select
                            value={form.procedencia}
                            onChange={e => setForm({ ...form, procedencia: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer', backgroundColor: esClonIndividual ? '#f1f5f9' : 'white' }}
                            disabled={esClonIndividual && !mostrarDetallesForm}
                          >
                            <option value="">-- Seleccionar Procedencia --</option>
                            <option value="Gobierno del Estado">Gobierno del Estado</option>
                            <option value="Donacion">Donación</option>
                            <option value="Fideicomiso">Fideicomiso</option>
                            <option value="Recurso Propio">Recurso Propio</option>
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>Estatus</label>
                          <select
                            value={form.estatus}
                            onChange={e => setForm({ ...form, estatus: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer', backgroundColor: esClonIndividual ? '#f1f5f9' : 'white' }}
                            disabled={esClonIndividual && !mostrarDetallesForm}
                          >
                            <option value="Activo">Activo</option>
                            <option value="Stock">Stock</option>
                            <option value="Refacciones">Refacciones</option>
                            <option value="Baja">Baja</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                          </select>
                        </div>
                      </>
                    )}

                    {form.estatus === 'Refacciones' && (
                      <div>
                        <label style={labelStyle}>Motivo de baja</label>
                        <select
                          value={form.detalles?.motivoBaja || ''}
                          onChange={e => setForm({ ...form, detalles: { ...form.detalles, motivoBaja: e.target.value } })}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          <option value="">-- Seleccionar motivo --</option>
                          <option value="Robo">Robo</option>
                          <option value="Siniestro">Siniestro</option>
                          <option value="Vandalismo">Vandalismo</option>
                        </select>
                      </div>
                    )}

                    {form.estatus === 'Refacciones' && ['Siniestro', 'Robo', 'Vandalismo'].includes(form.detalles?.motivoBaja) && (
                      <>
                        {['Robo', 'Vandalismo'].includes(form.detalles?.motivoBaja) && (
                          <div>
                            <label style={labelStyle}>¿Carpeta de investigación?</label>
                            <select
                              value={form.detalles?.carpetaInvestigacion || ''}
                              onChange={e => setForm({ ...form, detalles: { ...form.detalles, carpetaInvestigacion: e.target.value } })}
                              style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                              <option value="">-- Seleccionar --</option>
                              <option value="Si">Sí</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        )}
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={labelStyle}>Observaciones</label>
                          <textarea
                            value={form.detalles?.observacionesBaja || ''}
                            onChange={e => setForm({ ...form, detalles: { ...form.detalles, observacionesBaja: e.target.value } })}
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                            placeholder={form.detalles?.motivoBaja === 'Siniestro' ? 'Especifica los detalles del siniestro aquí...' : 'Escribe las observaciones aquí...'}
                          />
                        </div>
                      </>
                    )}

                    {(!esClonIndividual || mostrarDetallesForm) && (
                      <>
                        {/* Campos Responsable (Para todos los equipos) */}
                        <div>
                          <label style={labelStyle}>Responsable del equipo</label>
                          <input type="text" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} style={{ ...inputStyle, backgroundColor: esClonIndividual ? '#f1f5f9' : 'white' }} disabled={esClonIndividual && !mostrarDetallesForm} />
                        </div>
                        <div>
                          <label style={labelStyle}>Cargo del responsable</label>
                          <select
                            value={form.cargoResponsable}
                            onChange={e => setForm({ ...form, cargoResponsable: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer', backgroundColor: esClonIndividual ? '#f1f5f9' : 'white' }}
                            disabled={esClonIndividual && !mostrarDetallesForm}
                          >
                            <option value="">-- Seleccionar Cargo --</option>
                            {cargosList.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {mostrarDetallesForm && (
                    <div style={{ padding: '1.75rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', marginBottom: '1.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Especificaciones Técnicas</h3>

                    <div className="inventario-grid-spec">
                      {tieneMAC && (
                        <div><label style={labelStyle}>Dirección MAC</label><input type="text" value={form.detalles.mac || ''} onChange={e => handleDetalleChange('mac', e.target.value)} style={inputStyle} placeholder="00:00:00:00:00:00" /></div>
                      )}
                      {tieneIP && (
                        <div><label style={labelStyle}>IP Predeterminada</label><input type="text" value={form.detalles.ipPredeterminada || ''} onChange={e => handleDetalleChange('ipPredeterminada', e.target.value)} style={inputStyle} placeholder="192.168.1.1" /></div>
                      )}

                      {tienePuertosRed && (
                        <>
                          {['switch', 'firewall', 'router'].includes(form.tipo) && <div><label style={labelStyle}>Puertos WAN</label><input type="number" value={form.detalles.puertosWan || ''} onChange={e => handleDetalleChange('puertosWan', e.target.value)} style={inputStyle} /></div>}
                          <div><label style={labelStyle}>Puertos LAN</label><input type="number" value={form.detalles.puertosLan || ''} onChange={e => handleDetalleChange('puertosLan', e.target.value)} style={inputStyle} /></div>
                          {['switch', 'firewall', 'router'].includes(form.tipo) && (
                            <>
                              <div><label style={labelStyle}>Puertos USB</label><input type="number" value={form.detalles.puertosUsb || ''} onChange={e => handleDetalleChange('puertosUsb', e.target.value)} style={inputStyle} /></div>
                              <div><label style={labelStyle}>Puertos Consola</label><input type="number" value={form.detalles.puertosConsola || ''} onChange={e => handleDetalleChange('puertosConsola', e.target.value)} style={inputStyle} /></div>
                            </>
                          )}
                        </>
                      )}

                      {tieneAlmacenamiento && (
                        <>
                          <CustomSpecSelect
                            label="Almacenamiento (Capacidad)"
                            value={form.detalles.almacenamiento || ''}
                            options={['64GB', '128GB', '256GB', '512GB', '1TB', '2TB']}
                            onChange={val => handleDetalleChange('almacenamiento', val)}
                            placeholder="Ej: 500GB SSD"
                          />
                          <CustomSpecSelect
                            label="Memoria RAM"
                            value={form.detalles.ram || ''}
                            options={['4GB', '8GB', '16GB', '32GB', '64GB']}
                            onChange={val => handleDetalleChange('ram', val)}
                            placeholder="Ej: 12GB DDR4"
                          />
                          {['escritorio', 'laptop'].includes(form.tipo) && (
                            <CustomSpecSelect
                              label="Tipo de Almacenamiento"
                              value={form.detalles.tipoAlmacenamiento || ''}
                              options={['SSD', 'HDD', 'M.2 NVMe', 'M.2 SATA']}
                              onChange={val => handleDetalleChange('tipoAlmacenamiento', val)}
                              placeholder="Ej: SSD + HDD"
                            />
                          )}
                        </>
                      )}

                      {tieneProcesador && (
                        <div>
                          <label style={labelStyle}>Procesador</label>
                          <input 
                            type="text" 
                            value={form.detalles.procesador || ''} 
                            onChange={e => handleDetalleChange('procesador', e.target.value)} 
                            style={inputStyle} 
                            placeholder="Ej: Intel Core i7-13620H" 
                            list="procesadores-list"
                          />
                          <datalist id="procesadores-list">
                            {procesadoresUnicos.filter(p => p.toLowerCase().includes(form.detalles?.procesador?.toLowerCase() || '')).slice(0, 5).map(p => <option key={p} value={p} />)}
                          </datalist>
                        </div>
                      )}

                      {['escritorio', 'laptop', 'celular', 'tableta'].includes(form.tipo) && (
                        <CustomSpecSelect
                          label="Sistema Operativo"
                          value={form.detalles.sistemaOperativo || ''}
                          options={['Windows 10 Pro', 'Windows 11 Pro', 'Linux Ubuntu', 'Linux Debian', 'macOS', 'Android', 'iOS']}
                          onChange={val => handleDetalleChange('sistemaOperativo', val)}
                          placeholder="Ej: Windows Server 2022"
                        />
                      )}

                      {['escritorio', 'laptop'].includes(form.tipo) && (
                        <>
                          <div>
                            <label style={labelStyle}>Tarjeta Gráfica</label>
                            <input 
                              type="text" 
                              value={form.detalles.tarjetaGrafica || ''} 
                              onChange={e => handleDetalleChange('tarjetaGrafica', e.target.value)} 
                              style={inputStyle} 
                              placeholder="Ej: NVIDIA GeForce RTX 4060" 
                              list="graficas-list"
                            />
                            <datalist id="graficas-list">
                              {graficasUnicas.filter(g => g.toLowerCase().includes(form.detalles?.tarjetaGrafica?.toLowerCase() || '')).slice(0, 5).map(g => <option key={g} value={g} />)}
                            </datalist>
                          </div>
                          <div><label style={labelStyle}>Conectividad de Red</label>
                            <select value={form.detalles.red || ''} onChange={e => handleDetalleChange('red', e.target.value)} style={inputStyle}>
                              <option value="">-- Seleccionar --</option>
                              <option value="wifi">Solo Wi-Fi</option>
                              <option value="ethernet">Solo Ethernet</option>
                              <option value="ambos">Ambos</option>
                            </select>
                          </div>
                        </>
                      )}

                      {['camara', 'dvr'].includes(form.tipo) && (
                        <CustomSpecSelect
                          label="Megapíxeles (MP)"
                          value={form.detalles.megapixeles || ''}
                          options={['2MP', '4MP', '5MP', '8MP (4K)']}
                          onChange={val => handleDetalleChange('megapixeles', val)}
                          placeholder="Ej: 3MP"
                        />
                      )}



                      {form.tipo === 'dvr' && (
                        <CustomSpecSelect
                          label="Tipo (Análogo, IP)"
                          value={form.detalles.tipoDvr || ''}
                          options={['Análogo', 'IP', 'Híbrido']}
                          onChange={val => handleDetalleChange('tipoDvr', val)}
                          placeholder="Ej: NVR IP"
                        />
                      )}

                      {form.tipo === 'impresora' && (
                        <>
                          <CustomSpecSelect
                            label="Tipo (Monocromática o Color)"
                            value={form.detalles.tipoColor || ''}
                            options={['Monocromática', 'Color']}
                            onChange={val => handleDetalleChange('tipoColor', val)}
                            placeholder="Ej: Monocromática Láser"
                          />
                          <CustomSpecSelect
                            label="Propiedad (Rentada / SITMAH)"
                            value={form.detalles.propiedad || ''}
                            options={['Rentada', 'SITMAH']}
                            onChange={val => handleDetalleChange('propiedad', val)}
                            placeholder="Ej: En comodato"
                          />
                        </>
                      )}

                      {form.tipo === 'pantalla' && (
                        <CustomSpecSelect
                          label="Pulgadas"
                          value={form.detalles.pulgadas || ''}
                          options={['24"', '27"', '32"', '43"', '55"', '65"', '75"']}
                          onChange={val => handleDetalleChange('pulgadas', val)}
                          placeholder='Ej: 21.5"'
                        />
                      )}

                      {form.tipo === 'videowall' && (
                        <div><label style={labelStyle}>Pantallas Asignadas</label><input type="text" value={form.detalles.pantallasAsignadas || ''} onChange={e => handleDetalleChange('pantallasAsignadas', e.target.value)} style={inputStyle} /></div>
                      )}

                      {['internet', 'telefono'].includes(form.tipo) && (
                        <>
                          <CustomSpecSelect
                            label="Compañía Proveedora"
                            value={form.detalles.compania || ''}
                            options={['Telmex', 'Totalplay', 'Izzi', 'Megacable']}
                            onChange={val => handleDetalleChange('compania', val)}
                            placeholder="Ej: Telcel"
                          />
                          <div><label style={labelStyle}>Número de Teléfono</label><input type="text" value={form.detalles.numeroTelefono || ''} onChange={e => handleDetalleChange('numeroTelefono', e.target.value)} style={inputStyle} /></div>
                        </>
                      )}

                      {form.tipo === 'internet' && (
                        <>
                          <div><label style={labelStyle}>Módem Asignado</label><input type="text" value={form.detalles.modem || ''} onChange={e => handleDetalleChange('modem', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>IP Fija</label><input type="text" value={form.detalles.ipFija || ''} onChange={e => handleDetalleChange('ipFija', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Megas de Velocidad</label><input type="text" value={form.detalles.megas || ''} onChange={e => handleDetalleChange('megas', e.target.value)} style={inputStyle} /></div>
                        </>
                      )}

                      {form.tipo === 'aire' && (
                        <div><label style={labelStyle}>Tonelaje</label><input type="text" value={form.detalles.tonelaje || ''} onChange={e => handleDetalleChange('tonelaje', e.target.value)} style={inputStyle} /></div>
                      )}

                      {form.tipo === 'ram' && (
                        <>
                          <div>
                            <label style={labelStyle}>Para equipo</label>
                            <input type="text" value={form.detalles.paraEquipo || ''} onChange={e => handleDetalleChange('paraEquipo', e.target.value)} style={inputStyle} list="para-equipo-list" placeholder="Ej: Escritorio, Laptop, Mac..." />
                            <datalist id="para-equipo-list">
                              <option value="Escritorio" />
                              <option value="Laptop" />
                              <option value="Mac" />
                            </datalist>
                          </div>
                          <div>
                            <label style={labelStyle}>Tipo de Memoria</label>
                            <input type="text" value={form.detalles.tipoDDR || ''} onChange={e => handleDetalleChange('tipoDDR', e.target.value)} style={inputStyle} list="tipo-ddr-list" placeholder="Ej: DDR4, DDR5..." />
                            <datalist id="tipo-ddr-list">
                              <option value="DDR3" />
                              <option value="DDR4" />
                              <option value="DDR5" />
                            </datalist>
                          </div>
                          <div>
                            <label style={labelStyle}>Capacidad</label>
                            <input type="text" value={form.detalles.capacidad || ''} onChange={e => handleDetalleChange('capacidad', e.target.value)} style={inputStyle} list="capacidad-ram-list" placeholder="Ej: 8 GB, 16 GB..." />
                            <datalist id="capacidad-ram-list">
                              <option value="1 GB" />
                              <option value="2 GB" />
                              <option value="4 GB" />
                              <option value="8 GB" />
                              <option value="16 GB" />
                              <option value="32 GB" />
                            </datalist>
                          </div>
                        </>
                      )}

                      {form.tipo === 'almacenamiento' && (
                        <>
                          <div>
                            <label style={labelStyle}>Tipo de Almacenamiento</label>
                            <input type="text" value={form.detalles.tipoDisco || ''} onChange={e => handleDetalleChange('tipoDisco', e.target.value)} style={inputStyle} list="tipo-disco-list" placeholder="Ej: SSD, HDD, M.2..." />
                            <datalist id="tipo-disco-list">
                              <option value="SSD" />
                              <option value="HDD" />
                              <option value="M.2" />
                              <option value="NVMe" />
                            </datalist>
                          </div>
                          <div>
                            <label style={labelStyle}>Para equipo</label>
                            <input type="text" value={form.detalles.paraEquipo || ''} onChange={e => handleDetalleChange('paraEquipo', e.target.value)} style={inputStyle} list="para-equipo-list" placeholder="Ej: Escritorio, Laptop, Mac..." />
                          </div>
                          <div>
                            <label style={labelStyle}>Capacidad</label>
                            <input type="text" value={form.detalles.capacidad || ''} onChange={e => handleDetalleChange('capacidad', e.target.value)} style={inputStyle} list="capacidad-almacenamiento-list" placeholder="Ej: 500 GB, 1 TB..." />
                            <datalist id="capacidad-almacenamiento-list">
                              <option value="256 GB" />
                              <option value="512 GB" />
                              <option value="1 TB" />
                              <option value="2 TB" />
                            </datalist>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input type="checkbox" checked={form.detalles.esExterno || false} onChange={e => handleDetalleChange('esExterno', e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', accentColor: '#0f766e' }} />
                              <span style={{ fontWeight: '500', color: '#334155' }}>¿Es un disco externo?</span>
                            </label>
                          </div>
                        </>
                      )}

                      {['otro', 'antena_wifi', 'monitor', 'cabezal'].includes(form.tipo) && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={labelStyle}>Detalles / Descripción Adicional</label>
                          <textarea
                            value={form.detalles.descripcionOtro || ''}
                            onChange={e => handleDetalleChange('descripcionOtro', e.target.value)}
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                            placeholder="Escribe detalles o características adicionales..."
                          />
                        </div>
                      )}

                    </div>
                  </div>
                  )}



                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#cbd5e1', padding: '2rem', textAlign: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <FaDesktop size={64} style={{ opacity: 0.4 }} />
                  <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#94a3b8' }}>Seleccione un tipo de equipo para continuar</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto', paddingTop: '2rem' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '0.75rem 2rem', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#cbd5e1'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}>Cancelar</button>
                <button type="submit" disabled={!form.tipo} style={{ padding: '0.75rem 2.5rem', border: 'none', backgroundColor: form.tipo ? '#691B31' : '#cbd5e1', color: 'white', borderRadius: '8px', cursor: form.tipo ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '1rem', boxShadow: form.tipo ? '0 4px 6px rgba(105,27,49,0.2)' : 'none', transition: 'background-color 0.2s' }} onMouseOver={e => { if (form.tipo) e.currentTarget.style.backgroundColor = '#8a2441' }} onMouseOut={e => { if (form.tipo) e.currentTarget.style.backgroundColor = '#691B31' }}>Guardar Equipo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}






const TIPOS_EQUIPO = [
  { value: 'escritorio', label: 'Escritorio', icon: FaDesktop, group: 'Computadoras' },
  { value: 'laptop', label: 'Laptop', icon: FaLaptop, group: 'Computadoras' },
  { value: 'tableta', label: 'Tableta', icon: FaTabletAlt, group: 'Computadoras' },
  { value: 'servidor', label: 'Servidor', icon: FaServer, group: 'Computadoras' },
  { value: 'teclado', label: 'Teclado', icon: FaCogs, group: 'Periféricos y Accesorios' },
  { value: 'mouse', label: 'Mouse', icon: FaCogs, group: 'Periféricos y Accesorios' },
  { value: 'router', label: 'Router', icon: FaNetworkWired, group: 'Redes y Conectividad' },
  { value: 'switch', label: 'Switch', icon: FaNetworkWired, group: 'Redes y Conectividad' },
  { value: 'firewall', label: 'Firewall', icon: FaShieldAlt, group: 'Redes y Conectividad' },
  { value: 'access_point', label: 'Access Point', icon: FaWifi, group: 'Redes y Conectividad' },
  { value: 'antena', label: 'Antena Microonda', icon: FaBroadcastTower, group: 'Redes y Conectividad' },
  { value: 'internet', label: 'Internet / Módem', icon: FaGlobe, group: 'Redes y Conectividad' },
  { value: 'camara', label: 'Cámara de Videovigilancia', icon: FaVideo, group: 'Videovigilancia' },
  { value: 'dvr', label: 'DVRs', icon: FaHdd, group: 'Videovigilancia' },
  { value: 'impresora', label: 'Impresora', icon: FaPrint, group: 'Impresión y Escaneo' },
  { value: 'plotter', label: 'Plotter', icon: FaPrint, group: 'Impresión y Escaneo' },
  { value: 'pantalla', label: 'Pantallas', icon: FaTv, group: 'Visualización' },
  { value: 'monitor', label: 'Monitor', icon: FaDesktop, group: 'Visualización' },
  { value: 'videowall', label: 'Controlador de Videowall', icon: FaThLarge, group: 'Visualización' },
  { value: 'celular', label: 'Celular', icon: FaMobileAlt, group: 'Comunicación' },
  { value: 'telefono', label: 'Teléfono', icon: FaPhone, group: 'Comunicación' },
  { value: 'radio', label: 'Radio', icon: FaMicrophone, group: 'Comunicación' },
  { value: 'aire', label: 'Aire Acondicionado', icon: FaFan, group: 'Infraestructura' },
  { value: 'no_break', label: 'No Break (UPS)', icon: FaPlug, group: 'Infraestructura' },
  { value: 'regulador', label: 'Regulador', icon: FaPlug, group: 'Infraestructura' },
  { value: 'lectora_tags', label: 'Lectora de Tags', icon: FaBroadcastTower, group: 'Peaje y Control' },
  { value: 'controladora', label: 'Controladora', icon: FaShieldAlt, group: 'Peaje y Control' },
  { value: 'ram', label: 'Memoria RAM', icon: FaMemory, group: 'Componentes' },
  { value: 'almacenamiento', label: 'Disco Duro / SSD', icon: FaHdd, group: 'Componentes' },
  { value: 'antena_wifi', label: 'Antena WiFi', icon: FaWifi, group: 'Componentes' },
  { value: 'cabezal', label: 'Cabezal de Impresión', icon: FaPrint, group: 'Componentes' },
  { value: 'otro', label: 'Otro', icon: FaBoxes, group: 'Otros' },
];



const CustomEquipmentSelect = ({ value, onChange, opciones, gruposOpciones }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const selectedOption = opciones.find(o => o.value === value);

  const filteredOptions = opciones.filter(o =>
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
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '600' }}>
              <selectedOption.icon color="#691B31" size={18} /> {selectedOption.label}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>-- Seleccionar el tipo de equipo --</span>
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
                placeholder="Buscar equipo (ej. Servidor, DVR...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="dropdown-select-container">
              {search ? (
                // Search Results
                <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
                  {filteredOptions.length > 0 ? filteredOptions.map(opcion => (
                    <div
                      key={opcion.value}
                      onClick={() => { onChange(opcion.value); setIsOpen(false); setSearch(''); }}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <opcion.icon color="#691B31" size={18} />
                      <span style={{ fontWeight: '500', color: '#334155' }}>{opcion.label}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>{opcion.group}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span>No se encontraron equipos para "{search}"</span>
                    </div>
                  )}
                </div>
              ) : (
                // Category Hover View
                <>
                  <div className="dropdown-left-pane">
                    {Object.keys(gruposOpciones).map((group) => (
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
                  </div>
                  <div className="dropdown-right-pane">
                    {hoveredCategory ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Equipos en {hoveredCategory}
                        </div>
                        {gruposOpciones[hoveredCategory].map(opcion => (
                          <div
                            key={opcion.value}
                            onClick={() => { onChange(opcion.value); setIsOpen(false); }}
                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', transition: 'background-color 0.15s, color 0.15s' }}
                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                          >
                            <opcion.icon color="#64748b" size={16} /> <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opcion.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <FaLaptop size={32} color="#cbd5e1" />
                        Pasa el cursor sobre una categoría a la izquierda para ver los equipos disponibles
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

const CustomSpecSelect = ({ label, value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [esOtro, setEsOtro] = useState(false);
  const [customVal, setCustomVal] = useState('');

  useEffect(() => {
    if (value) {
      // Solo regresar al modo de selección si coinciden las opciones y no estábamos ya escribiendo otra cosa
      if (options.includes(value) && !esOtro) {
        setEsOtro(false);
        setCustomVal('');
      } else if (!options.includes(value)) {
        setEsOtro(true);
        setCustomVal(value);
      }
    } else {
      if (!esOtro) {
        setCustomVal('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);

  const handleSelectOption = (opt) => {
    setEsOtro(false);
    setIsOpen(false);
    onChange(opt);
  };

  const handleSelectOtro = () => {
    setEsOtro(true);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCustomVal(val);
    onChange(val);
  };

  const displayVal = esOtro ? `Otro: ${value || '(Escriba abajo)'}` : (value || '-- Seleccionar --');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <label style={labelStyle}>{label}</label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff',
          fontWeight: value ? '600' : 'normal',
          color: value ? '#1e293b' : '#94a3b8',
          marginBottom: esOtro ? '0.5rem' : '0'
        }}
      >
        <span>{displayVal}</span>
        <FaChevronRight size={12} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', color: '#64748b' }} />
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            zIndex: 100,
            border: '1px solid #e2e8f0',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => handleSelectOption(opt)}
                style={{
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: value === opt ? '#691B31' : '#475569',
                  backgroundColor: value === opt ? '#fdf2f8' : 'transparent',
                  fontWeight: value === opt ? '600' : 'normal',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = value === opt ? '#fdf2f8' : 'transparent'}
              >
                {opt}
              </div>
            ))}

            <div
              onClick={handleSelectOtro}
              style={{
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: esOtro ? '#691B31' : '#475569',
                backgroundColor: esOtro ? '#fdf2f8' : 'transparent',
                fontWeight: esOtro ? '600' : 'normal',
                borderTop: '1px dashed #cbd5e1',
                transition: 'background-color 0.15s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = esOtro ? '#fdf2f8' : 'transparent'}
            >
              Otro (Especificar)
            </div>
          </div>
        </>
      )}

      {esOtro && (
        <input
          type="text"
          value={customVal}
          onChange={handleInputChange}
          placeholder={placeholder || `Escriba ${label.toLowerCase()}`}
          style={inputStyle}
          required
        />
      )}
    </div>
  );
};
