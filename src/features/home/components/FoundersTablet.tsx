import { useEffect, useState } from 'react'
import { withBase } from '../../../lib/paths'
import { pages } from '../config/pagesConfig'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useScrollDriven } from '../../../blueprint/BlueprintPieces'

/**
 * Tablet 3D (mesma peça do Blueprint, brilho azul) entre "para quem fazemos" e "clientes".
 * Entra girando preso ao scroll (sobe e desce refaz), para de frente e flutua; na tela, as fotos dos fundadores passam
 * sozinhas com transição suave. Pausa com o mouse em cima e fica parada na primeira foto com "reduzir movimento".
 */
export function FoundersTablet() {
  const { foundersGallery: gallery } = pages
  const reduced = useReducedMotion()
  const { ref, done } = useScrollDriven<HTMLDivElement>(reduced, 0.5, 1.0)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = gallery.photos.length

  useEffect(() => {
    if (reduced || total < 2 || !done) return
    const tick = window.setInterval(() => { if (!paused && !document.hidden) setIndex((i) => (i + 1) % total) }, gallery.intervalMs)
    return () => window.clearInterval(tick)
  }, [reduced, total, done, paused, gallery.intervalMs])

  return (
    <section id={gallery.id} className="page page-founders" aria-label="Fotos dos fundadores" data-scroll-section>
      <div ref={ref} className={`bp-tablet founders-tablet bp-scroll${done ? ' is-done' : ''}`} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        <div className="bp-float">
          <div className="bp-tablet-body">
            <span className="bp-tablet-cam" />
            <div className="bp-tablet-screen founders-screen">
              {gallery.photos.map((photo, i) => (
                <img key={photo.src} src={withBase(photo.src)} alt={i === index ? photo.alt : ''} style={{ objectPosition: photo.position }} className={i === index ? 'is-active' : undefined} loading="lazy" decoding="async" aria-hidden={i !== index} />
              ))}
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
