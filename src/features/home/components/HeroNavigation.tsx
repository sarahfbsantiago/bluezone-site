import { useEffect } from 'react'

type Props = { state: number; total: number; onChange: (next: number) => void; progress?: number; onInteract?: () => void; onHover?: (value: boolean) => void }

/** Setas, indicador de estados (com progresso da troca automática) e navegação por teclado (← →) fora de campos de texto. */
export function HeroNavigation({ state, total, onChange, progress = 0, onInteract, onHover }: Props) {
  const go = (next: number) => { onInteract?.(); onChange((next + total) % total) }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (event.key === 'ArrowRight') { event.preventDefault(); onInteract?.(); onChange((state + 1) % total) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); onInteract?.(); onChange((state - 1 + total) % total) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, total, onChange, onInteract])
  const hoverProps = { onPointerEnter: () => onHover?.(true), onPointerLeave: () => onHover?.(false) }
  return (
    <>
      <button type="button" className="arrow arrow-left" onClick={() => go(state - 1)} aria-label="Estado anterior" {...hoverProps}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M19 12H6m0 0 5-5m-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" className="arrow arrow-right" onClick={() => go(state + 1)} aria-label="Próximo estado" {...hoverProps}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12h13m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="hero-progress" role="tablist" aria-label="Estados da experiência" {...hoverProps}>
        {Array.from({ length: total }, (_, index) => (
          <button
            type="button"
            key={index}
            className={index === state ? 'active' : ''}
            role="tab"
            aria-selected={index === state}
            aria-label={`Estado ${index + 1}`}
            onClick={() => go(index)}
            style={index === state ? ({ '--progress': progress } as React.CSSProperties) : undefined}
          >
            {index === state && <span className="progress-ring" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </>
  )
}
