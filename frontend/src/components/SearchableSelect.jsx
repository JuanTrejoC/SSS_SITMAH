import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaChevronDown, FaSearch } from 'react-icons/fa';

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Buscar y seleccionar...",
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Cerrar al dar click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Filtrar opciones basado en búsqueda
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const s = search.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(s) || 
      (opt.searchTerms && opt.searchTerms.some(t => t.toLowerCase().includes(s)))
    );
  }, [options, search]);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Botón / Header del Select */}
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem',
          backgroundColor: 'white',
          border: '1px solid #7DD3FC',
          borderRadius: '6px',
          cursor: 'pointer',
          color: selectedOption ? '#0F172A' : '#94A3B8',
          fontSize: '0.875rem',
          minHeight: '44px'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FaChevronDown style={{ marginLeft: '0.5rem', color: '#64748B', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>

      {/* Menú Desplegable */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.25rem',
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Input de Búsqueda */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #F1F5F9', position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Escribe para buscar..."
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2rem',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Lista de Opciones */}
          <div style={{ overflowY: 'auto', padding: '0.25rem' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  style={{
                    padding: '0.65rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    backgroundColor: String(value) === String(opt.value) ? '#EFF6FF' : 'transparent',
                    color: String(value) === String(opt.value) ? '#1D4ED8' : '#334155',
                    fontWeight: String(value) === String(opt.value) ? '600' : '400',
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
