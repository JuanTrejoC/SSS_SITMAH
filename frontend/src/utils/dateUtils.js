/**
 * Utilidades para manejo y formateo de fechas en la interfaz.
 */

/**
 * Convierte un valor de semana ISO (ej. "2026-W48") a un texto legible en español.
 * Ejemplo: "Del 23 al 29 de noviembre de 2026"
 * 
 * @param {string} semana - Valor de la semana en formato ISO "YYYY-Www"
 * @returns {string} Rango de fechas legible
 */
export function obtenerRangoSemanaTexto(semana) {
  if (!semana) return '';
  const match = semana.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return semana;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Domingo 7, Lunes 1
  const lunesSemana1 = new Date(year, 0, 4 - dayOfWeek + 1);

  const lunes = new Date(lunesSemana1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const domingo = new Date(lunes.getTime() + 6 * 24 * 60 * 60 * 1000);

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const d1 = lunes.getDate();
  const m1 = meses[lunes.getMonth()];
  const y1 = lunes.getFullYear();

  const d2 = domingo.getDate();
  const m2 = meses[domingo.getMonth()];
  const y2 = domingo.getFullYear();

  if (y1 !== y2) {
    return `Del ${d1} de ${m1} ${y1} al ${d2} de ${m2} ${y2}`;
  } else if (m1 !== m2) {
    return `Del ${d1} de ${m1} al ${d2} de ${m2} de ${y2}`;
  } else {
    return `Del ${d1} al ${d2} de ${m2} de ${y2}`;
  }
}
