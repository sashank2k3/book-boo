import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react-pdf'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-vendor': ['react-pdf', 'pdfjs-dist'],
          'supabase': ['@supabase/supabase-js'],
          'router': ['react-router-dom'],
        },
      },
    },
  },
})
