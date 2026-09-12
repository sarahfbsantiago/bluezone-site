/**
 * Caminhos com a base do deploy. Em dev e no Firebase a base é "/"; no GitHub Pages é "/bluezone-site/".
 * Use em todo caminho absoluto escrito no código (fotos, logos, /bluenews, /blueprint, /#ancora).
 */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export function withBase(path: string): string {
  return path.startsWith('/') ? `${BASE}${path}` : path
}
