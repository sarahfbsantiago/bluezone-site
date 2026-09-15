import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { seoFiles } from './seo/seo-files'

/** Build do painel (painel.abluezone.com.br / bluezone-painel.web.app): só a área administrativa, em site separado do público. */
export default defineConfig({
  root: resolve(__dirname, 'painel'),
  publicDir: resolve(__dirname, 'public'),
  envDir: __dirname,
  plugins: [react(), seoFiles({ disallow: true })],
  build: { outDir: resolve(__dirname, 'dist-painel'), emptyOutDir: true },
})
