import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaExclamationCircle, FaCheckCircle, FaBars, FaLock } from 'react-icons/fa';
import './Header.css';

export default function Header({ toggleSidebar, hideLogos, hideBackButton = false }) {
  const { user, loginAdmin, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
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
      alert('❌ Corrige los campos marcados en rojo');
      return;
    }
    const res = await loginAdmin(datosLogin);
    if (res.ok) {
      setMostrarLogin(false);
      navigate('/dashboard');
    } else {
      alert(`❌ ${res.error}`);
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

        <div className="app-header__right" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          
          {!user && (
            <div ref={loginRef}>
              <button
                onClick={() => setMostrarLogin(!mostrarLogin)}
                className="header-admin-login-btn"
              >
                <FaLock size={13} style={{ color: '#BC955B' }} />
                <span className="header-admin-btn-text">Acceso Administrador</span>
              </button>

              {mostrarLogin && (
                <div className="header-login-dropdown">
                  <p className="header-login-title">Acceso Administrador</p>
                  <form onSubmit={entrarAdmin}>
                    <div style={{ marginBottom: '0.85rem' }}>
                      <label className="header-login-label">Usuario</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          name="usuario"
                          value={datosLogin.usuario}
                          onChange={manejarCambio}
                          placeholder="Ingresa tu usuario"
                          className="header-login-input"
                          style={{
                            borderColor: errores.usuario && datosLogin.usuario ? '#ef4444' : datosLogin.usuario ? '#22c55e' : '#d1d5db'
                          }}
                        />
                        {datosLogin.usuario && (
                          errores.usuario
                            ? <FaExclamationCircle color="#ef4444" size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)' }} />
                            : <FaCheckCircle color="#22c55e" size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)' }} />
                        )}
                      </div>
                      {errores.usuario && datosLogin.usuario && <small style={{ color: '#ef4444', fontSize: '0.72rem' }}>Mínimo 3 caracteres</small>}
                    </div>

                    <div style={{ marginBottom: '1.1rem' }}>
                      <label className="header-login-label">Contraseña</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="password"
                          name="contrasena"
                          value={datosLogin.contrasena}
                          onChange={manejarCambio}
                          placeholder="••••••••"
                          className="header-login-input"
                          style={{
                            borderColor: errores.contrasena && datosLogin.contrasena ? '#ef4444' : datosLogin.contrasena ? '#22c55e' : '#d1d5db'
                          }}
                        />
                        {datosLogin.contrasena && (
                          errores.contrasena
                            ? <FaExclamationCircle color="#ef4444" size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)' }} />
                            : <FaCheckCircle color="#22c55e" size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)' }} />
                        )}
                      </div>
                      {errores.contrasena && datosLogin.contrasena && <small style={{ color: '#ef4444', fontSize: '0.72rem' }}>Mínimo 4 caracteres</small>}
                    </div>

                    <button type="submit" className="header-login-submit">
                      Ingresar
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {user && (
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
          )}
        </div>
        
      </div>
    </header>
  );
}