import { useEffect, type ReactNode } from 'react'
import { CookieBanner } from './CookieBanner'
import { captureCampaign } from '../lib/campaign'
import { startTracking } from '../lib/tracking'

/** Envolve cada página pública: guarda a origem da visita (utm/gclid/fbclid), liga as tags ao consentimento e mostra o banner. */
export function SiteBoot({ children }: { children: ReactNode }) {
  useEffect(() => { captureCampaign(); startTracking() }, [])
  return <>{children}<CookieBanner /></>
}
