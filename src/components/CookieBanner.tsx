import { useEffect, useState } from 'react'
import { getConsent, onConsentChange, setConsent, type Consent } from '../lib/consent'
import { withBase } from '../lib/paths'

/**
 * Banner de cookies (LGPD): aparece até a pessoa aceitar ou recusar. Recusar mantém o site inteiro funcionando,
 * só não carrega análise nem anúncio. O link "cookies" do footer chama `resetConsent()` para o banner voltar.
 */
export function CookieBanner() {
  const [consent, setState] = useState<Consent | null | 'unknown'>('unknown')
  useEffect(() => { setState(getConsent()); return onConsentChange((value) => setState(value)) }, [])
  if (consent !== null) return null
  return (
    <aside className="cookie-banner" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-text" data-testid="cookie-banner">
      <p id="cookie-title" className="cookie-title">cookies</p>
      <p id="cookie-text" className="cookie-text">
        Usamos cookies só para medir visitas e mostrar anúncios relevantes. Sem eles, o site funciona do mesmo jeito.{' '}
        <a href={withBase('/privacidade')}>política de privacidade</a>
      </p>
      <div className="cookie-actions">
        <button type="button" className="contact-submit cookie-accept" onClick={() => setConsent('granted')}>aceitar</button>
        <button type="button" className="cookie-decline" onClick={() => setConsent('denied')}>recusar</button>
      </div>
    </aside>
  )
}
