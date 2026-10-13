import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaChevronDown, FaSearch, FaTimes } from 'react-icons/fa';
import { PERSONAL_SITMAH, buscarPersonalSitmah } from '../data/personalSitmah';

export default function PersonalAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = '-- Seleccionar Responsable --',
  style = {},
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const limpiar = (str) =>
    String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Filtrar las 155 personas en base a búsqueda por palabras
  const filteredPersonal = useMemo(() => {
    if (!search.trim()) return PERSONAL_SITMAH;
    const palabras = limpiar(search).split(/\s+/).filter(w => w.length > 0);
    return PERSONAL_SITMAH.filter(p => {
      const n = limpiar(p.nombre);
      const c = limpiar(p.cargo);
      const d = limpiar(p.direccion);
      return palabras.every(palabra => n.includes(palabra) || c.includes(palabra) || d.includes(palabra));
    });
  }, [search]);

  const handleSeleccionar = (empleado) => {
    setIsOpen(false);
    setSearch('');
    if (empleado) {
      if (onChange) onChange(empleado.nombre);
      if (onSelect) onSelect(empleado);
    } else {
      if (onChange) onChange('');
      if (onSelect) onSelect({ nombre: '', cargo: '', direccion: '' });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleSeleccionar(null);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Botón con el diseño exacto de un <select> estándar */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearch('');
          }
        }}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          fontSize: '0.95rem',
          backgroundColor: disabled ? '#f1f5f9' : 'white',
          color: value ? '#1E293B' : '#64748b',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          minHeight: '45px',
          userSelect: 'none',
          transition: 'border-color 0.2s',
          ...style
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
          {value || placeholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
              onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
              onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
              title="Limpiar selección"
            >
              <FaTimes size={12} />
            </button>
          )}
          <FaChevronDown
            size={11}
            style={{
              color: '#64748B',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </div>
      </div>

      {/* Menú Desplegable con diseño limpio idéntico al select */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            maxHeight: '270px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Campo de Búsqueda discreto */}
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.8rem' }} />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar responsable por nombre..."
              style={{
                width: '100%',
                padding: '0.45rem 0.5rem 0.45rem 2rem',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                outline: 'none',
                fontSize: '0.875rem',
                color: '#1E293B',
                boxSizing: 'border-box'
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Lista de Opciones en texto limpio */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Opción vacía por defecto */}
            <div
              onClick={() => handleSeleccionar(null)}
              style={{
                padding: '0.65rem 1rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#64748b',
                borderBottom: '1px solid #f1f5f9'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {placeholder}
            </div>

            {filteredPersonal.length === 0 ? (
              <div style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>No se encontraron coincidencias para "<strong>{search}</strong>"</p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSeleccionar({ nombre: search.trim(), cargo: '', direccion: '' })}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#691B31',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.825rem'
                    }}
                  >
                    Usar "{search.trim()}"
                  </button>
                )}
              </div>
            ) : (
              filteredPersonal.map(p => {
                const isSelected = p.nombre === value;
                return (
                  <div
                    key={p.nombre}
                    onClick={() => handleSeleccionar(p)}
                    style={{
                      padding: '0.65rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      color: isSelected ? '#691B31' : '#1E293B',
                      fontWeight: isSelected ? '600' : '400',
                      backgroundColor: isSelected ? '#fdf2f4' : 'transparent',
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background-color 0.1s'
                    }}
                    onMouseOver={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseOut={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {p.nombre}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
