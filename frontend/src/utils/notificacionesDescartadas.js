// Utilidad para gestionar notificaciones descartadas/eliminadas manualmente de la campana
// Permite que el usuario decida cuándo retirar de la vista notificaciones antiguas
// (por ejemplo, reportes de hace 2 semanas o más de 1 mes que ya fueron atendidos pero no cerrados).

export const STORAGE_KEY_DESCARTADAS = 'sitmah_dismissed_notifications';
export const EVENTO_NOTIF_DESCARTADAS = 'sitmah:notificaciones-descartadas-actualizadas';

/**
 * Obtiene la lista de IDs descartados desde localStorage
 * @returns {string[]} Lista de IDs en formato string (ej: ['oficina-34', '34', 'semaforo-4'])
 */
export function obtenerNotificacionesDescartadas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DESCARTADAS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error al leer notificaciones descartadas de localStorage:', e);
    return [];
  }
}

/**
 * Guarda la lista de IDs descartados en localStorage
 * @param {string[]} ids
 */
export function guardarNotificacionesDescartadas(ids) {
  try {
    const limpios = Array.from(new Set(ids.map(String))).slice(-1000);
    localStorage.setItem(STORAGE_KEY_DESCARTADAS, JSON.stringify(limpios));
  } catch (e) {
    console.error('Error al guardar notificaciones descartadas:', e);
  }
}

/**
 * Descarta una o varias notificaciones para que dejen de aparecer en la campana
 * @param {Array|string|number|object} notifOrIds
 */
export function descartarNotificaciones(notifOrIds) {
  if (!notifOrIds) return;
  const lista = Array.isArray(notifOrIds) ? notifOrIds : [notifOrIds];
  const actuales = obtenerNotificacionesDescartadas();
  const setActuales = new Set(actuales.map(String));
  let huboCambio = false;

  lista.forEach((item) => {
    if (!item) return;
    if (typeof item === 'string' || typeof item === 'number') {
      const str = String(item).trim();
      if (!setActuales.has(str)) {
        setActuales.add(str);
        huboCambio = true;
      }
      const partes = str.split('-');
      if (partes.length === 2 && partes[1] && !setActuales.has(partes[1])) {
        setActuales.add(partes[1]);
        huboCambio = true;
      }
    } else if (typeof item === 'object') {
      if (item.id && !setActuales.has(String(item.id))) {
        setActuales.add(String(item.id));
        huboCambio = true;
      }
      if (item.reporteId && !setActuales.has(String(item.reporteId))) {
        setActuales.add(String(item.reporteId));
        huboCambio = true;
      }
      if (item.tipo && item.reporteId) {
        const prefijo = `${item.tipo}-${item.reporteId}`;
        if (!setActuales.has(prefijo)) {
          setActuales.add(prefijo);
          huboCambio = true;
        }
      }
    }
  });

  if (huboCambio) {
    const nuevoArray = Array.from(setActuales);
    guardarNotificacionesDescartadas(nuevoArray);
    window.dispatchEvent(new CustomEvent(EVENTO_NOTIF_DESCARTADAS, { detail: { descartadas: nuevoArray } }));
  }
}

/**
 * Verifica si una notificación ya fue descartada por el usuario
 * @param {object} notif
 * @param {string[]} descartadas
 * @returns {boolean}
 */
export function estaNotificacionDescartada(notif, descartadas = null) {
  if (!notif) return false;
  const ids = descartadas || obtenerNotificacionesDescartadas();
  if (!ids || ids.length === 0) return false;

  const strId = String(notif.id);
  const repId = notif.reporteId ? String(notif.reporteId) : null;
  const prefixed = notif.tipo && repId ? `${notif.tipo}-${repId}` : null;

  return ids.includes(strId) || (repId && ids.includes(repId)) || (prefixed && ids.includes(prefixed));
}

/**
 * Restaura todas las notificaciones previamente descartadas
 */
export function restaurarNotificacionesDescartadas() {
  try {
    localStorage.removeItem(STORAGE_KEY_DESCARTADAS);
    window.dispatchEvent(new CustomEvent(EVENTO_NOTIF_DESCARTADAS, { detail: { descartadas: [] } }));
  } catch (e) {
    console.error('Error al restaurar notificaciones:', e);
  }
}

/**
 * Calcula los días de antigüedad de una notificación
 * @param {string|Date} fecha
 * @returns {number}
 */
export function calcularDiasAntiguedad(fecha) {
  if (!fecha) return 0;
  const f = new Date(fecha);
  if (isNaN(f.getTime())) return 0;
  const diffMs = Date.now() - f.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

