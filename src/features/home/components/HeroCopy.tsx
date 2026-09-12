import { useEffect, useRef, useState } from 'react'
import type { HeroState } from '../config/heroConfig'

/**
 * Headline visível, dividida nos dois lados da marca (desktop) ou empilhada abaixo dela (tablet e mobile).
 * A troca de estado é uma transição: o texto anterior sai enquanto o novo entra.
 */
export function HeroCopy({ data }: { data: HeroState }) {
  const [previous, setPrevious] = useState<HeroState | null>(null)
  const last = useRef(data)
  useEffect(() => {
    if (last.current.id === data.id) return
    setPrevious(last.current)
    last.current = data
    const timer = window.setTimeout(() => setPrevious(null), 900)
    return () => window.clearTimeout(timer)
  }, [data])
  return (
    <div className="hero-copy-stage">
      {previous && (
        <div className="hero-copy is-leaving" aria-hidden="true" key={`leaving-${previous.id}`}>
          <p className="hero-word hero-word-left">{previous.headline[0]}</p>
          <p className="hero-word hero-word-right">{previous.headline[1]}</p>
        </div>
      )}
      <div className="hero-copy is-entering" key={data.id} aria-live="polite">
        <p className="hero-word hero-word-left"><span className="line-word">{data.headline[0]}</span></p>
        <p className="hero-word hero-word-right"><span className="line-word">{data.headline[1]}</span><span className="cursor" aria-hidden="true" /></p>
      </div>
    </div>
  )
}
