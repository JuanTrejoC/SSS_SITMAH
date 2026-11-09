import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header/Header'
import ThemeToggle from './ThemeToggle'
import { useState, useEffect, Suspense } from 'react'
import CargandoPagina from './CargandoPagina'
import { FaWifi } from 'react-icons/fa'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          backgroundColor: '#b91c1c',
          color: '#ffffff',
          padding: '0.45rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          textAlign: 'center'
        }}>
          <FaWifi /> Sin conexión a internet. Revisa tu conexión de red o datos móviles.
        </div>
      )}

      {/* Overlay oscuro */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar: en mobile es fixed (no ocupa espacio), en desktop ocupa su ancho */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Columna principal: siempre ocupa el espacio disponible */}
      <div className="layout-main-col" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        paddingTop: '90px',
      }}>
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="main-content-padding" style={{ flex: 1 }}>
          <Suspense fallback={<CargandoPagina />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ThemeToggle />
    </div>
  )
}