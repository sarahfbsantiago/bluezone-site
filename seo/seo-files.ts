import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Gera robots.txt e sitemap.xml no build, conforme o destino:
 * - produção (VITE_ROBOTS=index,follow): robots libera tudo e aponta o sitemap; sitemap com lastmod do dia do build;
 * - teste, GitHub Pages e painel (qualquer outro valor, ou `disallow: true`): robots bloqueia tudo e não há sitemap.
 * Ficam fora de `public/` para não vazarem para o painel, que compartilha a mesma pasta pública.
 */
export function seoFiles(options: { disallow?: boolean } = {}): Plugin {
  return {
    name: 'bluezone-seo-files',
    generateBundle() {
      const prod = !options.disallow && (process.env.VITE_ROBOTS ?? 'index,follow') === 'index,follow'
      if (!prod) { this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nDisallow: /\n' }); return }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nAllow: /\n\nSitemap: https://abluezone.com.br/sitemap.xml\n' })
      const today = new Date().toISOString().slice(0, 10)
      const sitemap = readFileSync(resolve(__dirname, 'sitemap.xml'), 'utf8').replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`)
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
  }
}
