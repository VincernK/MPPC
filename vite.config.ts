import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works both opened directly from disk
  // (file://) and when uploaded to any subdirectory on a static host.
  base: './',
})
