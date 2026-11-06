import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';
import { 
  FaBell, 
  FaLaptop, 
  FaTrafficLight, 
  FaWrench,
  FaCheckDouble, 
  FaClock, 
  FaCircle, 
  FaExternalLinkAlt,
  FaSpinner,
  FaBroom,
  FaTimes,
  FaTrashAlt,
  FaHistory
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
import {
  STORAGE_KEY_DESCARTADAS,
  EVENTO_NOTIF_DESCARTADAS,
  obtenerNotificacionesDescartadas,
  descartarNotificaciones,
  estaNotificacionDescartada,
  restaurarNotificacionesDescartadas,
  calcularDiasAntiguedad
} from '../../utils/notificacionesDescartadas';


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

/**
 * Notificación flotante (Toast) con diseño institucional premium SITRAC-H.
 */
function mostrarToastSitrach({
  titulo = 'Operación completada',
  mensajeHtml = '',
  estado = 'ACCIÓN COMPLETADA',
  tipo = 'success', // 'success' | 'restore' | 'info'
  timer = 1800
}) {
  const esRestore = tipo === 'restore';
  const iconSvg = esRestore
    ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
         <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
         <path d="M3 3v5h5"></path>
       </svg>`
    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
         <polyline points="20 6 9 17 4 12"></polyline>
       </svg>`;

  const ringClass = esRestore
    ? 'sitrach-toast-icon-ring--restore'
    : 'sitrach-toast-icon-ring--success';

  const pillClass = esRestore
    ? 'sitrach-toast-pill-tag--restore'
    : 'sitrach-toast-pill-tag--success';

  Swal.fire({
    toast: true,
    position: 'top-end',
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
    showCloseButton: false,
    showClass: {
      popup: 'sitrach-toast-enter',
    },
    hideClass: {
      popup: 'sitrach-toast-exit',
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
      const closeBtn = toast.querySelector('.sitrach-toast-close-btn');
      if (closeBtn) {
        const cerrarToast = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          try {
            Swal.close();
          } catch (err) {
            console.error('Error al cerrar toast:', err);
          }
          // Respaldo de seguridad para removerlo inmediatamente del DOM si la animación es bloqueada
          setTimeout(() => {
            const popup = Swal.getPopup();
            if (popup && popup.classList.contains('sitrach-toast-popup')) {
              popup.remove();
            }
            const container = document.querySelector('.sitrach-toast-container');
            if (container) {
              container.remove();
            }
          }, 220);
        };
        closeBtn.onclick = cerrarToast;
        closeBtn.onpointerdown = (e) => e.stopPropagation();
      }
    },
    customClass: {
      popup: 'sitrach-toast-popup',
      container: 'sitrach-toast-container',
      timerProgressBar: 'sitrach-toast-progress',
    },
    html: `
      <div class="sitrach-toast-card">
        <div class="sitrach-toast-accent-bar"></div>
        <div class="sitrach-toast-body">
          <div class="sitrach-toast-icon-col">
            <div class="sitrach-toast-icon-ring ${ringClass}">
              ${iconSvg}
            </div>
          </div>
          <div class="sitrach-toast-content">
            <div class="sitrach-toast-header">
              <span class="sitrach-toast-system-tag">SITRAC-H</span>
              <div class="sitrach-toast-header-actions">
                <span class="sitrach-toast-pill-tag ${pillClass}">
                  <span class="sitrach-toast-pill-dot"></span>
                  ${estado}
                </span>
                <button type="button" class="sitrach-toast-close-btn" title="Cerrar notificación" aria-label="Cerrar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div class="sitrach-toast-title">${titulo}</div>
            <div class="sitrach-toast-text">${mensajeHtml}</div>
          </div>
        </div>
      </div>
    `,
  });
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
  const [descartadasIds, setDescartadasIds] = useState(() => obtenerNotificacionesDescartadas());

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

  // Sincronizar cuando otra vista marca una notificación como leída, se descartan o se actualiza un reporte
  useEffect(() => {
    const sincronizarLeidas = () => setReadIds(obtenerNotificacionesLeidas());
    const sincronizarDescartadas = () => setDescartadasIds(obtenerNotificacionesDescartadas());
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY_NOTIF) sincronizarLeidas();
      if (e.key === STORAGE_KEY_DESCARTADAS) sincronizarDescartadas();
    };
    const onRecargar = () => { cargarNotificaciones(); };

    window.addEventListener(EVENTO_NOTIF_LEIDA, sincronizarLeidas);
    window.addEventListener(EVENTO_NOTIF_DESCARTADAS, sincronizarDescartadas);
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENTO_NOTIF_RECARGAR, onRecargar);

    return () => {
      window.removeEventListener(EVENTO_NOTIF_LEIDA, sincronizarLeidas);
      window.removeEventListener(EVENTO_NOTIF_DESCARTADAS, sincronizarDescartadas);
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

  // Solo se conservan las notificaciones que NO estén resueltas ni canceladas,
  // y que el usuario NO haya decidido descartar manualmente de la campana
  const notificacionesActivas = useMemo(() => {
    return notificaciones.filter((n) => {
      const estado = (n.estado || '').toLowerCase();
      if (estado === 'resuelto' || estado === 'cancelado') return false;
      return !estaNotificacionDescartada(n, descartadasIds);
    });
  }, [notificaciones, descartadasIds]);

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

  // Manejar clic en una notificación para abrir reporte
  const handleNotifClick = (notif) => {
    marcarComoLeido(notif);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('sitmah:abrir-reporte', {
      detail: {
        id: notif.reporteId,
        tipo: notif.tipo,
        folio: notif.folio,
      }
    }));
    navigate(notif.ruta);
  };

  // Descarte individual de notificación (a decisión del usuario)
  const handleDescartarIndividual = (e, notif) => {
    e?.stopPropagation(); // Evitar abrir el reporte
    const dias = calcularDiasAntiguedad(notif.createdAt);
    const mensajeTiempo = dias >= 30
      ? `Reporte enviado hace más de 1 mes (${dias} días).`
      : dias >= 14
        ? `Reporte enviado hace más de 2 semanas (${dias} días).`
        : `Reporte enviado hace ${dias} ${dias === 1 ? 'día' : 'días'}.`;

    Swal.fire({
      title: '¿Quitar de la campana?',
      html: `
        <div style="font-size: 0.88rem; color: #475569; text-align: left; line-height: 1.5;">
          <p style="margin-bottom: 0.5rem;">
            Se quitará la notificación del folio <strong>${notif.folio}</strong> de la campana para que no siga saturando tu vista.
          </p>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.6rem 0.8rem; margin: 0.6rem 0; font-size: 0.82rem;">
            <div><strong>Solicitante:</strong> ${notif.solicitante}</div>
            <div><strong>Antigüedad:</strong> ${mensajeTiempo}</div>
            <div><strong>Detalle:</strong> ${notif.detalle || 'Sin detalle'}</div>
          </div>
          <p style="font-size: 0.78rem; color: #94A3B8; margin-top: 0.5rem; margin-bottom: 0;">
            <em><svg style="display:inline-block; vertical-align:-2px; margin-right:4px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>Nota: El reporte original permanecerá seguro e intacto en el sistema.</em>
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#691B31',
      cancelButtonColor: '#94A3B8',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        descartarNotificaciones(notif);
        setDescartadasIds(obtenerNotificacionesDescartadas());
        mostrarToastSitrach({
          titulo: 'Notificación retirada',
          mensajeHtml: `El reporte <span class="sitrach-toast-chip">${notif.folio}</span> ya no se mostrará en la campana.`,
          estado: 'RETIRADO DE VISTA',
          tipo: 'success',
          timer: 1800,
        });
      }
    });
  };

  // Depuración masiva controlada por el usuario (más de 1 mes o más de 2 semanas)
  const abrirModalLimpieza = (e) => {
    e?.stopPropagation();
    const mayoresAUnMes = notificacionesActivas.filter((n) => calcularDiasAntiguedad(n.createdAt) >= 30);
    const mayoresADosSemanas = notificacionesActivas.filter((n) => calcularDiasAntiguedad(n.createdAt) >= 14);
    const tieneDescartadas = descartadasIds.length > 0;

    Swal.fire({
      title: 'Depurar Notificaciones',
      html: `
        <div style="font-size: 0.88rem; color: #475569; text-align: left; line-height: 1.5;">
          <p style="margin-bottom: 0.85rem;">
            Tú decides cuándo retirar notificaciones que ya fueron atendidas o que llevan tiempo abiertas para no saturar tu campana:
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <button id="swal-btn-mes" type="button" style="
              display: flex; justify-content: space-between; align-items: center;
              padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid #691B31;
              background: ${mayoresAUnMes.length > 0 ? '#691B31' : '#F1F5F9'};
              color: ${mayoresAUnMes.length > 0 ? '#FFFFFF' : '#94A3B8'};
              cursor: ${mayoresAUnMes.length > 0 ? 'pointer' : 'not-allowed'};
              font-weight: 600; font-size: 0.85rem;
            " ${mayoresAUnMes.length === 0 ? 'disabled' : ''}>
              <span><svg style="display:inline-block; vertical-align:-2px; margin-right:6px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Más de 1 mes (≥ 30 días)</span>
              <span style="
                background: ${mayoresAUnMes.length > 0 ? 'rgba(255,255,255,0.25)' : '#E2E8F0'};
                padding: 0.15rem 0.6rem; border-radius: 12px; font-size: 0.8rem;
              ">${mayoresAUnMes.length} ${mayoresAUnMes.length === 1 ? 'notificación' : 'notificaciones'}</span>
            </button>

            <button id="swal-btn-quincena" type="button" style="
              display: flex; justify-content: space-between; align-items: center;
              padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid #BC955B;
              background: ${mayoresADosSemanas.length > 0 ? '#BC955B' : '#F1F5F9'};
              color: ${mayoresADosSemanas.length > 0 ? '#FFFFFF' : '#94A3B8'};
              cursor: ${mayoresADosSemanas.length > 0 ? 'pointer' : 'not-allowed'};
              font-weight: 600; font-size: 0.85rem;
            " ${mayoresADosSemanas.length === 0 ? 'disabled' : ''}>
              <span><svg style="display:inline-block; vertical-align:-2px; margin-right:6px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Más de 2 semanas (≥ 14 días)</span>
              <span style="
                background: ${mayoresADosSemanas.length > 0 ? 'rgba(255,255,255,0.25)' : '#E2E8F0'};
                padding: 0.15rem 0.6rem; border-radius: 12px; font-size: 0.8rem;
              ">${mayoresADosSemanas.length} ${mayoresADosSemanas.length === 1 ? 'notificación' : 'notificaciones'}</span>
            </button>

            ${tieneDescartadas ? `
              <button id="swal-btn-restaurar" type="button" style="
                display: flex; justify-content: space-between; align-items: center;
                padding: 0.6rem 1rem; border-radius: 10px; border: 1px dashed #64748B;
                background: #F8FAFC; color: #475569; cursor: pointer;
                font-weight: 500; font-size: 0.8rem; margin-top: 0.3rem;
              ">
                <span><svg style="display:inline-block; vertical-align:-2px; margin-right:6px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>Restaurar notificaciones eliminadas</span>
                <span style="background: #E2E8F0; padding: 0.15rem 0.5rem; border-radius: 10px; font-weight: bold;">${descartadasIds.length}</span>
              </button>
            ` : ''}
          </div>

          <p style="font-size: 0.75rem; color: #94A3B8; margin-top: 1rem; margin-bottom: 0;">
            <svg style="display:inline-block; vertical-align:-2px; margin-right:4px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>Mientras tú no las elimines, las notificaciones seguirán aquí sin importar el tiempo transcurrido.
          </p>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        const btnMes = document.getElementById('swal-btn-mes');
        const btnQuincena = document.getElementById('swal-btn-quincena');
        const btnRestaurar = document.getElementById('swal-btn-restaurar');

        if (btnMes && mayoresAUnMes.length > 0) {
          btnMes.onclick = () => {
            Swal.close();
            confirmarLimpiezaMasiva(mayoresAUnMes, 'más de 1 mes');
          };
        }

        if (btnQuincena && mayoresADosSemanas.length > 0) {
          btnQuincena.onclick = () => {
            Swal.close();
            confirmarLimpiezaMasiva(mayoresADosSemanas, 'más de 2 semanas');
          };
        }

        if (btnRestaurar) {
          btnRestaurar.onclick = () => {
            Swal.close();
            confirmarRestauracion();
          };
        }
      }
    });
  };

  const confirmarLimpiezaMasiva = (lista, etiqueta) => {
    Swal.fire({
      title: `¿Eliminar ${lista.length} ${lista.length === 1 ? 'notificación' : 'notificaciones'}?`,
      text: `Se retirarán de la campana todas las notificaciones de ${etiqueta}. Los reportes continuarán registrados en el sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar de la campana',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#691B31',
      cancelButtonColor: '#94A3B8',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        descartarNotificaciones(lista);
        setDescartadasIds(obtenerNotificacionesDescartadas());
        mostrarToastSitrach({
          titulo: 'Notificaciones depuradas',
          mensajeHtml: `Se retiraron <span class="sitrach-toast-chip">${lista.length} ${lista.length === 1 ? 'notificación' : 'notificaciones'}</span> (${etiqueta}) de la campana.`,
          estado: 'DEPURACIÓN EXITOSA',
          tipo: 'success',
          timer: 1800,
        });
      }
    });
  };

  const confirmarRestauracion = () => {
    Swal.fire({
      title: '¿Restaurar notificaciones?',
      text: 'Volverán a mostrarse en la campana las notificaciones que habías quitado manualmente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#691B31',
      cancelButtonColor: '#94A3B8',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        restaurarNotificacionesDescartadas();
        setDescartadasIds([]);
        mostrarToastSitrach({
          titulo: 'Notificaciones restauradas',
          mensajeHtml: 'Se volvieron a mostrar en la campana todas las notificaciones previamente retiradas.',
          estado: 'RESTAURADO',
          tipo: 'restore',
          timer: 1800,
        });
      }
    });
  };

  if (!user) return null;

  return (
    <div className="notification-center" ref={dropdownRef}>
      {/* Botón activador con campana: muestra insignia solo cuando hay nuevos/no leídos */}
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
            {sinLeerCount > 99 ? '99+' : sinLeerCount}
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
              {sinLeerCount > 0 ? (
                <span className="notification-unread-pill">
                  {sinLeerCount} {sinLeerCount === 1 ? 'nueva' : 'nuevas'}
                </span>
              ) : conteoTodos > 0 ? (
                <span className="notification-unread-pill" style={{ opacity: 0.9 }}>
                  {conteoTodos} {conteoTodos === 1 ? 'pendiente' : 'pendientes'}
                </span>
              ) : null}
            </div>
            <div className="notification-header-actions">
              {(conteoTodos > 0 || descartadasIds.length > 0) && (
                <button
                  type="button"
                  className="notification-cleanup-btn"
                  onClick={abrirModalLimpieza}
                  title="Depurar notificaciones de la campana"
                >
                  <FaBroom size={12} />
                  <span>Limpiar</span>
                </button>
              )}
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
                const diasAntiguedad = calcularDiasAntiguedad(notif.createdAt);

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
                        <div className="notification-row-top-right">
                          <span className="notification-time">
                            <FaClock size={10} />
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                          <button
                            type="button"
                            className="notification-item-dismiss-btn"
                            onClick={(e) => handleDescartarIndividual(e, notif)}
                            title="Quitar esta notificación de la campana"
                            aria-label="Quitar de la campana"
                          >
                            <FaTimes size={11} />
                          </button>
                        </div>
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
                        {diasAntiguedad >= 30 && (
                          <span className="notification-tag notification-tag--antiguo" title={`Reporte enviado hace ${diasAntiguedad} días`}>
                            +1 mes
                          </span>
                        )}
                        {diasAntiguedad >= 14 && diasAntiguedad < 30 && (
                          <span className="notification-tag notification-tag--quincena" title={`Reporte enviado hace ${diasAntiguedad} días`}>
                            +2 sem
                          </span>
                        )}
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
