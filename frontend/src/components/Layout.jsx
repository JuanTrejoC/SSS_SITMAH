import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div style={{display:'flex', minHeight:'100vh', backgroundColor:'#f8fafc'}}>
      {/* ✅ SIDEBAR SIEMPRE VISIBLE */}
      <Sidebar />
      
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        {/* ✅ NAVBAR SIEMPRE VISIBLE */}
        <Navbar />
        
        {/* ✅ AQUÍ SE CARGA LA PÁGINA SELECCIONADA */}
        <main style={{flex:1, padding:'1.5rem'}}>
          <Outlet />
        </main>
      </div>

      <ThemeToggle />
    </div>
  )
}