import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { primePlugin } from './src/server/prime-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), primePlugin()],
  base: '/prime/',
})
