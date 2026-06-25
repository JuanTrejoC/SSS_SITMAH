import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FaTachometerAlt, FaFileAlt, FaRoad, FaClipboardList,
  FaChartBar, FaCog
} from 'react-icons/fa'
import { FaFacebook, FaXTwitter } from 'react-icons/fa6'
import logoSitmah from '../assets/logo.png'

export default function Sidebar() {
  const { user } = useAuth()
  const ubicacion = useLocation()
  const esActivo = (ruta) => ubicacion.pathname === ruta

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#691B31',
      color: 'white',
      minHeight: '100vh',
      padding: '0.5rem 1rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* LOGO */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        marginBottom: '2rem',
        padding: '0 0.5rem'
      }}>
        <a href="https://s-transportemetropolitano.hidalgo.gob.mx/" target="_blank" rel="noreferrer" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <img
            src={logoSitmah}
            alt="SITMAH Logo"
            style={{
              width: '100%',
              maxHeight: '75px',
              objectFit: 'contain',
              objectPosition: 'left',
              marginBottom: '0.8rem',
              filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))'
            }}
          />
        </a>
        {/* <div style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#BC955B',
          textAlign: 'center',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          SISTEMA SITMAH
        </div> */}
      </div>

      {/* SECCIÓN: GENERAL */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{
          fontSize: '0.75rem',
          color: '#fcd3d3',
          marginBottom: '0.8rem',
          textTransform: 'uppercase',
          padding: '0 0.8rem',
          fontWeight: '500'
        }}>
          General
        </p>

        {/* DASHBOARD - SOLO ADMIN */}
        {user?.rol === 'administrador' && (
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '0.4rem',
              borderRadius: '6px',
              backgroundColor: esActivo('/dashboard') ? '#BC955B' : 'transparent',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              if (!esActivo('/dashboard')) e.target.style.backgroundColor = '#BC955B'
            }}
            onMouseOut={(e) => {
              if (!esActivo('/dashboard')) e.target.style.backgroundColor = 'transparent'
            }}
          >
            <FaTachometerAlt size={16} />
            Dashboard
          </Link>
        )}

        {/* 🟢 SOLO SE MUESTRA A USUARIOS NORMALES: Crear Reporte Oficinas */}
        {user?.rol !== 'administrador' && (
          <Link
            to="/crear-oficinas"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '0.4rem',
              borderRadius: '6px',
              backgroundColor: esActivo('/crear-oficinas') ? '#BC955B' : 'transparent',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              if (!esActivo('/crear-oficinas')) e.target.style.backgroundColor = '#BC955B'
            }}
            onMouseOut={(e) => {
              if (!esActivo('/crear-oficinas')) e.target.style.backgroundColor = 'transparent'
            }}
          >
            <FaFileAlt size={16} />
            Crear Reporte Oficinas
          </Link>
        )}

        {/* 🟢 SOLO SE MUESTRA A USUARIOS NORMALES: Crear Reporte Semáforos */}
        {user?.rol !== 'administrador' && (
          <Link
            to="/crear-semaforos"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '0.4rem',
              borderRadius: '6px',
              backgroundColor: esActivo('/crear-semaforos') ? '#BC955B' : 'transparent',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              if (!esActivo('/crear-semaforos')) e.target.style.backgroundColor = '#BC955B'
            }}
            onMouseOut={(e) => {
              if (!esActivo('/crear-semaforos')) e.target.style.backgroundColor = 'transparent'
            }}
          >
            <FaRoad size={16} />
            Crear Reporte Semáforos
          </Link>
        )}

        {/* ❌ ELIMINADO: Mis Reportes (YA NO APARECE PARA NADIE) */}

      </div>

      {/* SECCIÓN: ADMINISTRACIÓN - SOLO ADMIN */}
      {user?.rol === 'administrador' && (
        <div>
          <p style={{
            fontSize: '0.75rem',
            color: '#fcd3d3',
            marginBottom: '0.8rem',
            textTransform: 'uppercase',
            padding: '0 0.8rem',
            fontWeight: '500'
          }}>
            Administración
          </p>

          {/* ESTADÍSTICAS */}
          <Link
            to="/estadisticas"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '0.4rem',
              borderRadius: '6px',
              backgroundColor: esActivo('/estadisticas') ? '#BC955B' : 'transparent',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              if (!esActivo('/estadisticas')) e.target.style.backgroundColor = '#BC955B'
            }}
            onMouseOut={(e) => {
              if (!esActivo('/estadisticas')) e.target.style.backgroundColor = 'transparent'
            }}
          >
            <FaChartBar size={16} />
            Estadísticas
          </Link>

          {/* CONFIGURACIÓN */}
          <Link
            to="/configuracion"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '0.4rem',
              borderRadius: '6px',
              backgroundColor: esActivo('/configuracion') ? '#BC955B' : 'transparent',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              if (!esActivo('/configuracion')) e.target.style.backgroundColor = '#BC955B'
            }}
            onMouseOut={(e) => {
              if (!esActivo('/configuracion')) e.target.style.backgroundColor = 'transparent'
            }}
          >
            <FaCog size={16} />
            Configuración
          </Link>
        </div>
      )}

      {/* REDES SOCIALES - SOLO PARA SOLICITANTE */}
      {user?.rol !== 'administrador' && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: '#fcd3d3',
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            Redes Sociales
          </span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a
              href="https://www.facebook.com/Sistemadetransportemetropolitano/about?locale=es_LA"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook"
              style={{
                color: '#fcd3d3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.backgroundColor = '#1877F2'
                e.currentTarget.style.transform = 'scale(1.15)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#fcd3d3'
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <FaFacebook size={18} />
            </a>
            <a
              href="https://x.com/STMHidalgo"
              target="_blank"
              rel="noopener noreferrer"
              title="X (Twitter)"
              style={{
                color: '#fcd3d3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.transform = 'scale(1.15)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#fcd3d3'
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <FaXTwitter size={16} />
            </a>
          </div>
        </div>
      )}
    </aside>
  )
}