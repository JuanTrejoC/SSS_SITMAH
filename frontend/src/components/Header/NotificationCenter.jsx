import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { 
  FaBell, 
  FaLaptop, 
  FaTrafficLight, 
  FaCheckDouble, 
  FaClock, 
  FaCircle, 
  FaExternalLinkAlt,
  FaSpinner
} from 'react-icons/fa';
import './NotificationCenter.css';

const STORAGE_KEY = 'sitmah_read_notifications';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays}d`;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [resumen, setResumen] = useState({ totalPendientes: 0, pendientesOficina: 0, pendientesSemaforo: 0 });
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'oficina' | 'semaforo'
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Guardar IDs leídos en localStorage
  const marcarComoLeido = (id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(-200)));
      } catch (e) {
        console.error('Error al guardar notificaciones leídas:', e);
      }
      return updated;
    });
  };

  const marcarTodasComoLeidas = (e) => {
    e?.stopPropagation();
    const todosLosIds = notificaciones.map((n) => n.id);
    const combinados = Array.from(new Set([...readIds, ...todosLosIds]));
    setReadIds(combinados);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combinados.slice(-200)));
    } catch (e) {
      console.error('Error al guardar notificaciones leídas:', e);
    }
  };

  // Cargar notificaciones del servidor
  const cargarNotificaciones = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/notificaciones`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setNotificaciones(json.data.notificaciones || []);
        if (json.data.resumen) {
          setResumen(json.data.resumen);
        }
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  // Carga inicial y sondeo periódico cada 25 segundos
  useEffect(() => {
    if (!user?.token) return;
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 25000);
    return () => clearInterval(interval);
  }, [user?.token]);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notificaciones filtradas según la pestaña activa
  const notificacionesFiltradas = useMemo(() => {
    if (activeTab === 'oficina') {
      return notificaciones.filter((n) => n.tipo === 'oficina');
    }
    if (activeTab === 'semaforo') {
      return notificaciones.filter((n) => n.tipo === 'semaforo');
    }
    return notificaciones;
  }, [notificaciones, activeTab]);

  // Conteo de no leídas
  const sinLeerCount = useMemo(() => {
    return notificaciones.filter((n) => !readIds.includes(n.id)).length;
  }, [notificaciones, readIds]);

  const sinLeerOficinas = useMemo(() => {
    return notificaciones.filter((n) => n.tipo === 'oficina' && !readIds.includes(n.id)).length;
  }, [notificaciones, readIds]);

  const sinLeerSemaforos = useMemo(() => {
    return notificaciones.filter((n) => n.tipo === 'semaforo' && !readIds.includes(n.id)).length;
  }, [notificaciones, readIds]);

  // Manejar clic en una notificación
  const handleNotifClick = (notif) => {
    marcarComoLeido(notif.id);
    setIsOpen(false);
    navigate(notif.ruta);
  };

  if (!user) return null;

  return (
    <div className="notification-center" ref={dropdownRef}>
      {/* Botón activador con campana e indicador de no leídos */}
      <button
        type="button"
        className={`notification-bell-btn ${isOpen ? 'notification-bell-btn--active' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) cargarNotificaciones();
        }}
        title="Centro de Notificaciones"
        aria-label="Centro de Notificaciones"
      >
        <FaBell className="notification-bell-icon" />
        {sinLeerCount > 0 && (
          <span className="notification-badge">
            {sinLeerCount > 9 ? '9+' : sinLeerCount}
          </span>
        )}
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Cabecera */}
          <div className="notification-header">
            <div className="notification-title-wrap">
              <FaBell className="notification-header-icon" />
              <h4 className="notification-title">Notificaciones</h4>
              {sinLeerCount > 0 && (
                <span className="notification-unread-pill">{sinLeerCount} nuevas</span>
              )}
            </div>
            {sinLeerCount > 0 && (
              <button
                type="button"
                className="notification-mark-all-btn"
                onClick={marcarTodasComoLeidas}
                title="Marcar todas como leídas"
              >
                <FaCheckDouble size={12} />
                <span>Leídas</span>
              </button>
            )}
          </div>

          {/* Pestañas de filtrado */}
          <div className="notification-tabs">
            <button
              type="button"
              className={`notification-tab ${activeTab === 'todos' ? 'notification-tab--active' : ''}`}
              onClick={() => setActiveTab('todos')}
            >
              <span>Todos</span>
              <span className="notification-tab-count">{notificaciones.length}</span>
            </button>
            <button
              type="button"
              className={`notification-tab ${activeTab === 'oficina' ? 'notification-tab--active' : ''}`}
              onClick={() => setActiveTab('oficina')}
            >
              <FaLaptop size={12} />
              <span>Tecnológicos</span>
              {sinLeerOficinas > 0 && (
                <span className="notification-tab-count">{sinLeerOficinas}</span>
              )}
            </button>
            <button
              type="button"
              className={`notification-tab ${activeTab === 'semaforo' ? 'notification-tab--active' : ''}`}
              onClick={() => setActiveTab('semaforo')}
            >
              <FaTrafficLight size={12} />
              <span>Semafóricos</span>
              {sinLeerSemaforos > 0 && (
                <span className="notification-tab-count">{sinLeerSemaforos}</span>
              )}
            </button>
          </div>

          {/* Lista de notificaciones */}
          <div className="notification-list">
            {notificacionesFiltradas.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <FaBell />
                </div>
                <p className="notification-empty-text">No hay notificaciones recientes</p>
                <p className="notification-empty-subtext">
                  Los nuevos reportes aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              notificacionesFiltradas.map((notif) => {
                const esNoLeido = !readIds.includes(notif.id);
                const esOficina = notif.tipo === 'oficina';

                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${esNoLeido ? 'notification-item--unread' : ''}`}
                    onClick={() => handleNotifClick(notif)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNotifClick(notif)}
                  >
                    {/* Icono temático del reporte */}
                    <div
                      className={`notification-type-badge ${
                        esOficina ? 'notification-type-badge--oficina' : 'notification-type-badge--semaforo'
                      }`}
                      title={notif.tipoLabel}
                    >
                      {esOficina ? <FaLaptop /> : <FaTrafficLight />}
                    </div>

                    {/* Contenido principal */}
                    <div className="notification-content">
                      <div className="notification-row-top">
                        <span className="notification-folio">{notif.folio}</span>
                        <span className="notification-time">
                          <FaClock size={10} />
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <div className="notification-solicitante">
                        {notif.solicitante} • <span style={{ color: '#64748B', fontWeight: '400' }}>{notif.ubicacion}</span>
                      </div>

                      <div className="notification-detalle">
                        {notif.detalle}
                      </div>

                      <div className="notification-tags">
                        <span className={`notification-tag notification-tag--${notif.estado}`}>
                          {notif.estado === 'abierto' ? 'Pendiente' : notif.estado === 'en_proceso' ? 'En Proceso' : 'Resuelto'}
                        </span>
                        <span className={`notification-tag notification-tag--${notif.prioridad}`}>
                          Prioridad {notif.prioridad}
                        </span>
                        {esNoLeido && <span className="notification-unread-dot" title="No leído" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie de página con accesos rápidos a ambos dashboards */}
          <div className="notification-footer">
            <button
              type="button"
              className="notification-footer-link"
              onClick={() => {
                setIsOpen(false);
                navigate('/dashboard-oficinas');
              }}
            >
              <FaLaptop size={12} />
              <span>Ver Tecnológicos</span>
            </button>
            <button
              type="button"
              className="notification-footer-link"
              onClick={() => {
                setIsOpen(false);
                navigate('/dashboard-semaforos');
              }}
            >
              <FaTrafficLight size={12} />
              <span>Ver Semafóricos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
