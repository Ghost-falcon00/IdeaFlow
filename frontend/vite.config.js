import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // اجازه می‌ده به همه interfaces وصل بشن
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'b499a46b37502b.lhr.life' // هاست تونل
    ],
  },
})
