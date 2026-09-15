import { getConsent, onConsentChange } from './consent'

/**
 * Tags de análise e anúncio (Google Analytics 4, Google Ads, Meta Pixel, Google Tag Manager).
 * Regras: nada carrega sem consentimento "granted" e sem o ID correspondente no .env (VITE_GA4_ID, VITE_GADS_ID,
 * VITE_META_PIXEL_ID, VITE_GTM_ID). O Consent Mode v2 do Google nasce negado e é atualizado no aceite.
 * Eventos do site passam por `track()` e chegam com os mesmos nomes no GA4, no Ads (via gtag) e no Meta.
 */
const env = import.meta.env as Record<string, string | undefined>
export const trackingIds = {
  ga4: env.VITE_GA4_ID ?? '',
  ads: env.VITE_GADS_ID ?? '',
  meta: env.VITE_META_PIXEL_ID ?? '',
  gtm: env.VITE_GTM_ID ?? '',
}

type Params = Record<string, string | number | boolean>
type W = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean } }

const META_EVENTS: Record<string, string> = { lead: 'Lead', begin_checkout: 'InitiateCheckout', sign_up: 'CompleteRegistration', view_promotion: 'ViewContent' }
let loaded = false

function script(src: string): void {
  const el = document.createElement('script')
  el.async = true; el.src = src
  document.head.appendChild(el)
}

/** Consent Mode v2: chamado antes de qualquer tag, com tudo negado. */
export function initConsentMode(): void {
  const w = window as W
  w.dataLayer = w.dataLayer || []
  w.gtag = w.gtag || function gtag() { w.dataLayer!.push(arguments) }
  const state = getConsent() === 'granted' ? 'granted' : 'denied'
  w.gtag('consent', 'default', { ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state, wait_for_update: 500 })
}

/** Carrega as tags configuradas. Só faz algo com consentimento e IDs; é seguro chamar mais de uma vez. */
export function loadTags(): boolean {
  if (loaded || getConsent() !== 'granted' || typeof document === 'undefined') return loaded
  const w = window as W
  const { ga4, ads, meta, gtm } = trackingIds
  if (!ga4 && !ads && !meta && !gtm) return false
  loaded = true
  w.gtag?.('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' })
  if (gtm) {
    w.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    script(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtm)}`)
  }
  if (ga4 || ads) {
    script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4 || ads)}`)
    w.gtag!('js', new Date())
    if (ga4) w.gtag!('config', ga4, { anonymize_ip: true })
    if (ads) w.gtag!('config', ads, { allow_enhanced_conversions: true })
  }
  if (meta && !w.fbq) {
    const queue: unknown[] = []
    w.fbq = Object.assign((...args: unknown[]) => { queue.push(args) }, { queue, loaded: true })
    script('https://connect.facebook.net/en_US/fbevents.js')
    w.fbq('init', meta)
    w.fbq('track', 'PageView')
  }
  return true
}

/** Liga o carregamento ao consentimento: carrega agora se já aceito e quando aceitar depois. */
export function startTracking(): void {
  initConsentMode()
  loadTags()
  onConsentChange((value) => { if (value === 'granted') loadTags() })
}

/**
 * Evento do site. Nomes: `lead` (formulários; params.source = origem), `sign_up` (newsletter), `begin_checkout` (comprar
 * no Blueprint), `view_promotion` (pop-up aberto). Sem tags carregadas, só entra no dataLayer (memória local).
 */
export function track(event: string, params: Params = {}): void {
  const w = window as W
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event, ...params })
  if (!loaded) return
  w.gtag?.('event', event, params)
  const metaName = META_EVENTS[event]
  if (w.fbq) { if (metaName) w.fbq('track', metaName, params); else w.fbq('trackCustom', event, params) }
}

/** Só para testes. */
export function _resetTracking(): void { loaded = false }
