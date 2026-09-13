import { useEffect, useState } from 'react'
import { withBase } from '../../../lib/paths'
import { pages } from '../config/pagesConfig'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useScrollDriven } from '../../../blueprint/BlueprintPieces'

/**
 * Tablet 3D (mesma peça do Blueprint, brilho azul) entre "para quem fazemos" e "clientes".
 * Entra girando preso ao scroll (sobe e desce refaz), para de frente e flutua; na tela, as fotos dos fundadores deslizam
 * sozinhas de lado (rolagem automática, em loop) assim que o tablet está visível. Pausa com o mouse em cima e fica parada
 * na primeira foto com "reduzir movimento".
 */
export function FoundersTablet() {
  const { foundersGallery: gallery } = pages
  const reduced = useReducedMotion()
  const { ref, done } = useScrollDriven<HTMLDivElement>(reduced, 0.5, 1.0)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = gallery.photos.length

  // avança sozinho enquanto o tablet estiver na tela (não depende de terminar o giro)
  useEffect(() => {
    const element = ref.current
    if (reduced || total < 2 || !element) return
    let visible = typeof IntersectionObserver === 'undefined'
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.2 })
    observer?.observe(element)
    const tick = window.setInterval(() => { if (visible && !paused && !document.hidden) setIndex((i) => (i + 1) % total) }, gallery.intervalMs)
    return () => { observer?.disconnect(); window.clearInterval(tick) }
  }, [reduced, total, paused, gallery.intervalMs, ref])

  return (
    <section id={gallery.id} className="page page-founders" aria-label="Fotos dos fundadores" data-scroll-section>
      <div ref={ref} className={`bp-tablet founders-tablet bp-scroll${done ? ' is-done' : ''}`} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        <div className="bp-float">
          <div className="bp-tablet-body">
            <span className="bp-tablet-cam" />
            <div className="bp-tablet-screen founders-screen">
              <div className="founders-track" style={{ transform: `translateX(${-index * 100}%)` }}>
                {gallery.photos.map((photo, i) => (
                  <img key={photo.src} src={withBase(photo.src)} alt={i === index ? photo.alt : ''} style={{ objectPosition: photo.position }} loading="lazy" decoding="async" aria-hidden={i !== index} />
                ))}
              </div>
              <span className="bp-phone-gloss" />
              {total > 1 && (
                <span className="founders-dots" aria-hidden="true">
                  {gallery.photos.map((photo, i) => <i key={photo.src} className={i === index ? 'active' : undefined} />)}
                </span>
              )}
            </div>
            <span className="bp-tablet-btn" />
          </div>
        </div>
      </div>
      {gallery.caption && <p className="founders-caption">{gallery.caption}</p>}
    </section>
  )
}
