import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FaTools, FaSignOutAlt, FaCog, FaTachometerAlt, FaCheckSquare, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa'

export default function Navbar() {
  const { user, loginAdmin, logout } = useAuth()
  const navegar = useNavigate()
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [datosLogin, setDatosLogin] = useState({ usuario: '', contrasena: '' })
  const [errores, setErrores] = useState({ usuario: false, contrasena: false }) // 🔴 Para marcar errores

  // ✅ CIERRE DE SESIÓN: RETORNA AL INICIO PÚBLICO
  const salir = () => {
    logout()
    setMenuPerfilAbierto(false)
    navegar('/')
  }

  // ✅ VALIDACIÓN AL ESCRIBIR: CAMBIA COLOR ROJO/VERDE
  const manejarCambio = (e) => {
    const { name, value } = e.target
    setDatosLogin({ ...datosLogin, [name]: value })

    // Reglas de validación simples
    if (name === 'usuario') {
      setErrores({ ...errores, usuario: value.length < 3 }) // Menos de 3 caracteres = ERROR 🔴
    }
    if (name === 'contrasena') {
      setErrores({ ...errores, contrasena: value.length < 4 }) // Menos de 4 caracteres = ERROR 🔴
    }
  }

  // ✅ VALIDACIÓN AL ENTRAR: VERIFICA QUE SEA ADMIN CORRECTO
  const entrarAdmin = async (e) => {
    e.preventDefault()

    // Si hay errores o campos vacíos, NO ENTRA
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
      height: '85px',
      backgroundColor: 'white',
      borderBottom: '1px solid #6F7271',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#691B31', margin: 0 }}>
        Sistema de Solicitud de Servicio  SITMAH
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>

        {/* Botón Acceso Administrador */}
        {!user && (
          <button
            onClick={() => setMostrarLogin(!mostrarLogin)}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: '#691B31',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#BC955B'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#691B31'}
          >
            Acceso Administrador
          </button>
        )}

        {/* ✅ FORMULARIO LOGIN CON VALIDACIÓN ROJO/VERDE */}
        {mostrarLogin && (
          <div style={{
            position: 'absolute',
            top: '55px',
            right: '80px',
            backgroundColor: 'white',
            padding: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            width: '240px',
            zIndex: 999
          }}>
            <form onSubmit={entrarAdmin}>

              {/* CAMPO USUARIO */}
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#666' }}>Usuario:</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="usuario"
                    value={datosLogin.usuario}
                    onChange={manejarCambio}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.5rem 0.5rem 2rem',
                      border: `1px solid ${errores.usuario && datosLogin.usuario ? '#ef4444' : datosLogin.usuario ? '#22c55e' : '#ccc'}`,
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  {/* ÍCONO ROJO/VERDE */}
                  {datosLogin.usuario && (
                    errores.usuario
                      ? <FaExclamationCircle color="#ef4444" size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                      : <FaCheckCircle color="#22c55e" size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
                {errores.usuario && datosLogin.usuario && <small style={{ color: '#ef4444' }}>Mínimo 3 caracteres</small>}
              </div>

              {/* CAMPO CONTRASEÑA */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#666' }}>Contraseña:</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    name="contrasena"
                    value={datosLogin.contrasena}
                    onChange={manejarCambio}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.5rem 0.5rem 2rem',
                      border: `1px solid ${errores.contrasena && datosLogin.contrasena ? '#ef4444' : datosLogin.contrasena ? '#22c55e' : '#ccc'}`,
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  {/* ÍCONO ROJO/VERDE */}
                  {datosLogin.contrasena && (
                    errores.contrasena
                      ? <FaExclamationCircle color="#ef4444" size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                      : <FaCheckCircle color="#22c55e" size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
                {errores.contrasena && datosLogin.contrasena && <small style={{ color: '#ef4444' }}>Mínimo 4 caracteres</small>}
              </div>

              {/* Botón Ingresar DORADO */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#BC955B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#a07238'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#BC955B'}
              >
                Ingresar
              </button>
            </form>
          </div>
        )}

        {/* ✅ MENÚ DE PERFIL - ESTRUCTURA FINAL */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
          >
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500', color: '#000000' }}>
                {user ? user.nombre : 'Usuario General'}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6F7271', textTransform: 'capitalize' }}>
                {user ? user.rol : 'Solicitante'}
              </p>
            </div>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#691B31',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'transform 0.2s'
            }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.08)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              {user ? user.nombre.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>

          {/* ✅ MENÚ DESPLEGABLE */}
          {menuPerfilAbierto && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgb(0, 0, 0)',
              borderRadius: '8px',
              width: '180px',
              padding: '0.5rem 0',
              zIndex: 999
            }}>

              {/* ✅ OPCIONES SOLO PARA SOLICITANTE */}
              {!user || user.rol === 'solicitante' ? (
                <>

                  <button
                    onClick={salir}
                    style={{
                      width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: '#dc2626',
                      display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <FaSignOutAlt size={14} /> Cerrar Sesión
                  </button>
                </>
              ) : null}

              {/* ✅ OPCIONES SOLO PARA ADMINISTRADOR - CON VALIDACIÓN */}
              {user && user.rol === 'administrador' ? (
                <>


                  <button
                    onClick={() => { navegar('/configuracion'); setMenuPerfilAbierto(false) }}
                    style={{
                      width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: '#f8fafc',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: '#691B31',
                      display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '500', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#691B31'
                      e.target.style.color = 'white'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#f8fafc'
                      e.target.style.color = '#691B31'
                    }}
                  >
                    <FaCog size={14} /> Configuración
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#6F7271', margin: '0.3rem 0' }}></div>

                  <button
                    onClick={salir}
                    style={{
                      width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: '#dc2626',
                      display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <FaSignOutAlt size={14} /> Cerrar Sesión
                  </button>
                </>
              ) : null}

            </div>
          )}
        </div>

      </div>
    </nav>
  )
}