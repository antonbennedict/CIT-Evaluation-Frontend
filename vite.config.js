import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Fixed the name here!

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This is the "Magic Fix" for using 'Buffer' in Vite/Browser
    global: 'window', 
  },
})