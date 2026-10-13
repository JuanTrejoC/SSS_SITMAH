import { API_BASE_URL } from '../config';

/**
 * Registra (o reutiliza) el resguardo en la base de datos para que aparezca
 * en el módulo de Resguardos y se pueda adjuntar la imagen firmada.
 * Nunca lanza error: si falla, solo se avisa en consola para no bloquear el Word.
 */
export async function registrarResguardo(token, { tipoInventario, itemId, nombreResguardante, cargo, direccion, descripcionPdf, numeroSeriePdf }) {
  if (!token || !itemId) return null;
  const nombreFinal = (nombreResguardante || '').trim() || 'Por Asignar';
  try {
    const res = await fetch(`${API_BASE_URL}/api/resguardos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tipoInventario,
        itemId,
        nombreResguardante: nombreFinal,
        cargo: cargo || '',
        direccion: direccion || '',
        area: direccion || '',
        descripcionPdf: descripcionPdf || '',
        numeroSeriePdf: numeroSeriePdf || ''
      })
    });
    const json = await res.json();
    return json.ok ? json.data : null;
  } catch (err) {
    console.warn('No se pudo registrar el resguardo:', err);
    return null;
  }
}
