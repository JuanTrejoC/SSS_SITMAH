import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaExclamationCircle, FaCheckCircle, FaBars, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import NotificationCenter from './NotificationCenter';
import './Header.css';

export default function Header({ toggleSidebar, hideLogos, hideBackButton = false }) {
  const { user, loginAdmin, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [datosLogin, setDatosLogin] = useState({ usuario: '', contrasena: '' });
  const [errores, setErrores] = useState({ usuario: false, contrasena: false });
  
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const loginRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setMostrarLogin(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleHomeClick = () => {
    if (!user) {
      navigate('/');
      return;
    }
    if (user.rol === 'administrador') {
      navigate('/dashboard');
    } else if (user.rol === 'infraestructura') {
      navigate('/dashboard-infraestructura');
    } else {
      navigate('/crear-oficinas');
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setDatosLogin({ ...datosLogin, [name]: value });
    if (name === 'usuario') setErrores({ ...errores, usuario: value.length < 3 });
    if (name === 'contrasena') setErrores({ ...errores, contrasena: value.length < 4 });
  };

  const entrarAdmin = async (e) => {
    e.preventDefault();
    if (errores.usuario || errores.contrasena || !datosLogin.usuario || !datosLogin.contrasena) {
      Swal.fire('Error', 'Corrige los campos marcados en rojo', 'error');
      return;
    }
    const res = await loginAdmin(datosLogin);
    if (res.ok) {
      setMostrarLogin(false);
      if (res.user?.rol === 'infraestructura') {
        navigate('/dashboard-infraestructura');
      } else {
        navigate('/dashboard');
      }
    } else {
      Swal.fire('Error', res.error, 'error');
    }
  };

  let showBackButton = false;
  if (!hideBackButton && user && location.pathname !== '/') {
    const isDashboard = location.pathname === '/dashboard';
    showBackButton = !isDashboard;
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        
        <div className="app-header__left">
          <button className="hamburger-btn header-hamburger" onClick={toggleSidebar} aria-label="Abrir menú" style={{ color: '#BC955B' }}>
            <FaBars size={26} />
          </button>

          {showBackButton && (
            <button
              type="button"
              className="app-header__back-btn"
              onClick={handleBackClick}
              title="Regresar"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {!hideLogos && (
            <button
              type="button"
              className="app-header__brand"
              onClick={handleHomeClick}
              aria-label="Ir al inicio"
              style={{ cursor: 'pointer', marginLeft: showBackButton ? '0' : '0.5rem' }}
            >
              <img
                src="/images/sistema de tm.webp"
                alt="Sistema de TM"
                className="app-header__brand-logo-1"
              />
            </button>
          )}
        </div>
        
        <div className="app-header__center">
          <button
            type="button"
            className="app-header__brand"
            onClick={handleHomeClick}
            aria-label="Ir al inicio"
            style={{ cursor: 'pointer' }}
          >
            <img
              src="/images/sitmah_logo.webp"
              alt="Logo SITMAH"
              className="app-header__brand-logo-2"
            />
          </button>
        </div>

        <div className="app-header__right">
          {!user && (
            <div ref={loginRef} style={{ position: 'relative' }}>
              <button
                onClick={() => navigate('/login')}
                className="header-admin-login-btn"
                title="Acceso Administrador"
                aria-label="Acceso Administrador"
              >
                <FaLock className="header-admin-lock-icon" />
                <span className="header-admin-btn-text">Acceso Administrador</span>
              </button>
            </div>
          )}

          {user && (
            <>
              {user.rol === 'administrador' && <NotificationCenter />}
              <div className="app-header__profile" ref={profileRef}>
              <button 
                className="app-header__profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-icon">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
              </button>

              {showProfileMenu && (
                <div className="app-header__profile-menu">
                  <div className="profile-info">
                    <span className="profile-name">{user.nombre}</span>
                    {user.username && <span className="profile-username">@{user.username}</span>}
                    <span className="profile-role" style={{ textTransform: 'capitalize' }}>{user.rol}</span>
                  </div>
                  <hr />
                  <button className="profile-menu-btn logout-btn" onClick={handleLogout}>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
            </>
          )}
        </div>
        
      </div>
    </header>
  );
}