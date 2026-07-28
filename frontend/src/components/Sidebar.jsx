import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FaTachometerAlt, FaFileAlt, FaRoad,
  FaChartBar, FaCog, FaTimes, FaLaptop, FaBoxes, FaWrench
} from 'react-icons/fa'
import { FaFacebook, FaXTwitter } from 'react-icons/fa6'
import logoSitmah from '../assets/logo.png'

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth()
  const ubicacion = useLocation()
  const esActivo = (ruta) => ubicacion.pathname === ruta

  const closeSidebar = () => {
    if (setIsOpen) {
      setIsOpen(false)
    }
  }

  /* Estilos de cada enlace del sidebar */
  const linkStyle = (ruta) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    padding: '0.75rem 0.85rem',
    marginBottom: '0.25rem',
    borderRadius: '8px',
    backgroundColor: esActivo(ruta) ? '#BC955B' : 'transparent',
    color: 'white',
    textDecoration: 'none',
    fontSize: 'clamp(0.82rem, 1.8vw, 0.9rem)',
    fontWeight: esActivo(ruta) ? '600' : '400',
    transition: 'background 0.2s, transform 0.15s',
    cursor: 'pointer',
  })

  const linkHover = (ruta) => ({
    over: (e) => { if (!esActivo(ruta)) { e.currentTarget.style.backgroundColor = 'rgba(188,149,91,0.25)'; e.currentTarget.style.transform = 'translateX(3px)' } },
    out:  (e) => { if (!esActivo(ruta)) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' } },
  })

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>

      {/* Botón de cierre — solo visible en mobile */}
      <button
        className="sidebar-close-btn"
        onClick={() => setIsOpen(false)}
        aria-label="Cerrar menú"
      >
        <FaTimes size={14} />
      </button>

      {/* LOGO */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        paddingTop: '0.25rem',
        paddingRight: '2rem', /* espacio para el botón close en mobile */
      }}>
        <a
          href="https://s-transportemetropolitano.hidalgo.gob.mx/"
          target="_blank"
          rel="noreferrer"
          style={{ cursor: 'pointer', textDecoration: 'none', display: 'block', width: '100%' }}
        >
          <img
            src={logoSitmah}
            alt="SITMAH Logo"
            className="sidebar-logo"
          />
        </a>
      </div>

      {/* SECCIÓN: GENERAL */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p className="sidebar-section-label">General</p>

        {/* Dashboard — solo admin */}
        {user?.rol === 'administrador' && (
          <Link
            to="/dashboard"
            style={linkStyle('/dashboard')}
            onMouseOver={linkHover('/dashboard').over}
            onMouseOut={linkHover('/dashboard').out}
            onClick={closeSidebar}
          >
            <FaTachometerAlt size={15} />
            Dashboard
          </Link>
        )}

        {/* Crear Reporte Oficinas — solo solicitante */}
        {user?.rol !== 'administrador' && user?.rol !== 'infraestructura' && (
          <Link
            to="/crear-oficinas"
            style={linkStyle('/crear-oficinas')}
            onMouseOver={linkHover('/crear-oficinas').over}
            onMouseOut={linkHover('/crear-oficinas').out}
            onClick={closeSidebar}
          >
            <FaFileAlt size={15} />
            Crear Reporte Tecnológico
          </Link>
        )}

        {/* Crear Reporte Semáforos — solo solicitante */}
        {user?.rol !== 'administrador' && user?.rol !== 'infraestructura' && (
          <Link
            to="/crear-semaforos"
            style={linkStyle('/crear-semaforos')}
            onMouseOver={linkHover('/crear-semaforos').over}
            onMouseOut={linkHover('/crear-semaforos').out}
            onClick={closeSidebar}
          >
            <FaRoad size={15} />
            Crear Reporte Semafórico
          </Link>
        )}
      </div>

      {/* SECCIÓN: ADMINISTRACIÓN — admin e infraestructura */}
      {(user?.rol === 'administrador' || user?.rol === 'infraestructura') && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="sidebar-section-label">Administración</p>

          {user?.rol === 'administrador' && (
            <>
              <Link
            to="/estadisticas"
            style={linkStyle('/estadisticas')}
            onMouseOver={linkHover('/estadisticas').over}
            onMouseOut={linkHover('/estadisticas').out}
            onClick={closeSidebar}
          >
            <FaChartBar size={15} />
            Estadísticas
          </Link>

          <Link
            to="/configuracion"
            style={linkStyle('/configuracion')}
            onMouseOver={linkHover('/configuracion').over}
            onMouseOut={linkHover('/configuracion').out}
            onClick={closeSidebar}
          >
            <FaCog size={15} />
            Configuración
          </Link>

          <Link
            to="/inventario-semaforos"
            style={linkStyle('/inventario-semaforos')}
            onMouseOver={linkHover('/inventario-semaforos').over}
            onMouseOut={linkHover('/inventario-semaforos').out}
            onClick={closeSidebar}
          >
            <FaRoad size={15} />
            Inventario Semáforos
          </Link>

          <Link
            to="/inventario-tecnologico"
            style={linkStyle('/inventario-tecnologico')}
            onMouseOver={linkHover('/inventario-tecnologico').over}
            onMouseOut={linkHover('/inventario-tecnologico').out}
            onClick={closeSidebar}
          >
            <FaLaptop size={15} />
            Inventario Tecnológico
          </Link>

          <Link
            to="/inventario-existencias"
            style={linkStyle('/inventario-existencias')}
            onMouseOver={linkHover('/inventario-existencias').over}
            onMouseOut={linkHover('/inventario-existencias').out}
            onClick={closeSidebar}
          >
              <FaBoxes size={15} />
              Inventario de Existencias
            </Link>
            </>
          )}

          <Link
            to="/inventario-herramientas"
            style={linkStyle('/inventario-herramientas')}
            onMouseOver={linkHover('/inventario-herramientas').over}
            onMouseOut={linkHover('/inventario-herramientas').out}
            onClick={closeSidebar}
          >
            <FaWrench size={15} />
            Inventario de Herramientas
          </Link>
        </div>
      )}

      {/* REDES SOCIALES — solo solicitante */}
      {(user?.rol !== 'administrador' && user?.rol !== 'infraestructura') && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <span style={{
            fontSize: '0.7rem',
            color: 'rgba(252,211,211,0.8)',
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: '0.8px',
          }}>
            Redes Sociales
          </span>
          <div style={{ display: 'flex', gap: '0.85rem' }}>
            {[
              {
                href: 'https://www.facebook.com/Sistemadetransportemetropolitano/about?locale=es_LA',
                title: 'Facebook',
                icon: <FaFacebook size={17} />,
                hoverBg: '#1877F2',
              },
              {
                href: 'https://x.com/STMHidalgo',
                title: 'X (Twitter)',
                icon: <FaXTwitter size={15} />,
                hoverBg: '#000000',
              },
            ].map((red) => (
              <a
                key={red.title}
                href={red.href}
                target="_blank"
                rel="noopener noreferrer"
                title={red.title}
                style={{
                  color: '#fcd3d3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.backgroundColor = red.hoverBg
                  e.currentTarget.style.transform = 'scale(1.15)'
                  e.currentTarget.style.border = `1px solid ${red.hoverBg}`
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#fcd3d3'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {red.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}