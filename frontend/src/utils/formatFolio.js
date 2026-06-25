export function formatFolio(folio, fallbackId) {
  if (!folio) {
    return fallbackId ? `#${fallbackId}` : '—';
  }

  // Expresión que acepta CUALQUIER orden, pero lo normaliza al formato correcto
  const regex = /^(RO|RS)-?(\d+)-?(\d{2,4})$/i;
  const match = String(folio).replace(/\s+/g, '').match(regex);

  if (match) {
    const prefijo = match[1].toUpperCase();
    const numero = match[2];
    const anio = match[3].slice(-2); // toma solo los 2 últimos dígitos del año

    return `${prefijo}-${numero.padStart(2, '0')}-${anio}`;
  }

  return folio;
}