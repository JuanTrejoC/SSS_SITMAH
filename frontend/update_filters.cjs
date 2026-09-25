const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix filtering logic
const filterRegex = /const coincideOrigen = !filtroOrigen \|\| \([\s\S]*?return coincideTexto && coincideEstado && coincideOrigen;\s*\n/g;
if (code.match(filterRegex)) {
  const newFilter = `const coincideOrigen = !filtroOrigen || (
              filtroOrigen === 'reemplazadas'
                ? (item.nombre?.includes('Reemplazada') || item.nombre?.includes('Retirada') || item.numeroInventario?.includes('-RET'))
                : (!item.nombre?.includes('Reemplazada') && !item.nombre?.includes('Retirada') && !item.numeroInventario?.includes('-RET'))
            );
            const coincideCategoria = !filtroCategoria || (item.categoria || 'componente').toLowerCase() === filtroCategoria.toLowerCase();
            return coincideTexto && coincideEstado && coincideOrigen && coincideCategoria;
`;
  code = code.replace(filterRegex, newFilter);
}

// 2. Add Mantenimiento card
const bajaRegex = /\{\/\* Cuadri: Baja \*\/\}/g;
if (code.match(bajaRegex) && !code.includes('{/* Cuadri: Mantenimiento */}')) {
  const mantenimientoStr = `{/* Cuadri: Mantenimiento */}
        {(() => {
          const countMantenimiento = existencias.filter(i => i.estadoFisico === 'Mantenimiento').reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);
          const totalArticulos = existencias.filter(i => i.estadoFisico === 'Mantenimiento').length;
          const isActive = filtroEstado === 'Mantenimiento';
          return (
            <div
              onClick={() => setFiltroEstado(isActive ? '' : 'Mantenimiento')}
              style={{
                backgroundColor: isActive ? '#fef3c7' : '#ffffff',
                border: isActive ? '2px solid #d97706' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isActive ? '0 8px 16px rgba(217, 119, 6, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#d97706';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: '#d97706' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#d97706', display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mantenimiento
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#78350f', lineHeight: 1.1 }}>
                  {countMantenimiento} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#b45309' }}>piezas</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {totalArticulos} {totalArticulos === 1 ? 'artículo' : 'artículos'}
                </div>

                {/* Botón rápido de PDF en la tarjeta */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportarReportePDF('Mantenimiento');
                  }}
                  title="Descargar Reporte PDF de Mantenimiento"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FDE68A',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FDE68A'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                >
                  <FaDownload size={10} /> PDF Mant...
                </button>
              </div>

              <div style={{
                backgroundColor: isActive ? '#d97706' : '#fef3c7',
                color: isActive ? '#ffffff' : '#b45309',
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0
              }}>
                <FaTools />
              </div>
            </div>
          );
        })()}

        {/* Cuadri: Baja */}`;

  code = code.replace(bajaRegex, mantenimientoStr);
}

fs.writeFileSync(file, code, 'utf8');
console.log('Filters and cards updated');
