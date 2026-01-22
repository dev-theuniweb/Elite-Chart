import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'https://ge.iiifleche.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/balance-api': {
        target: 'https://api.iiifleche.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/balance-api/, '')
      }
    }
  }
})
