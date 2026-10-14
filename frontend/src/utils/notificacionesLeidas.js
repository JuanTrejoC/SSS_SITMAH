// Manejo compartido de notificaciones leídas (persistidas en localStorage).
// Permite que cualquier vista marque una notificación como leída y que el
// centro de notificaciones (campana) se actualice al instante.

export const STORAGE_KEY_NOTIF = 'sitmah_read_notifications';
export const EVENTO_NOTIF_LEIDA = 'sitmah:notificacion-leida';

export function obtenerNotificacionesLeidas() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIF);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function guardarNotificacionesLeidas(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIF, JSON.stringify(ids.slice(-300)));
  } catch (e) {
    console.error('Error al guardar notificaciones leídas:', e);
  }
}

export function marcarNotificacionLeida(idOrIds) {
  if (!idOrIds) return;
  const lista = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  const actuales = obtenerNotificacionesLeidas();
  const setActuales = new Set(actuales.map(String));
  let huboCambio = false;

  lista.forEach((item) => {
    if (!item) return;
    const str = String(item).trim();
    if (!setActuales.has(str)) {
      setActuales.add(str);
      huboCambio = true;
    }
    // Si tiene formato 'tipo-id' (ej. 'oficina-12', 'semaforo-5', 'infra-8'), guardar también el id numérico
    const partes = str.split('-');
    if (partes.length === 2 && partes[1] && !setActuales.has(partes[1])) {
      setActuales.add(partes[1]);
      huboCambio = true;
    }
  });

  if (huboCambio) {
    const nuevoArray = Array.from(setActuales);
    guardarNotificacionesLeidas(nuevoArray);
  }
  window.dispatchEvent(new CustomEvent(EVENTO_NOTIF_LEIDA, { detail: { id: idOrIds } }));
}

