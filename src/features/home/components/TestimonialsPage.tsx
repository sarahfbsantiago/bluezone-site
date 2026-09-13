import { useCallback, useEffect, useRef, useState } from 'react'
import { withBase } from '../../../lib/paths'
import { pages } from '../config/pagesConfig'
import { useReducedMotion } from '../hooks/useReducedMotion'

type Item = (typeof pages.testimonials.items)[number]
type MediaItem = Exclude<Item, { type: 'quote' }>
type QuoteItem = Extract<Item, { type: 'quote' }>

const Stars = () => <span className="quote-stars" aria-label="cinco estrelas">★★★★★</span>

/** Depoimento em texto: foto redonda (ou inicial), nome, serviço, estrelas e a fala. Cartões têm a mesma altura; texto longo rola dentro do cartão. */
function Quote({ item }: { item: QuoteItem }) {
  return (
    <figure className="carousel-quote">
      <div className="quote-head">
        <span className="quote-photo">{item.photo ? <img src={withBase(item.photo)} alt="" loading="lazy" /> : <b>{item.name.charAt(0)}</b>}</span>
        <figcaption><strong>{item.name}</strong><span>{item.service}</span><Stars /></figcaption>
      </div>
      <blockquote tabIndex={0}><p>{item.text}</p></blockquote>
      {item.via === 'whatsapp' && <div className="quote-foot"><span className="quote-via">via WhatsApp</span></div>}
    </figure>
  )
}

function Media({ item, index, onPlaying }: { item: MediaItem; index: number; onPlaying: (playing: boolean) => void }) {
  if (!item.src) return <span className="carousel-placeholder">{String(index + 1).padStart(2, '0')}<small>{item.type === 'video' ? 'vídeo' : item.type === 'audio' ? 'áudio' : 'foto'}</small></span>
  if (item.type === 'video') return <video src={withBase(item.src)} poster={item.poster || undefined} controls playsInline preload="metadata" onPlay={() => onPlaying(true)} onPause={() => onPlaying(false)} onEnded={() => onPlaying(false)} aria-label={item.alt} />
  if (item.type === 'audio') {
    return (
      <div className="carousel-audio" style={item.poster ? { backgroundImage: `url(${item.poster})` } : undefined}>
        <audio src={withBase(item.src)} controls preload="metadata" onPlay={() => onPlaying(true)} onPause={() => onPlaying(false)} onEnded={() => onPlaying(false)} aria-label={item.alt} />
      </div>
    )
  }
  return <img src={withBase(item.src)} alt={item.alt} loading="lazy" />
}

/** Carrossel de depoimentos (texto com foto, ou foto/vídeo/áudio): passa sozinho, pausa com mouse, toque, mídia tocando ou aba oculta. */
export function TestimonialsPage() {
  const { testimonials, products } = pages
  const track = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const playing = useRef(0)
  const holdUntil = useRef(0)
  const reduced = useReducedMotion()
  const total = testimonials.items.length

  const scrollTo = useCallback((next: number) => {
    const el = track.current
    if (!el) return
    const clamped = (next + total) % total
    const card = el.children[clamped] as HTMLElement | undefined
    // centraliza o cartão na janela do carrossel
    if (card && typeof el.scrollTo === 'function') el.scrollTo({ left: card.offsetLeft - el.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' })
    setIndex(clamped)
  }, [total])

  /** Interação manual: pausa a troca automática por um tempo. */
  const interact = useCallback((next: number) => { holdUntil.current = Date.now() + 12000; scrollTo(next) }, [scrollTo])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const cards = Array.from(el.children) as HTMLElement[]
        const center = el.scrollLeft + el.clientWidth / 2
        let best = 0
        let bestDistance = Number.POSITIVE_INFINITY
        cards.forEach((card, i) => { const d = Math.abs(card.offsetLeft - el.offsetLeft + card.offsetWidth / 2 - center); if (d < bestDistance) { bestDistance = d; best = i } })
        setIndex(best)
      })
    }
    const onTouch = () => { holdUntil.current = Date.now() + 12000 }
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('touchstart', onTouch, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); el.removeEventListener('touchstart', onTouch); if (frame) cancelAnimationFrame(frame) }
  }, [])

  // troca automática
  useEffect(() => {
    if (reduced || total < 2 || !testimonials.autoAdvanceMs) return
    const tick = window.setInterval(() => {
      if (paused || playing.current > 0 || document.hidden || Date.now() < holdUntil.current) return
      setIndex((current) => { const next = (current + 1) % total; scrollTo(next); return next })
    }, testimonials.autoAdvanceMs)
    return () => window.clearInterval(tick)
  }, [reduced, total, paused, scrollTo, testimonials.autoAdvanceMs])

  const onPlaying = (value: boolean) => { playing.current = Math.max(0, playing.current + (value ? 1 : -1)) }

  return (
    <section id={testimonials.id} className="page page-long page-testimonials" aria-labelledby="testimonials-title">
      <div className="page-block page-block-long">
        <span className="page-label">{testimonials.label}</span>
        <h2 id="testimonials-title" className="solution-title">{testimonials.title}</h2>
        <div className="carousel" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
          <button type="button" className="carousel-arrow carousel-prev" onClick={() => interact(index - 1)} aria-label="Depoimento anterior">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H6m0 0 5-5m-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <ul ref={track} className="carousel-track" aria-label="Depoimentos de clientes" aria-live="polite">
            {testimonials.items.map((item, i) => (
              <li key={i} className="carousel-card" aria-roledescription="slide" aria-label={`${i + 1} de ${total}`}>
                {item.type === 'quote' ? <Quote item={item} /> : (
                  <>
                    <div className="carousel-square"><Media item={item} index={i} onPlaying={onPlaying} /></div>
                    {item.caption && <p className="carousel-caption">{item.caption}</p>}
                  </>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="carousel-arrow carousel-next" onClick={() => interact(index + 1)} aria-label="Próximo depoimento">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="carousel-dots" role="tablist" aria-label="Posição no carrossel">
          {testimonials.items.map((_, i) => <button type="button" key={i} role="tab" aria-selected={i === index} aria-label={`Depoimento ${i + 1}`} className={i === index ? 'active' : ''} onClick={() => interact(i)} />)}
        </div>
      </div>
      <a className="page-continue" href={`#${products.id}`}>continuar<span className="page-continue-line" /></a>
    </section>
  )
}
