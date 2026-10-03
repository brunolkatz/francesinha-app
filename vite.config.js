import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths, so the build works under any GitHub Pages
  // repo path (user.github.io/<repo>/) as well as at a domain root.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 8888,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 8888,
  },
})
