import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto ya lo tenías (o se activa con --host)
    allowedHosts: true // <--- AGREGA ESTA LÍNEA (Permite cualquier dominio)
  } 
})
