import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: resolve(process.cwd(), 'node_modules/react'),
      'react-dom': resolve(process.cwd(), 'node_modules/react-dom'),
    },
  },
  server: {
    host: true, // Listen on all addresses including network
    port: 5173,
    allowedHosts: ['chatgist.online', 'www.chatgist.online', 'dbgist.com', 'www.dbgist.com', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/plots': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
