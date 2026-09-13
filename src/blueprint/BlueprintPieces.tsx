import { useEffect, useRef, useState, type ReactNode } from 'react'
import type React from 'react'
import { BrandLogo } from '../features/home/components/BrandLogo'
import { useReducedMotion } from '../features/home/hooks/useReducedMotion'
import { useTyping } from '../features/home/hooks/useTyping'
import { createMarkScene, type MarkSceneHandle } from './createMarkScene'

/** Marca do Blueprint: símbolo em pontilhismo (WebGL) + "Blueprint" digitando. Sem WebGL, símbolo via máscara CSS. */
export function BlueprintBrand() {
  const reduced = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<MarkSceneHandle | null>(null)
  const [fallback, setFallback] = useState(false)
  const { typed } = useTyping('Blueprint', !reduced, { delay: 900 })
  useEffect(() => {
    const element = host.current
    if (!element) return
    const created = createMarkScene(element, { reduced, accent: '#ffb56b' })
    scene.current = created
    if (!created) { setFallback(true); return }
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      created.setPointer(x, y, x > -1.3 && x < 1.3 && y > -1.3 && y < 1.3)
    }
    const leave = () => created.setPointer(9, 9, false)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', leave)
    element.addEventListener('pointercancel', leave)
    return () => {
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', leave)
      element.removeEventListener('pointercancel', leave)
      created.dispose()
    }
  }, [reduced])
  return (
    <div className="bp-brand" aria-label="Blueprint">
      <div ref={host} className="bp-brand-mark" aria-hidden="true">{fallback && <BrandLogo markOnly />}</div>
      <span className="bp-brand-word" aria-hidden="true">
        <b>{typed.slice(0, 4)}</b>{typed.slice(4)}
        <span className="whatsapp-cursor bp-cursor" />
      </span>
    </div>
  )
}

/**
 * Progresso de rolagem do elemento (0 = entrando pela base da janela, 1 = já subiu o suficiente), em `--sp`.
 * O movimento acompanha a rolagem nos dois sentidos; ao chegar a 1 ganha `is-done` (flutuação). Com reduced motion, fica em 1.
 */
export function useScrollDriven<T extends HTMLElement>(reduced: boolean, span = 0.55, start = 0.92) {
  const ref = useRef<T>(null)
  const [done, setDone] = useState(reduced)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (reduced) { element.style.setProperty('--sp', '1'); setDone(true); return }
    let frame = 0
    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const p = Math.min(1, Math.max(0, (vh * start - rect.top) / (vh * span)))
      element.style.setProperty('--sp', p.toFixed(4))
      setDone(p >= 1)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [reduced, span, start])
  return { ref, done }
}

/** Tablet em CSS 3D (preto, moldura fina, câmera): entra girando quando aparece e para em leve ângulo, flutuando. */
export function Tablet({ src, alt }: { src: string; alt: string }) {
  const reduced = useReducedMotion()
  const { ref, done } = useScrollDriven<HTMLDivElement>(reduced, 0.5, 1.0)
  return (
    <div ref={ref} className={`bp-tablet bp-scroll${done ? ' is-done' : ''}`}>
      <div className="bp-float">
        <div className="bp-tablet-body">
          <span className="bp-tablet-cam" />
          <div className="bp-tablet-screen"><img src={src} alt={alt} decoding="async" /><span className="bp-phone-gloss" /></div>
          <span className="bp-tablet-btn" />
        </div>
      </div>
    </div>
  )
}

/** Smartphone em CSS 3D: entra girando quando a seção aparece e para em pé, flutuando de leve. */
export function Phone({ src, alt }: { src: string; alt: string }) {
  const reduced = useReducedMotion()
  const { ref, done } = useScrollDriven<HTMLDivElement>(reduced)
  return (
    <div ref={ref} className={`bp-phone bp-scroll${done ? ' is-done' : ''}`}>
      <div className="bp-float">
        <div className="bp-phone-body">
          <div className="bp-phone-screen"><img src={src} alt={alt} loading="lazy" decoding="async" /><span className="bp-phone-gloss" /></div>
          <span className="bp-phone-island" />
          <span className="bp-phone-btn bp-phone-btn-l1" /><span className="bp-phone-btn bp-phone-btn-l2" /><span className="bp-phone-btn bp-phone-btn-r" />
        </div>
      </div>
    </div>
  )
}

/** Folha de jornal: cabeçalho, manchete, foto em preto e branco com legenda e texto em colunas com capitular. */
export function Newspaper({ masthead, dateline, headline, photo, caption, children }: { masthead: string; dateline: string; headline: string; photo: string; caption: ReactNode; children: ReactNode }) {
  const reduced = useReducedMotion()
  const { ref, done } = useScrollDriven<HTMLDivElement>(reduced, 0.6, 0.95)
  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    event.currentTarget.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`)
    event.currentTarget.style.setProperty('--tilt-y', `${(x * 8).toFixed(2)}deg`)
  }
  const onLeave = (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.style.setProperty('--tilt-x', '0deg'); event.currentTarget.style.setProperty('--tilt-y', '0deg') }
  return (
    <div ref={ref} className={`bp-paper-stage bp-scroll${done ? ' is-done is-open' : ''}`} onPointerMove={onMove} onPointerLeave={onLeave}>
    <article className="bp-paper">
      <header className="bp-paper-head">
        <span className="bp-paper-masthead">{masthead}</span>
        <span className="bp-paper-date">{dateline}</span>
      </header>
      <h2 id="bp-founders-title" className="bp-paper-headline">{headline}</h2>
      <div className="bp-paper-body">
        <figure className="bp-paper-photo"><img src={photo} alt="Alisson Werneck e Isabela Lima, fundadores da Bluezone" loading="lazy" decoding="async" /><figcaption>{caption}</figcaption></figure>
        <div className="bp-paper-text">{children}</div>
      </div>
    </article>
    </div>
  )
}
