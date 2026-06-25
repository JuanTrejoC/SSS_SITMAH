import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sitmah/' // ✅ Tu ruta original, tal cual la tenías
})