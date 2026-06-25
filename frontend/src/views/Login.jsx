import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { user, loginAdmin } = useAuth()
  const [datos, setDatos] = useState({ usuario: '', contrasena: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    const res = await loginAdmin(datos)
    if (res.ok) window.location.href = '/sitmah/dashboard'
    else setError(`❌ ${res.error}`)
  }

  return (
    <>
    <div style={{ maxWidth: '400px', margin: '5rem auto', padding: '2rem', background: '#fff', borderRadius: '10px', boxShadow: '0 0 10px #0000001a' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#691B31' }}> Acceso Administrador</h2>
      <form onSubmit={enviar}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Usuario:</label>
          <input type="text" value={datos.usuario} onChange={(e) => setDatos({ ...datos, usuario: e.target.value })} style={{ width: '100%', padding: '0.7rem', border: '1px solid #ccc', borderRadius: '6px', marginTop: '0.3rem' }} required />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label>Contraseña:</label>
          <input type="password" value={datos.contrasena} onChange={(e) => setDatos({ ...datos, contrasena: e.target.value })} style={{ width: '100%', padding: '0.7rem', border: '1px solid #ccc', borderRadius: '6px', marginTop: '0.3rem' }} required />
        </div>
        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#691B31', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem' }}>Ingresar</button>
      </form>
    </div>
    <ThemeToggle />
    </>
  )
}