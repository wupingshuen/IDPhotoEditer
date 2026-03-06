import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/guide/static-deploy.html#github-pages
// Use './' so assets load correctly on GitHub Pages (username.github.io/REPO_NAME/)
export default defineConfig({
  base: './',
  plugins: [react()],
})
