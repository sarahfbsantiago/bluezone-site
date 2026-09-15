/**
 * Consentimento de cookies (LGPD). Guardado no navegador em `bluezone-consent-v1`: "granted" ou "denied".
 * Sem registro = a pessoa ainda não escolheu (banner aparece). Só com "granted" as tags de análise e anúncio carregam.
 * Toda leitura/escrita é protegida: navegação privada ou armazenamento bloqueado não podem quebrar a página.
 */
export type Consent = 'granted' | 'denied'
export const CONSENT_KEY = 'bluezone-consent-v1'
export const POLICY_VERSION = 'v1 (15/09/2026)'

const listeners = new Set<(value: Consent | null) => void>()

export function getConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch { return null }
}

export function setConsent(value: Consent): void {
  try { window.localStorage.setItem(CONSENT_KEY, value) } catch { /* sem armazenamento: vale só nesta página */ }
  listeners.forEach((listener) => listener(value))
}

/** Apaga a escolha para o banner voltar (link "cookies" no footer). */
export function resetConsent(): void {
  try { window.localStorage.removeItem(CONSENT_KEY) } catch { /* idem */ }
  listeners.forEach((listener) => listener(null))
}

export function onConsentChange(listener: (value: Consent | null) => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
