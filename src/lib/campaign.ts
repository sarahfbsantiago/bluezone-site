/**
 * Origem da visita para a planilha de leads: parâmetros utm_* e os cliques de anúncio (gclid = Google, fbclid = Meta).
 * Não usa cookie nem terceiros: lê a URL na chegada e guarda na sessão; o primeiro toque fica também por 30 dias.
 */
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'] as const
const SESSION_KEY = 'bluezone-campaign'
const FIRST_KEY = 'bluezone-campaign-first'
const FIRST_TTL_MS = 30 * 24 * 60 * 60 * 1000

type Stored = { at: number; params: Record<string, string> }

function read(storage: Storage, key: string): Stored | null {
  try { const raw = storage.getItem(key); return raw ? (JSON.parse(raw) as Stored) : null } catch { return null }
}
function write(storage: Storage, key: string, value: Stored): void {
  try { storage.setItem(key, JSON.stringify(value)) } catch { /* sem armazenamento */ }
}

/** Lê a URL atual e guarda o que encontrar. Chamar uma vez ao carregar cada página. */
export function captureCampaign(search = window.location.search, now = Date.now()): Record<string, string> {
  const params = new URLSearchParams(search)
  const found: Record<string, string> = {}
  for (const key of KEYS) { const value = params.get(key); if (value) found[key] = value.slice(0, 120) }
  if (Object.keys(found).length) {
    write(window.sessionStorage, SESSION_KEY, { at: now, params: found })
    const first = read(window.localStorage, FIRST_KEY)
    if (!first || now - first.at > FIRST_TTL_MS) write(window.localStorage, FIRST_KEY, { at: now, params: found })
  }
  return found
}

/** Resumo em uma linha para a coluna "campanha" da planilha; vazio quando a visita foi direta. */
export function campaignSummary(now = Date.now()): string {
  const session = read(window.sessionStorage, SESSION_KEY)
  const first = read(window.localStorage, FIRST_KEY)
  const current = session?.params ?? (first && now - first.at <= FIRST_TTL_MS ? first.params : null)
  if (!current) return ''
  const parts = Object.entries(current).map(([key, value]) => `${key.replace('utm_', '')}=${value}`)
  if (!session && first) parts.push('primeiro-toque')
  return parts.join('; ').slice(0, 300)
}
