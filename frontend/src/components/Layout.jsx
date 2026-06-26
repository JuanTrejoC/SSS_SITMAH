import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ThemeToggle from './ThemeToggle'
import { useState, useEffect } from 'react'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      // En desktop (≥768px): sidebar siempre visible (ocupa espacio en flex)
      // En mobile (<768px): sidebar como drawer (position:fixed, no ocupa espacio)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>

      {/* Overlay oscuro — solo mobile, al abrir el sidebar */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar: en mobile es fixed (no ocupa espacio), en desktop ocupa su ancho */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Columna principal: siempre ocupa el espacio disponible */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        /* min-width:0 es clave para que flex no desborde */
        minWidth: 0,
        overflow: 'hidden',
      }}>
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="main-content-padding" style={{ flex: 1, overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>

      <ThemeToggle />
    </div>
  )
}