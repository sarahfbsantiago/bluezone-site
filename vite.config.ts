import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/** Em desenvolvimento, /bluenews e /blueprint abrem os respectivos .html (em produção, o Firebase Hosting faz isso com cleanUrls). */
const CLEAN_PAGES = ['bluenews', 'blueprint']
function cleanUrls(): Plugin {
  return {
    name: 'bluezone-clean-urls',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        for (const page of CLEAN_PAGES) {
          if (req.url === `/${page}` || req.url === `/${page}/` || req.url?.startsWith(`/${page}?`)) req.url = `/${page}.html` + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')
        }
        next()
      })
    },
  }
}

export default defineConfig({
  // VITE_BASE=/bluezone-site/ no GitHub Pages; vazio = raiz (dev e Firebase)
  base: process.env.VITE_BASE || '/',
  plugins: [react(), cleanUrls()],
  build: { rollupOptions: { input: { main: resolve(__dirname, 'index.html'), bluenews: resolve(__dirname, 'bluenews.html'), blueprint: resolve(__dirname, 'blueprint.html') } } },
})
