import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'VR Protein Viewer',
        short_name: 'ProteinVR',
        description: 'Immersive 3D protein visualization for PC and Oculus Quest',
        theme_color: '#1a1a2e',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'any'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },
      injectRegister: 'auto'
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
