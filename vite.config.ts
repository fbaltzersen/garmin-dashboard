import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vendor code (react, recharts) changes far less often than app code -
        // splitting it out means a deploy that only touches app code doesn't
        // force browsers to re-download the ~180KB vendor chunk they already have.
        manualChunks(id: string) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts'
          if (id.includes('node_modules/react')) return 'vendor'
        },
      },
    },
  },
})
