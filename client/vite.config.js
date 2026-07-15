import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const normalizedId = id.replaceAll('\\', '/')
          const packagePath = normalizedId.split('/node_modules/')[1] || ''
          const packageName = packagePath.startsWith('@')
            ? packagePath.split('/').slice(0, 2).join('/')
            : packagePath.split('/')[0]

          if (['react', 'react-dom', 'react-router', 'react-router-dom'].includes(packageName)) {
            return 'react-vendor'
          }
          if (packageName === '@iconify/react') return 'iconify-vendor'
          if (['react-hook-form', '@hookform/resolvers', 'zod'].includes(packageName)) {
            return 'forms-vendor'
          }
          if (['axios', 'react-toastify', 'html-to-image', 'qrcode'].includes(packageName)) {
            return 'app-vendor'
          }
          return 'vendor'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
