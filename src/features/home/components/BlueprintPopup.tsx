import { useCallback, useEffect, useRef, useState } from 'react'
import { BrandLogo } from './BrandLogo'
import { ContactForm } from './ContactForm'
import { withBase } from '../../../lib/paths'
import { track } from '../../../lib/tracking'

/**
 * Pop-up do Blueprint: abre quando "quem somos" entra na tela, em toda visita ou atualização da página (ou com `open` forçado).
 * Três saídas: conhecer o curso, deixar nome/e-mail/telefone (origem "popup-blueprint" na planilha) ou fechar (X, Esc, clique fora).
 * Fechado, não volta até a próxima atualização da página (pedido da cliente: sem pausa de dias).
 */
export function BlueprintPopup({ triggerId = 'page-three', open: forced = false, endpoint }: { triggerId?: string; open?: boolean; endpoint?: string }) {
  const [open, setOpen] = useState(forced)
  const [mode, setMode] = useState<'intro' | 'form'>('intro')
  const dialog = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useEffect(() => {
    if (forced || typeof IntersectionObserver === 'undefined') return
    const target = document.getElementById(triggerId)
    if (!target) return
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { setOpen(true); observer.disconnect() } }, { threshold: 0.3 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [forced, triggerId])
  useEffect(() => {
    if (!open) return
    track('view_promotion', { promotion: 'popup-blueprint' })
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    dialog.current?.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])
  if (!open) return null
  return (
    <div className="bp-popup-backdrop" onClick={close} data-testid="bp-popup">
      <div ref={dialog} className="bp-popup" role="dialog" aria-modal="true" aria-labelledby="bp-popup-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="bp-popup-close" aria-label="Fechar" onClick={close}>×</button>
        <span className="bp-popup-brand"><BrandLogo variant="blueprint" /></span>
        <span className="solution-kicker bp-popup-kicker">curso da Bluezone</span>
        <h2 id="bp-popup-title" className="bp-popup-title">Postar não é o problema. Comunicar sem estratégia é.</h2>
        {mode === 'intro' ? (
          <>
            <p className="bp-popup-text">Conheça o Blueprint, o guia prático da Bluezone para parar de postar no escuro. Ou deixe seu contato para receber promoções e conteúdo exclusivo.</p>
            <div className="bp-popup-actions">
              <a className="contact-submit blog-cta bp-buy" href={withBase('/blueprint')} onClick={close}>conhecer o Blueprint</a>
              <button type="button" className="products-note bp-popup-link" onClick={() => setMode('form')}>quero receber promoções e conteúdo</button>
            </div>
          </>
        ) : (
          <>
            <p className="bp-popup-text">Deixe seus dados e a gente manda promoções do Blueprint e conteúdo exclusivo por e-mail.</p>
            <ContactForm variant="popup" endpoint={endpoint} />
          </>
        )}
      </div>
    </div>
  )
}
