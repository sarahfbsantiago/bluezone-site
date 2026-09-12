import { useEffect, useState } from 'react'

type Options = { loop?: boolean; delay?: number }

/**
 * Texto "sendo digitado", letra a letra. `loop` (padrão): espera, apaga e recomeça. Sem loop: digita uma vez e para.
 * Com `enabled` falso (reduced motion), mostra o texto completo. Retorna o trecho já digitado e se terminou.
 */
export function useTyping(text: string, enabled: boolean, { loop = true, delay = 1200 }: Options = {}) {
  const [length, setLength] = useState(enabled ? 0 : text.length)
  useEffect(() => {
    if (!enabled) { setLength(text.length); return }
    let current = 0
    let deleting = false
    let timer = 0
    const step = () => {
      if (!deleting) {
        current += 1
        setLength(current)
        if (current >= text.length) { if (!loop) return; deleting = true; timer = window.setTimeout(step, 2600); return }
        timer = window.setTimeout(step, 70 + Math.random() * 60)
      } else {
        current -= 1
        setLength(current)
        if (current <= 0) { deleting = false; timer = window.setTimeout(step, 900); return }
        timer = window.setTimeout(step, 28)
      }
    }
    timer = window.setTimeout(step, delay)
    return () => window.clearTimeout(timer)
  }, [text, enabled, loop, delay])
  return { typed: text.slice(0, length), done: length >= text.length }
}
