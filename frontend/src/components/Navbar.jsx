import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FaSignOutAlt, FaCog, FaExclamationCircle, FaCheckCircle, FaBars, FaLock } from 'react-icons/fa'

export default function Navbar({ toggleSidebar }) {
  const { user, loginAdmin, logout } = useAuth()
  const navegar = useNavigate()
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [datosLogin, setDatosLogin] = useState({ usuario: '', contrasena: '' })
  const [errores, setErrores] = useState({ usuario: false, contrasena: false })

  const salir = () => {
    logout()
    setMenuPerfilAbierto(false)
    navegar('/')
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target
    setDatosLogin({ ...datosLogin, [name]: value })
    if (name === 'usuario') setErrores({ ...errores, usuario: value.length < 3 })
    if (name === 'contrasena') setErrores({ ...errores, contrasena: value.length < 4 })
  }

  const entrarAdmin = async (e) => {
    e.preventDefault()
    if (errores.usuario || errores.contrasena || !datosLogin.usuario || !datosLogin.contrasena) {
      alert('❌ Corrige los campos marcados en rojo')
      return
    }
    const res = await loginAdmin(datosLogin)
    if (res.ok) {
      setMostrarLogin(false)
      navegar('/dashboard')
    } else {
      alert(`❌ ${res.error}`)
    }
  }

  return (
    <nav style={{
      height: 'clamp(62px, 10vw, 85px)',
      backgroundColor: 'white',
      borderBottom: '1px solid #e8ecef',
      padding: '0 clamp(0.85rem, 3vw, 2rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      gap: '0.5rem',
    }}>

      {/* IZQUIERDA: Hamburger + Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Abrir menú">
          <FaBars />
        </button>
        <h2 className="sitmah-title text-truncate" style={{ margin: 0 }}>
          <span className="sitmah-title-full">SISTEMA DE SOLICITUD DE SERVICIO SITMAH</span>
          <span className="sitmah-title-short">SITMAH</span>
        </h2>
      </div>

      {/* DERECHA: Botón Admin + Perfil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', flexShrink: 0 }}>

        {/* Botón Acceso Administrador */}
        {!user && (
          <button
            onClick={() => setMostrarLogin(!mostrarLogin)}
            style={{
              padding: 'clamp(0.35rem, 1.5vw, 0.45rem) clamp(0.6rem, 2vw, 1rem)',
              backgroundColor: '#691B31',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'clamp(0.72rem, 1.8vw, 0.82rem)',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              fontWeight: '500',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#BC955B'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#691B31'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <FaLock size={11} />
            <span className="navbar-admin-btn-text">Acceso Administrador</span>
          </button>
        )}

        {/* Formulario Login Dropdown */}
        {mostrarLogin && (
          <>
            {/* Backdrop para cerrar */}
            <div
              onClick={() => setMostrarLogin(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              backgroundColor: 'white',
              padding: '1.25rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              borderRadius: '12px',
              width: 'clamp(220px, 90vw, 260px)',
              zIndex: 999,
              border: '1px solid #e8ecef',
            }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#691B31', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Acceso Administrador
              </p>
              <form onSubmit={entrarAdmin}>
                {/* CAMPO USUARIO */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#555', display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Usuario</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="usuario"
                      value={datosLogin.usuario}
                      onChange={manejarCambio}
                      placeholder="Ingresa tu usuario"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.5rem 0.5rem 2rem',
                        border: `1.5px solid ${errores.usuario && datosLogin.usuario ? '#ef4444' : datosLogin.usuario ? '#22c55e' : '#d1d5db'}`,
                        borderRadius: '7px',
                        fontSize: '0.82rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
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

                {/* CAMPO CONTRASEÑA */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#555', display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      name="contrasena"
                      value={datosLogin.contrasena}
                      onChange={manejarCambio}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.5rem 0.5rem 2rem',
                        border: `1.5px solid ${errores.contrasena && datosLogin.contrasena ? '#ef4444' : datosLogin.contrasena ? '#22c55e' : '#d1d5db'}`,
                        borderRadius: '7px',
                        fontSize: '0.82rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
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

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'linear-gradient(135deg, #BC955B 0%, #a07238 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.88'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Ingresar
                </button>
              </form>
            </div>
          </>
        )}

        {/* Menú de Perfil */}
        {user && (
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            >
              {/* Nombre y rol — ocultos en mobile */}
              <div className="navbar-user-info" style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 'clamp(0.78rem, 1.8vw, 0.88rem)', fontWeight: '600', color: '#1a1a1a' }}>
                  {user.nombre}
                </p>
                <p style={{ margin: 0, fontSize: 'clamp(0.68rem, 1.5vw, 0.75rem)', color: '#6F7271', textTransform: 'capitalize' }}>
                  {user.rol}
                </p>
              </div>

              {/* Avatar circular */}
              <div style={{
                width: 'clamp(32px, 5vw, 38px)',
                height: 'clamp(32px, 5vw, 38px)',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #691B31 0%, #BC955B 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                boxShadow: '0 2px 8px rgba(105,27,49,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                flexShrink: 0,
              }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(105,27,49,0.4)' }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(105,27,49,0.3)' }}
              >
                {user.nombre.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Menú desplegable */}
            {menuPerfilAbierto && (
              <>
                <div onClick={() => setMenuPerfilAbierto(false)} style={{ position: 'fixed', inset: 0, zIndex: 997 }} />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  backgroundColor: 'white',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  borderRadius: '12px',
                  minWidth: '180px',
                  padding: '0.4rem 0',
                  zIndex: 998,
                  border: '1px solid #e8ecef',
                  overflow: 'hidden',
                }}>
                  {/* Info de usuario visible en mobile */}
                  <div className="only-mobile" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600', color: '#1a1a1a' }}>
                      {user.nombre}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6F7271', textTransform: 'capitalize' }}>
                      {user.rol}
                    </p>
                  </div>

                  {/* Opciones del solicitante */}
                  {user.rol === 'solicitante' && (
                    <button
                      onClick={salir}
                      style={{
                        width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent',
                        textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', color: '#dc2626',
                        display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FaSignOutAlt size={13} /> Cerrar Sesión
                    </button>
                  )}

                  {/* Opciones del administrador */}
                  {user.rol === 'administrador' && (
                    <>
                      <button
                        onClick={() => { navegar('/configuracion'); setMenuPerfilAbierto(false) }}
                        style={{
                          width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent',
                          textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', color: '#374151',
                          display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '500', transition: 'background 0.15s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <FaCog size={13} /> Configuración
                      </button>
                      <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '0.2rem 0' }} />
                      <button
                        onClick={salir}
                        style={{
                          width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent',
                          textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', color: '#dc2626',
                          display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.15s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <FaSignOutAlt size={13} /> Cerrar Sesión
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}