import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import type { HeroState } from '../config/heroConfig'
import type { PointerState } from '../hooks/usePointerParallax'
import type { ScrollProgress } from '../hooks/useScrollProgress'
import type { Theme } from '../hooks/useTheme'
import { createHeroScene, type HeroSceneHandle, type Layout } from '../scene/createHeroScene'
import { BrandLogo } from './BrandLogo'

type Props = { data: HeroState; reduced: boolean; layout: Layout; pointer: MutableRefObject<PointerState>; scroll: MutableRefObject<ScrollProgress>; theme: Theme; onStatus?: (status: 'webgl' | 'fallback') => void }

/**
 * Camada visual do hero. O canvas é decorativo (aria-hidden): headline, logo do header e controles vivem no DOM.
 * Sem WebGL, mostra a marca oficial estável via máscara CSS.
 */
export function HeroScene({ data, reduced, layout, pointer, scroll, theme, onStatus }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const handle = useRef<HeroSceneHandle | null>(null)
  const introDone = useRef(false)
  const moodRef = useRef(data.mood)
  moodRef.current = data.mood
  const themeRef = useRef(theme)
  themeRef.current = theme
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const element = host.current
    if (!element) return
    const created = createHeroScene(element, { reduced, layout, mood: moodRef.current, skipIntro: introDone.current, dark: themeRef.current === 'dark' })
    handle.current = created
    if (!created) { setFallback(true); onStatus?.('fallback'); return }
    onStatus?.('webgl')
    if (import.meta.env.DEV) (window as Window & { __bluezoneHero?: HeroSceneHandle }).__bluezoneHero = created
    const introTimer = window.setTimeout(() => { introDone.current = true }, 5000)
    const onVisibility = () => created.setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    let pointerFrame = 0
    const sync = () => { pointerFrame = requestAnimationFrame(sync); created.setPointer(pointer.current.x, pointer.current.y, pointer.current.active); created.setScroll(scroll.current.pages, scroll.current.contact) }
    const onScrollReduced = () => created.setScroll(scroll.current.pages, scroll.current.contact)
    if (!reduced) sync()
    else window.addEventListener('scroll', onScrollReduced, { passive: true })
    created.setScroll(scroll.current.pages, scroll.current.contact)
    return () => {
      window.clearTimeout(introTimer)
      cancelAnimationFrame(pointerFrame)
      window.removeEventListener('scroll', onScrollReduced)
      document.removeEventListener('visibilitychange', onVisibility)
      created.dispose()
      handle.current = null
    }
  }, [reduced, layout, pointer, scroll, onStatus])

  useEffect(() => { handle.current?.setMood(data.mood) }, [data])
  useEffect(() => { handle.current?.setTheme(theme === 'dark') }, [theme])

  return (
    <div ref={host} className={`hero-scene scene-${data.id}${fallback ? ' is-fallback' : ''}`} aria-hidden="true">
      {fallback && <div className="hero-fallback"><BrandLogo markOnly /></div>}
    </div>
  )
}
