// Utilidad para gestionar notificaciones descartadas/eliminadas manualmente de la campana
// Permite que el usuario decida cuándo retirar de la vista notificaciones antiguas
// (por ejemplo, reportes de hace 2 semanas o más de 1 mes que ya fueron atendidos pero no cerrados).

export const STORAGE_KEY_DESCARTADAS = 'sitmah_dismissed_notifications';
export const EVENTO_NOTIF_DESCARTADAS = 'sitmah:notificaciones-descartadas-actualizadas';

/**
 * Obtiene el identificador canónico único de una notificación (ej: 'oficina-15', 'semaforo-4')
 * @param {object|string|number} item
 * @returns {string|null}
 */
export function normalizarIdNotificacion(item) {
  if (!item) return null;
  if (typeof item === 'object') {
    if (item.tipo && item.reporteId) return `${item.tipo}-${item.reporteId}`;
    if (item.id) return String(item.id);
    return null;
  }
  const str = String(item).trim();
  return str || null;
}

/**
 * Obtiene la lista de IDs descartados desde localStorage
 * Deduplica automáticamente si existían variantes numéricas duplicadas para un mismo reporte.
 * @returns {string[]} Lista de IDs en formato string (ej: ['oficina-34', 'semaforo-4'])
 */
export function obtenerNotificacionesDescartadas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DESCARTADAS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const unicos = new Set(parsed.map(String).map((s) => s.trim()).filter(Boolean));
    const prefijados = new Set();
    const soloNumeros = new Set();

    unicos.forEach((id) => {
      if (id.includes('-')) {
        prefijados.add(id);
      } else if (/^\d+$/.test(id)) {
        soloNumeros.add(id);
      } else {
        prefijados.add(id);
      }
    });

    // Descartar números planos que ya están incluidos con su prefijo (ej: '15' teniendo 'oficina-15')
    const resultado = Array.from(prefijados);
    soloNumeros.forEach((num) => {
      const estaCubierto = resultado.some((pref) => pref.endsWith(`-${num}`));
      if (!estaCubierto) {
        resultado.push(num);
      }
    });

    // Si había duplicados en el almacenamiento, auto-reparar localStorage
    if (resultado.length !== unicos.size) {
      try {
        localStorage.setItem(STORAGE_KEY_DESCARTADAS, JSON.stringify(resultado));
      } catch (_) {}
    }

    return resultado;
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
    const limpios = Array.from(new Set(ids.map(String).map((s) => s.trim()).filter(Boolean))).slice(-1000);
    localStorage.setItem(STORAGE_KEY_DESCARTADAS, JSON.stringify(limpios));
  } catch (e) {
    console.error('Error al guardar notificaciones descartadas:', e);
  }
}

/**
 * Descarta una o varias notificaciones para que dejen de aparecer en la campana
 * Guarda únicamente un identificador canónico por notificación.
 * @param {Array|string|number|object} notifOrIds
 */
export function descartarNotificaciones(notifOrIds) {
  if (!notifOrIds) return;
  const lista = Array.isArray(notifOrIds) ? notifOrIds : [notifOrIds];
  const actuales = obtenerNotificacionesDescartadas();
  const setActuales = new Set(actuales);
  let huboCambio = false;

  lista.forEach((item) => {
    if (!item) return;
    const canonico = normalizarIdNotificacion(item);
    if (canonico && !setActuales.has(canonico)) {
      setActuales.add(canonico);
      huboCambio = true;
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

  const canonico = normalizarIdNotificacion(notif);
  if (canonico && ids.includes(canonico)) return true;

  const strId = String(notif.id);
  const repId = notif.reporteId ? String(notif.reporteId) : null;
  const prefixed = notif.tipo && repId ? `${notif.tipo}-${repId}` : null;

  return (
    ids.includes(strId) ||
    (prefixed && ids.includes(prefixed)) ||
    (repId && ids.includes(repId))
  );
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

