import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { 
  FaBell, 
  FaLaptop, 
  FaTrafficLight, 
  FaWrench,
  FaCheckDouble, 
  FaClock, 
  FaCircle, 
  FaExternalLinkAlt,
  FaSpinner
} from 'react-icons/fa';
import './NotificationCenter.css';
import {
  EVENTO_NOTIF_LEIDA,
  EVENTO_NOTIF_RECARGAR,
  STORAGE_KEY_NOTIF,
  obtenerNotificacionesLeidas,
  guardarNotificacionesLeidas,
  marcarNotificacionLeida
} from '../../utils/notificacionesLeidas';


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

  const isInfra = user?.rol === 'infraestructura';

  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [resumen, setResumen] = useState({ totalPendientes: 0, pendientesOficina: 0, pendientesSemaforo: 0, pendientesInfra: 0 });
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'oficina' | 'semaforo' | 'infraestructura'
  const [readIds, setReadIds] = useState(() => obtenerNotificacionesLeidas());

  // Guardar IDs leídos en localStorage y emitir evento
  const marcarComoLeido = (notifOrId) => {
    if (!notifOrId) return;
    const ids = [];
    if (typeof notifOrId === 'string' || typeof notifOrId === 'number') {
      ids.push(String(notifOrId));
    } else {
      if (notifOrId.id) ids.push(String(notifOrId.id));
      if (notifOrId.reporteId) ids.push(String(notifOrId.reporteId));
      if (notifOrId.tipo && notifOrId.reporteId) ids.push(`${notifOrId.tipo}-${notifOrId.reporteId}`);
    }
    marcarNotificacionLeida(ids);
    setReadIds(obtenerNotificacionesLeidas());
  };

  const marcarTodasComoLeidas = (e) => {
    e?.stopPropagation();
    const todosLosIds = notificaciones.flatMap((n) => [
      String(n.id),
      ...(n.reporteId ? [String(n.reporteId), `${n.tipo}-${n.reporteId}`] : [])
    ]);
    marcarNotificacionLeida(todosLosIds);
    setReadIds(obtenerNotificacionesLeidas());
  };

  // Sincronizar cuando otra vista marca una notificación como leída o se actualiza un reporte
  useEffect(() => {
    const sincronizar = () => setReadIds(obtenerNotificacionesLeidas());
    const onStorage = (e) => { if (e.key === STORAGE_KEY_NOTIF) sincronizar(); };
    const onRecargar = () => { cargarNotificaciones(); };

    window.addEventListener(EVENTO_NOTIF_LEIDA, sincronizar);
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENTO_NOTIF_RECARGAR, onRecargar);

    return () => {
      window.removeEventListener(EVENTO_NOTIF_LEIDA, sincronizar);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENTO_NOTIF_RECARGAR, onRecargar);
    };
  }, []);

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

  // Determina si una notificación ya fue leída considerando prefijos ('oficina-1', etc.) o IDs numéricos
  const estaLeida = (n) => {
    if (!n) return false;
    const strId = String(n.id);
    const repId = n.reporteId ? String(n.reporteId) : null;
    const prefixed = n.tipo && repId ? `${n.tipo}-${repId}` : null;
    return readIds.includes(strId) || (repId && readIds.includes(repId)) || (prefixed && readIds.includes(prefixed));
  };

  // Solo se conservan las notificaciones que NO estén resueltas ni canceladas
  // Las notificaciones pendientes o en proceso NUNCA desaparecen por solo haber sido leídas/vistas
  const notificacionesActivas = useMemo(() => {
    return notificaciones.filter((n) => {
      const estado = (n.estado || '').toLowerCase();
      return estado !== 'resuelto' && estado !== 'cancelado';
    });
  }, [notificaciones]);

  // Notificaciones visibles según la pestaña activa
  const notificacionesFiltradas = useMemo(() => {
    if (activeTab === 'oficina') {
      return notificacionesActivas.filter((n) => n.tipo === 'oficina');
    }
    if (activeTab === 'semaforo') {
      return notificacionesActivas.filter((n) => n.tipo === 'semaforo');
    }
    if (activeTab === 'infraestructura') {
      return notificacionesActivas.filter((n) => n.tipo === 'infraestructura');
    }
    return notificacionesActivas;
  }, [notificacionesActivas, activeTab]);

  // Conteo de no leídas (para el badge de la campana y la píldora 'X nuevas')
  const sinLeerCount = useMemo(() => {
    return notificacionesActivas.filter((n) => !estaLeida(n)).length;
  }, [notificacionesActivas, readIds]);

  // Conteo total de reportes activos por pestaña
  const conteoTodos = notificacionesActivas.length;
  const conteoOficinas = useMemo(() => {
    return notificacionesActivas.filter((n) => n.tipo === 'oficina').length;
  }, [notificacionesActivas]);
  const conteoSemaforos = useMemo(() => {
    return notificacionesActivas.filter((n) => n.tipo === 'semaforo').length;
  }, [notificacionesActivas]);
  const conteoInfra = useMemo(() => {
    return notificacionesActivas.filter((n) => n.tipo === 'infraestructura').length;
  }, [notificacionesActivas]);

  // Manejar clic en una notificación
  const handleNotifClick = (notif) => {
    marcarComoLeido(notif);
    setIsOpen(false);
    navigate(notif.ruta);
  };

  if (!user) return null;

  return (
    <div className="notification-center" ref={dropdownRef}>
      {/* Botón activador con campana e indicador de reportes activos */}
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
        {conteoTodos > 0 && (
          <span className="notification-badge">
            {conteoTodos > 99 ? '99+' : conteoTodos}
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
              {conteoTodos > 0 && (
                <span className="notification-unread-pill">
                  {conteoTodos} {conteoTodos === 1 ? 'pendiente' : 'pendientes'}
                </span>
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
          {isInfra ? (
            <div className="notification-tabs">
              <button
                type="button"
                className="notification-tab notification-tab--active"
              >
                <FaWrench size={12} />
                <span>Infraestructura</span>
                {conteoInfra > 0 && <span className="notification-tab-count">{conteoInfra}</span>}
              </button>
            </div>
          ) : (
            <div className="notification-tabs">
              <button
                type="button"
                className={`notification-tab ${activeTab === 'todos' ? 'notification-tab--active' : ''}`}
                onClick={() => setActiveTab('todos')}
              >
                <span>Todos</span>
                {conteoTodos > 0 && (
                  <span className="notification-tab-count">{conteoTodos}</span>
                )}
              </button>
              <button
                type="button"
                className={`notification-tab ${activeTab === 'oficina' ? 'notification-tab--active' : ''}`}
                onClick={() => setActiveTab('oficina')}
              >
                <FaLaptop size={12} />
                <span>Tecnológicos</span>
                {conteoOficinas > 0 && (
                  <span className="notification-tab-count">{conteoOficinas}</span>
                )}
              </button>
              <button
                type="button"
                className={`notification-tab ${activeTab === 'semaforo' ? 'notification-tab--active' : ''}`}
                onClick={() => setActiveTab('semaforo')}
              >
                <FaTrafficLight size={12} />
                <span>Semafóricos</span>
                {conteoSemaforos > 0 && (
                  <span className="notification-tab-count">{conteoSemaforos}</span>
                )}
              </button>
            </div>
          )}


          {/* Lista de notificaciones */}
          <div className="notification-list">
            {notificacionesFiltradas.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <FaBell />
                </div>
                <p className="notification-empty-text">No tienes notificaciones pendientes</p>
                <p className="notification-empty-subtext">
                  Los nuevos reportes aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              notificacionesFiltradas.map((notif) => {
                const esNoLeido = !estaLeida(notif);
                const esOficina = notif.tipo === 'oficina';
                const esInfra = notif.tipo === 'infraestructura';

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
                        esInfra 
                          ? 'notification-type-badge--infraestructura'
                          : esOficina 
                            ? 'notification-type-badge--oficina' 
                            : 'notification-type-badge--semaforo'
                      }`}
                      title={notif.tipoLabel}
                    >
                      {esInfra ? <FaWrench /> : esOficina ? <FaLaptop /> : <FaTrafficLight />}
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

          {/* Pie de página con accesos rápidos */}
          <div className="notification-footer">
            {isInfra ? (
              <button
                type="button"
                className="notification-footer-link"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard-infraestructura');
                }}
              >
                <FaWrench size={12} />
                <span>Ver Panel de Infraestructura</span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
