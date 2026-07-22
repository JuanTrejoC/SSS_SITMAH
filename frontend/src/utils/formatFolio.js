export function formatFolio(folio, fallbackId) {
  if (!folio) {
    return fallbackId ? `#${fallbackId}` : '—';
  }

  // Clean whitespace and convert to uppercase
  const clean = String(folio).replace(/\s+/g, '').toUpperCase();

  // Format 1: PREFIX-NUMBER-YEAR (e.g. RT-03-2026 or RS-01-2026)
  const match1 = clean.match(/^(RT|RS|RO)-(\d+)-(\d{2,4})$/);
  if (match1) {
    let prefijo = match1[1];
    if (prefijo === 'RO') prefijo = 'RT';
    const numero = String(parseInt(match1[2], 10)).padStart(2, '0');
    const anio = match1[3];
    return `${prefijo}-${numero}-${anio}`;
  }

  // Format 2: Legacy PREFIX-YEAR-NUMBER (e.g. OF-2026-0003 or SM-2026-0001)
  const match2 = clean.match(/^(OF|SM)-(\d{4})-(\d+)$/);
  if (match2) {
    const originalPrefijo = match2[1];
    const prefijo = originalPrefijo === 'OF' ? 'RT' : 'RS';
    const anio = match2[2];
    const numero = String(parseInt(match2[3], 10)).padStart(2, '0');
    return `${prefijo}-${numero}-${anio}`;
  }

  return folio;
}