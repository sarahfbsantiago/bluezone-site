import { useCallback, useEffect, useRef, useState } from 'react'
import { heroStates, heroTimeline } from './config/heroConfig'
import { pages } from './config/pagesConfig'
import { useLayout } from './hooks/useLayout'
import { usePointerParallax } from './hooks/usePointerParallax'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useScrollProgress } from './hooks/useScrollProgress'
import { useTheme } from './hooks/useTheme'
import { useAutoAdvance } from './hooks/useAutoAdvance'
import { HeroCopy } from './components/HeroCopy'
import { HeroNavigation } from './components/HeroNavigation'
import { HeroScene } from './components/HeroScene'
import { RichText } from './components/RichText'
import { SiteHeader } from './components/SiteHeader'
import { ProductsPage } from './components/ProductsPage'
import { SolutionsPage } from './components/SolutionsPage'
import { StoryPage } from './components/StoryPage'
import { TeamPage } from './components/TeamPage'
import { TestimonialsPage } from './components/TestimonialsPage'
import { ContactForm } from './components/ContactForm'
import { SiteFooter } from './components/SiteFooter'
import { VideoFrame } from './components/VideoFrame'
import { WhatsAppButton } from './components/WhatsAppButton'
import { BlueprintPopup } from './components/BlueprintPopup'

export function HomePage() {
  const [state, setState] = useState(0)
  const [introReady, setIntroReady] = useState(false)
  const [sceneStatus, setSceneStatus] = useState<'pending' | 'webgl' | 'fallback'>('pending')
  const main = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const layout = useLayout()
  const pointer = usePointerParallax(reduced)
  const scroll = useScrollProgress(main)
  const [theme, toggleTheme] = useTheme()
  // Chegando de outra página (ex.: BlueNews) com âncora, as seções ainda não existem quando o navegador tenta rolar. Repete a rolagem depois de montar.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id || id === 'top') return
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
    go()
    const timer = window.setTimeout(go, 350)
    return () => window.clearTimeout(timer)
  }, [])
  const data = heroStates[state]
  const advance = useCallback(() => setState((current) => (current + 1) % heroStates.length), [])
  const auto = useAutoAdvance({ total: heroStates.length, enabled: introReady && !reduced, onAdvance: advance })
  const setOffscreen = auto.setOffscreen
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const hero = document.querySelector('.hero')
    if (!hero) return
    const observer = new IntersectionObserver(([entry]) => setOffscreen(entry.intersectionRatio < 0.5), { threshold: [0, 0.5, 1] })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [setOffscreen])

  useEffect(() => {
    if (reduced || sceneStatus === 'fallback') { setIntroReady(true); return }
    const timer = window.setTimeout(() => setIntroReady(true), heroTimeline.interface * 1000)
    return () => window.clearTimeout(timer)
  }, [reduced, sceneStatus])

  const onStatus = useCallback((status: 'webgl' | 'fallback') => setSceneStatus(status), [])
  const className = ['home-page', `accent-${data.accent}`, `state-${data.id}`, `layout-${layout}`, `theme-${theme}`, reduced ? 'reduced-motion' : '', introReady ? 'intro-ready' : '', sceneStatus === 'fallback' ? 'scene-fallback' : ''].filter(Boolean).join(' ')

  return (
    <main id="top" ref={main} className={className}>
      <div className="backdrop" aria-hidden="true">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="ambient ambient-three" />
      </div>
      <HeroScene data={data} reduced={reduced} layout={layout} pointer={pointer} scroll={scroll} theme={theme} onStatus={onStatus} />
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} />
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="sr-only">{data.headline.join(' ')}</h1>
        <div className="hero-ui">
          <div onPointerEnter={() => auto.setHover(true)} onPointerLeave={() => auto.setHover(false)}><HeroCopy data={data} /></div>
          <HeroNavigation state={state} total={heroStates.length} onChange={setState} progress={auto.progress} onInteract={auto.interact} onHover={auto.setHover} />
          <div className="microcopy microcopy-left">{data.left.split('\n').map((line) => <span key={line}>{line}</span>)}</div>
          <div className="microcopy microcopy-right">{data.right.split('\n').map((line) => <span key={line}>{line}</span>)}</div>
          <a className="explore" href={`#${pages.two.id}`}>explorar<span className="explore-line" /></a>
        </div>
      </section>
      <section id={pages.two.id} className="page page-two" aria-labelledby="page-two-title">
        <div className="page-block">
          <span className="page-label">{pages.two.label}</span>
          <h2 id="page-two-title" className="page-title">{pages.two.title}</h2>
        </div>
        <a className="page-continue" href={`#${pages.story.id}`}>continuar<span className="page-continue-line" /></a>
      </section>
      <StoryPage />
      <section id={pages.three.id} className="page page-three" aria-label="Quem somos" data-scroll-section>
        <div className="page-block page-block-about">
          <span className="page-label">{pages.three.label}</span>
          <p className="page-text"><RichText text={pages.three.text} /></p>
          <div className="page-paragraphs">
            {pages.three.paragraphs.map((paragraph) => <p key={paragraph}><RichText text={paragraph} /></p>)}
          </div>
        </div>
        <a className="page-continue" href={`#${pages.four.id}`}>continuar<span className="page-continue-line" /></a>
      </section>
      <section id={pages.four.id} className="page page-four" aria-labelledby="page-four-title" data-scroll-section>
        <div className="page-block">
          <span className="page-label">{pages.four.label}</span>
          <h2 id="page-four-title" className="page-title page-title-four"><span className="page-lead">{pages.four.lead}</span><span className="page-strong">{pages.four.title}</span></h2>
        </div>
        <VideoFrame src={pages.four.video} />
        <a className="page-continue" href={`#${pages.solutions.id}`}>continuar<span className="page-continue-line" /></a>
      </section>
      <SolutionsPage />
      <TestimonialsPage />
      <ProductsPage />
      <TeamPage />
      <section id={pages.contact.id} className="page page-contact" aria-labelledby="contact-title">
        <div className="contact-grid">
          <div className="contact-intro">
            <span className="page-label">{pages.contact.label}</span>
            <h2 id="contact-title" className="page-title contact-title">{pages.contact.title}</h2>
            <p className="contact-subtitle">{pages.contact.subtitle}</p>
            <div className="contact-copy">
              {pages.contact.paragraphs.map((paragraph) => <p key={paragraph} className="contact-text">{paragraph}</p>)}
              <p className="contact-note">{pages.contact.note}</p>
            </div>
            <div className="contact-mark" aria-hidden="true" />
          </div>
          <div className="contact-panel">
            <ContactForm />
          </div>
        </div>
        <SiteFooter />
      </section>
      <WhatsAppButton />
      <BlueprintPopup />
    </main>
  )
}
