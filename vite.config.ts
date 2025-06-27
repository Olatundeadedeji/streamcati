import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix Leaflet default export issue
      'leaflet': 'leaflet/dist/leaflet.js'
    },
  },
  optimizeDeps: {
    include: ['enketo-core', 'leaflet'],
    exclude: ['leaflet.gridlayer.googlemutant']
  },
  define: {
    global: 'globalThis',
  },
  assetsInclude: ['**/*.xml'],
  server: {
    fs: {
      allow: ['..']
    }
  }
})
