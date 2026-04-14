import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/auth': {
        target: 'http://keycloak:8080',
        changeOrigin: false,
        headers: {
          Host: 'localhost:8080'
        },
        rewrite: (path) => path.replace(/^\/auth/, '')
      }
    }
  }
})
