import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import {
  FaSearch, FaTimes, FaLaptop, FaDesktop, FaFileAlt, FaRoad,
  FaBoxes, FaClipboardCheck, FaChair, FaSpinner, FaArrowRight,
  FaWrench, FaTools
} from 'react-icons/fa';
import { formatFolio } from '../../utils/formatFolio';
import './BuscadorGlobal.css';

export default function BuscadorGlobalModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const esModoInfra =
    user?.rol === 'infraestructura' ||
    location.pathname.includes('infraestructura') ||
    location.pathname.includes('herramientas') ||
    location.pathname.includes('stock-infraestructura');

  const [query, setQuery] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState({
    reportesInfraestructura: [],
    reportesOficina: [],
    reportesSemaforo: [],
    equiposTecnologicos: [],
    herramientas: [],
    existencias: [],
    resguardos: [],
    mobiliario: [],
    totalResultados: 0,
    modo: esModoInfra ? 'infraestructura' : 'general'
  });

  const inputRef = useRef(null);

  // Autoenfocar el input cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResultados({
        reportesInfraestructura: [],
        reportesOficina: [],
        reportesSemaforo: [],
        equiposTecnologicos: [],
        herramientas: [],
        existencias: [],
        resguardos: [],
        mobiliario: [],
        totalResultados: 0,
        modo: esModoInfra ? 'infraestructura' : 'general'
      });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, esModoInfra]);

  // Escuchar tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Búsqueda con debounce (280ms)
  useEffect(() => {
    if (!isOpen || !user?.token) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResultados({
        reportesInfraestructura: [],
        reportesOficina: [],
        reportesSemaforo: [],
        equiposTecnologicos: [],
        herramientas: [],
        existencias: [],
        resguardos: [],
        mobiliario: [],
        totalResultados: 0,
        modo: esModoInfra ? 'infraestructura' : 'general'
      });
      setCargando(false);
      return;
    }

    setCargando(true);
    const timer = setTimeout(async () => {
      try {
        const contextoParam = esModoInfra ? '&contexto=infraestructura' : '';
        const res = await fetch(`${API_BASE_URL}/api/admin/busqueda-global?q=${encodeURIComponent(trimmed)}${contextoParam}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) {
            setResultados(json.data);
          }
        }
      } catch (err) {
        console.error('Error al realizar búsqueda global:', err);
      } finally {
        setCargando(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen, user, esModoInfra]);

  if (!isOpen) return null;

  const handleSeleccionar = (tipo, item) => {
    onClose();
    switch (tipo) {
      case 'reporte_infra':
        navigate(`/dashboard-infraestructura?folio=${encodeURIComponent(item.folio || '')}`);
        break;
      case 'reporte_oficina':
        navigate(`/dashboard-oficinas?folio=${encodeURIComponent(item.folio || '')}`);
        break;
      case 'reporte_semaforo':
        navigate(`/dashboard-semaforos?folio=${encodeURIComponent(item.folio || '')}`);
        break;
      case 'herramientas':
        if (esModoInfra || user?.rol === 'infraestructura') {
          navigate(`/inventario-herramientas?search=${encodeURIComponent(item.numeroInventario || item.marca || item.modelo || '')}`);
        } else {
          navigate(`/inventario-tecnologico?search=${encodeURIComponent(item.numeroInventario || item.numeroSerie || '')}`);
        }
        break;
      case 'tecnologico':
        navigate(`/inventario-tecnologico?search=${encodeURIComponent(item.numeroInventario || item.numeroSerie || item.responsable || '')}`);
        break;
      case 'existencias':
        if (esModoInfra || user?.rol === 'infraestructura') {
          navigate(`/stock-infraestructura?search=${encodeURIComponent(item.nombre || item.numeroSerie || '')}`);
        } else {
          navigate(`/inventario-existencias?search=${encodeURIComponent(item.nombre || item.numeroSerie || '')}`);
        }
        break;
      case 'resguardos':
        navigate(`/resguardos?search=${encodeURIComponent(item.nombreResguardante || item.numeroSeriePdf || '')}`);
        break;
      case 'mobiliario':
        navigate(`/inventario-mobiliario?search=${encodeURIComponent(item.numeroInventario || item.bien || '')}`);
        break;
      default:
        break;
    }
  };

  const formatearEstadoBadge = (estado) => {
    switch (estado) {
      case 'abierto':
        return <span className="spotlight-badge spotlight-badge-open">Abierto</span>;
      case 'en_proceso':
        return <span className="spotlight-badge spotlight-badge-progress">En Proceso</span>;
      case 'resuelto':
        return <span className="spotlight-badge spotlight-badge-resolved">Resuelto</span>;
      default:
        return <span className="spotlight-badge spotlight-badge-neutral">{estado || 'Activo'}</span>;
    }
  };

  const hayResultados = resultados.totalResultados > 0;

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div className="spotlight-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera del buscador */}
        <div className="spotlight-input-wrapper">
          {cargando ? (
            <FaSpinner className="fa-spin" style={{ color: '#BC955B', fontSize: '1.2rem' }} />
          ) : (
            <FaSearch style={{ color: '#691B31', fontSize: '1.2rem' }} />
          )}

          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder={
              esModoInfra
                ? "Buscar reportes RI, herramientas o piezas de infraestructura..."
                : "Buscar por folio, serie, persona, equipo o pieza..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {esModoInfra && (
            <span
              style={{
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                color: '#059669',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                borderRadius: '6px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap'
              }}
              title="Filtrando exclusivamente elementos del módulo de Infraestructura"
            >
              <FaWrench size={10} /> Infraestructura
            </span>
          )}

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem' }}
              title="Borrar texto"
            >
              <FaTimes size={15} />
            </button>
          )}

          <button type="button" className="spotlight-key-badge" onClick={onClose} title="Cerrar (Esc)">
            ESC
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="spotlight-results">
          {query.trim().length < 2 && (
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                {esModoInfra ? 'Búsqueda en Módulo de Infraestructura' : 'Búsqueda Global en SITMAH'}
              </p>
              <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                {esModoInfra
                  ? 'Escribe al menos 2 letras para encontrar reportes de infraestructura (RI-), herramientas de taller (hidrolavadoras, plantas) o refacciones.'
                  : 'Escribe al menos 2 letras para encontrar reportes (RO-, RS-, RI-), equipos de cómputo, piezas en almacén, resguardos o mobiliario.'}
              </p>
            </div>
          )}

          {query.trim().length >= 2 && !cargando && !hayResultados && (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.35rem' }}>
                No se encontraron resultados
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                No encontramos coincidencias para "<strong style={{ color: '#691B31' }}>{query}</strong>"{esModoInfra ? ' en el área de infraestructura' : ''}.
              </p>
            </div>
          )}

          {/* 1. Reportes de Infraestructura (RI-...) */}
          {resultados.reportesInfraestructura?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ color: '#059669' }}>
                <FaWrench size={12} /> Reportes de Infraestructura ({resultados.reportesInfraestructura.length})
              </div>
              {resultados.reportesInfraestructura.map((r) => (
                <div key={`infra-${r.id}`} className="spotlight-item" onClick={() => handleSeleccionar('reporte_infra', r)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
                      <FaWrench size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        <span style={{ color: '#059669', fontWeight: 700 }}>{formatFolio(r.folio, r.id, 'infraestructura')}</span> — {r.solicitante}
                      </div>
                      <div className="spotlight-item-subtitle">
                        {r.area?.nombre || 'Infraestructura'} {r.equipo ? `• Elemento: ${r.equipo}` : ''} {r.sede ? `• Sede: ${r.sede.nombre}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {formatearEstadoBadge(r.estado)}
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Herramientas de Taller / Infraestructura */}
          {resultados.herramientas?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ marginTop: '0.5rem', color: '#0284c7' }}>
                <FaTools size={12} /> Herramientas de Taller / Infraestructura ({resultados.herramientas.length})
              </div>
              {resultados.herramientas.map((h) => (
                <div key={`tool-${h.id}`} className="spotlight-item" onClick={() => handleSeleccionar('herramientas', h)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                      <FaTools size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        {h.marca ? `${h.marca} • ` : ''}{h.modelo || h.tipo}
                      </div>
                      <div className="spotlight-item-subtitle">
                        Inv: <strong style={{ color: '#0284c7' }}>{h.numeroInventario || 'S/N'}</strong> {h.areaUbicacion ? `• Ubicación: ${h.areaUbicacion}` : ''} {h.responsable ? `• Resp: ${h.responsable}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spotlight-badge spotlight-badge-neutral">{h.estatus || 'Bueno'}</span>
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Refacciones y Stock */}
          {resultados.existencias?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ marginTop: '0.5rem' }}>
                <FaBoxes size={12} /> {esModoInfra ? 'Stock de Infraestructura' : 'Refacciones y Stock'} ({resultados.existencias.length})
              </div>
              {resultados.existencias.map((ex) => (
                <div key={`ex-${ex.id}`} className="spotlight-item" onClick={() => handleSeleccionar('existencias', ex)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
                      <FaBoxes size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        {ex.nombre} {ex.marca ? `(${ex.marca})` : ''}
                      </div>
                      <div className="spotlight-item-subtitle">
                        Cat: {ex.categoria} • Inv: {ex.tipoInventario} {ex.numeroSerie ? `• S/N: ${ex.numeroSerie}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spotlight-badge spotlight-badge-resolved">
                      Stock: {ex.cantidad}
                    </span>
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. Reportes Tecnológicos (solo si NO está en modo infraestructura) */}
          {!esModoInfra && resultados.reportesOficina?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ marginTop: '0.5rem', color: '#691B31' }}>
                <FaLaptop size={12} /> Reportes Tecnológicos ({resultados.reportesOficina.length})
              </div>
              {resultados.reportesOficina.map((r) => (
                <div key={`of-${r.id}`} className="spotlight-item" onClick={() => handleSeleccionar('reporte_oficina', r)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: 'rgba(105, 27, 49, 0.08)', color: '#691B31' }}>
                      <FaLaptop size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        <span style={{ color: '#691B31', fontWeight: 700 }}>{formatFolio(r.folio, r.id)}</span> — {r.solicitante}
                      </div>
                      <div className="spotlight-item-subtitle">
                        {r.area?.nombre || 'Oficinas'} {r.equipo ? `• Equipo: ${r.equipo}` : ''} {r.numeroSerie ? `• S/N: ${r.numeroSerie}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {formatearEstadoBadge(r.estado)}
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Reportes de Semáforo (solo si NO está en modo infraestructura) */}
          {!esModoInfra && resultados.reportesSemaforo?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ marginTop: '0.5rem' }}>
                <FaRoad size={12} /> Reportes de Semáforos ({resultados.reportesSemaforo.length})
              </div>
              {resultados.reportesSemaforo.map((r) => (
                <div key={`sem-${r.id}`} className="spotlight-item" onClick={() => handleSeleccionar('reporte_semaforo', r)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                      <FaRoad size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        <span style={{ color: '#b45309', fontWeight: 700 }}>{formatFolio(r.folio, r.id)}</span> — {r.jefeTurno}
                      </div>
                      <div className="spotlight-item-subtitle">
                        Crucero: {r.crucero?.nombre || 'N/A'} {r.estacion ? `• Estación: ${r.estacion.nombre}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {formatearEstadoBadge(r.estado)}
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. Inventario de Equipos Tecnológicos (solo si NO está en modo infraestructura) */}
          {!esModoInfra && resultados.equiposTecnologicos?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ marginTop: '0.5rem' }}>
                <FaDesktop size={12} /> Inventario de Equipos Tecnológicos ({resultados.equiposTecnologicos.length})
              </div>
              {resultados.equiposTecnologicos.map((eq) => (
                <div key={`eq-${eq.id}`} className="spotlight-item" onClick={() => handleSeleccionar('tecnologico', eq)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                      <FaDesktop size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        <span style={{ textTransform: 'capitalize' }}>{eq.tipo}</span> {eq.marca ? `• ${eq.marca}` : ''} {eq.modelo ? `(${eq.modelo})` : ''}
                      </div>
                      <div className="spotlight-item-subtitle">
                        {eq.responsable ? `Resp: ${eq.responsable}` : 'Sin asignar'} {eq.numeroSerie ? `• S/N: ${eq.numeroSerie}` : ''} {eq.numeroInventario ? `• Inv: ${eq.numeroInventario}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spotlight-badge spotlight-badge-neutral">{eq.estatus || 'Activo'}</span>
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 7. Resguardos (solo si NO está en modo infraestructura) */}
          {!esModoInfra && resultados.resguardos?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ marginTop: '0.5rem' }}>
                <FaClipboardCheck size={12} /> Resguardos ({resultados.resguardos.length})
              </div>
              {resultados.resguardos.map((resg) => (
                <div key={`resg-${resg.id}`} className="spotlight-item" onClick={() => handleSeleccionar('resguardos', resg)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
                      <FaClipboardCheck size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        Resguardo a: <span style={{ fontWeight: 700 }}>{resg.nombreResguardante}</span>
                      </div>
                      <div className="spotlight-item-subtitle">
                        {resg.area || 'Sin área'} {resg.numeroSeriePdf ? `• S/N: ${resg.numeroSeriePdf}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spotlight-badge spotlight-badge-neutral">{resg.estado || 'Activo'}</span>
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 8. Mobiliario (solo si NO está en modo infraestructura) */}
          {!esModoInfra && resultados.mobiliario?.length > 0 && (
            <div>
              <div className="spotlight-section-title" style={{ marginTop: '0.5rem' }}>
                <FaChair size={12} /> Mobiliario ({resultados.mobiliario.length})
              </div>
              {resultados.mobiliario.map((mob) => (
                <div key={`mob-${mob.id}`} className="spotlight-item" onClick={() => handleSeleccionar('mobiliario', mob)}>
                  <div className="spotlight-item-content">
                    <div className="spotlight-item-icon" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                      <FaChair size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <div className="spotlight-item-title">
                        {mob.bien} {mob.marca ? `• ${mob.marca}` : ''}
                      </div>
                      <div className="spotlight-item-subtitle">
                        Resp: {mob.nombreResguardante} • Inv: {mob.numeroInventario}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="spotlight-badge spotlight-badge-neutral">Mobiliario</span>
                    <FaArrowRight size={12} style={{ color: '#cbd5e1' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie de navegación */}
        <div className="spotlight-footer">
          <div className="spotlight-footer-keys">
            <span className="spotlight-footer-key">
              <span className="spotlight-key-badge">Ctrl + K</span> Buscar
            </span>
            <span className="spotlight-footer-key">
              <span className="spotlight-key-badge">ESC</span> Cerrar
            </span>
          </div>
          <div>
            {hayResultados && (
              <span>{resultados.totalResultados} {resultados.totalResultados === 1 ? 'coincidencia' : 'coincidencias'}</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
