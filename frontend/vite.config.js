import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    ...(process.env.BACKEND_URL ? { proxy: { '/api': process.env.BACKEND_URL } } : {})
  }
})
