import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header/Header'
import ThemeToggle from './ThemeToggle'
import { useState, useEffect } from 'react'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>

      {/* Overlay oscuro */}
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
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="main-content-padding" style={{ flex: 1, overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>

      <ThemeToggle />
    </div>
  )
}