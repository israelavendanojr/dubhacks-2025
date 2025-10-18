import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'mapbox-gl': 'mapbox-gl'
    }
  },
  optimizeDeps: {
    include: ['mapbox-gl', 'react-map-gl/mapbox']
  }
})
