import { useCallback, useEffect, useRef, useState } from 'react'

export const AUTO_ADVANCE_MS = 6000
export const AUTO_RESUME_MS = 12000

type Options = { total: number; enabled: boolean; onAdvance: () => void; intervalMs?: number; resumeMs?: number }

/**
 * Passa os estados do hero sozinho, em ciclo. Pausa com interação (retoma depois), com o mouse
 * sobre a headline/controles, com a aba oculta e quando o hero sai da tela. Expõe o progresso (0..1) do estado atual.
 */
export function useAutoAdvance({ total, enabled, onAdvance, intervalMs = AUTO_ADVANCE_MS, resumeMs = AUTO_RESUME_MS }: Options) {
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const hovered = useRef(false)
  const hidden = useRef(false)
  const offscreen = useRef(false)
  const resumeAt = useRef(0)
  const elapsed = useRef(0)
  const onAdvanceRef = useRef(onAdvance)
  onAdvanceRef.current = onAdvance

  /** Chamado a cada interação manual: pausa e agenda o retorno. */
  const interact = useCallback(() => {
    resumeAt.current = Date.now() + resumeMs
    elapsed.current = 0
    setProgress(0)
  }, [resumeMs])

  const setHover = useCallback((value: boolean) => { hovered.current = value }, [])
  const setOffscreen = useCallback((value: boolean) => { offscreen.current = value }, [])

  useEffect(() => {
    if (!enabled || total < 2) return
    const onVisibility = () => { hidden.current = document.hidden }
    document.addEventListener('visibilitychange', onVisibility)
    let last = Date.now()
    const tick = window.setInterval(() => {
      const now = Date.now()
      const dt = now - last
      last = now
      const blocked = hovered.current || hidden.current || offscreen.current || now < resumeAt.current
      setPaused(blocked)
      if (blocked) return
      elapsed.current += dt
      if (elapsed.current >= intervalMs) {
        elapsed.current = 0
        onAdvanceRef.current()
      }
      setProgress(Math.min(1, elapsed.current / intervalMs))
    }, 100)
    return () => { window.clearInterval(tick); document.removeEventListener('visibilitychange', onVisibility) }
  }, [enabled, total, intervalMs])

  return { progress: enabled ? progress : 0, paused, interact, setHover, setOffscreen }
}
