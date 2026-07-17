import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { FaExclamationCircle, FaCheckCircle, FaLock, FaUser } from 'react-icons/fa'
import logoSitmah from '../assets/logo.png'

export default function Login() {
  const { user, loginAdmin } = useAuth()
  const [datos, setDatos] = useState({ usuario: '', contrasena: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState({ usuario: false, contrasena: false })

  if (user) return <Navigate to="/dashboard" replace />

  const manejarCambio = (e) => {
    const { name, value } = e.target
    setDatos({ ...datos, [name]: value })
    if (name === 'usuario') setErrores((prev) => ({ ...prev, usuario: value.length > 0 && value.length < 3 }))
    if (name === 'contrasena') setErrores((prev) => ({ ...prev, contrasena: value.length > 0 && value.length < 4 }))
  }

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const res = await loginAdmin(datos)
    setCargando(false)
    if (res.ok) window.location.href = '/dashboard'
    else setError(res.error || 'Credenciales incorrectas')
  }

  const inputStyle = (campo) => ({
    width: '100%',
    padding: '0.7rem 0.75rem 0.7rem 2.5rem',
    border: `1.5px solid ${errores[campo] ? '#ef4444' : datos[campo] && !errores[campo] ? '#22c55e' : '#e2e8f0'}`,
    borderRadius: '10px',
    fontSize: '0.92rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: 'white',
    boxShadow: errores[campo] ? '0 0 0 3px rgba(239,68,68,0.08)' : datos[campo] && !errores[campo] ? '0 0 0 3px rgba(34,197,94,0.08)' : 'none',
  })

  return (
    <>
      {/* Fondo con gradiente */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        padding: '1rem',
      }}>

        {/* Card de login */}
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(105,27,49,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>

          {/* Header con gradiente */}
          <div style={{
            background: 'linear-gradient(135deg, #691B31 0%, #4e1325 100%)',
            padding: 'clamp(1.5rem, 5vw, 2.25rem)',
            textAlign: 'center',
          }}>
            <a
              href="https://s-transportemetropolitano.hidalgo.gob.mx/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer', display: 'inline-block', textDecoration: 'none' }}
            >
              <img
                src={logoSitmah}
                alt="SITMAH Logo"
                style={{
                  maxWidth: 'clamp(140px, 60%, 200px)',
                  maxHeight: '70px',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  marginBottom: '0.85rem',
                }}
              />
            </a>
            <h1 style={{
              color: 'white',
              fontSize: 'clamp(1.1rem, 3vw, 1.35rem)',
              fontWeight: '700',
              margin: '0 0 0.25rem',
            }}>
              Acceso Administrador
            </h1>
            <p style={{ color: 'rgba(252,211,211,0.85)', fontSize: '0.82rem', margin: 0 }}>
              SISTEMA DE SOLICITUD DE SERVICIO SITMAH
            </p>
          </div>

          {/* Formulario */}
          <div style={{ padding: 'clamp(1.5rem, 5vw, 2rem)' }}>
            <form onSubmit={enviar} noValidate>

              {/* Campo usuario */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                  Usuario
                </label>
                <div style={{ position: 'relative' }}>
                  <FaUser
                    size={13}
                    color="#9ca3af"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    name="usuario"
                    value={datos.usuario}
                    onChange={manejarCambio}
                    placeholder="Ingresa tu usuario"
                    required
                    autoComplete="username"
                    style={inputStyle('usuario')}
                    onFocus={(e) => { if (!errores.usuario) e.target.style.borderColor = '#691B31'; e.target.style.boxShadow = '0 0 0 3px rgba(105,27,49,0.1)' }}
                    onBlur={(e) => { if (!errores.usuario && !datos.usuario) e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                  />
                  {datos.usuario && (
                    errores.usuario
                      ? <FaExclamationCircle color="#ef4444" size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                      : <FaCheckCircle color="#22c55e" size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
                {errores.usuario && <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Mínimo 3 caracteres</small>}
              </div>

              {/* Campo contraseña */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <FaLock
                    size={13}
                    color="#9ca3af"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type="password"
                    name="contrasena"
                    value={datos.contrasena}
                    onChange={manejarCambio}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={inputStyle('contrasena')}
                    onFocus={(e) => { if (!errores.contrasena) e.target.style.borderColor = '#691B31'; e.target.style.boxShadow = '0 0 0 3px rgba(105,27,49,0.1)' }}
                    onBlur={(e) => { if (!errores.contrasena && !datos.contrasena) e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                  />
                  {datos.contrasena && (
                    errores.contrasena
                      ? <FaExclamationCircle color="#ef4444" size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                      : <FaCheckCircle color="#22c55e" size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
                {errores.contrasena && <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Mínimo 4 caracteres</small>}
              </div>

              {/* Error de autenticación */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <FaExclamationCircle size={14} />
                  {error}
                </div>
              )}

              {/* Botón submit */}
              <button
                type="submit"
                disabled={cargando}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: cargando
                    ? '#9ca3af'
                    : '#691B31',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s, transform 0.15s',
                  letterSpacing: '0.3px',
                }}
                onMouseOver={(e) => { if (!cargando) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {cargando ? 'Verificando...' : 'Ingresar al Sistema'}
              </button>
            </form>
          </div>

          {/* Enlaces a formularios públicos */}
          <div style={{
            padding: '1.2rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.8rem 0', fontWeight: '500' }}>
              ¿Deseas registrar una incidencia?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="/crear-oficinas"
                style={{ color: '#BC955B', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', padding: '0.3rem 0.5rem' }}
              >
                Reporte de Oficinas
              </a>
              <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }}>|</span>
              <a
                href="/crear-semaforos"
                style={{ color: '#BC955B', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', padding: '0.3rem 0.5rem' }}
              >
                Reporte de Semáforos
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: '1.5rem',
          fontSize: 'clamp(0.72rem, 1.8vw, 0.8rem)',
          color: '#9ca3af',
          textAlign: 'center',
        }}>
          © {new Date().getFullYear()} SITMAH — Sistema de Transporte Metropolitano de Hidalgo
        </p>
      </div>

      <ThemeToggle />
    </>
  )
}