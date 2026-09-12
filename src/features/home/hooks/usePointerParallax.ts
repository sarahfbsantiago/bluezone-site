import { useEffect, useRef } from 'react'

export type PointerState = { x: number; y: number; active: boolean }

/**
 * Posição normalizada do ponteiro (-1..1) e se ele está "ativo", em um ref (sem re-render por movimento).
 * Mouse: ativo enquanto estiver sobre a janela. Toque: ativo enquanto o dedo estiver na tela,
 * com listeners passivos para não bloquear a rolagem.
 */
export function usePointerParallax(reduced: boolean) {
  const pointer = useRef<PointerState>({ x: 0, y: 0, active: false })
  useEffect(() => {
    if (reduced) { pointer.current.x = 0; pointer.current.y = 0; pointer.current.active = false; return }
    const update = (clientX: number, clientY: number) => {
      pointer.current.x = (clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = (clientY / window.innerHeight - 0.5) * 2
    }
    const onMove = (event: PointerEvent) => {
      update(event.clientX, event.clientY)
      if (event.pointerType !== 'touch') pointer.current.active = true
    }
    const onTouchDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      update(event.clientX, event.clientY)
      pointer.current.active = true
    }
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      update(touch.clientX, touch.clientY)
      pointer.current.active = true
    }
    const onRelease = () => { pointer.current.active = false }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onTouchDown, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onRelease, { passive: true })
    window.addEventListener('touchcancel', onRelease, { passive: true })
    document.addEventListener('pointerleave', onRelease)
    window.addEventListener('blur', onRelease)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onTouchDown)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onRelease)
      window.removeEventListener('touchcancel', onRelease)
      document.removeEventListener('pointerleave', onRelease)
      window.removeEventListener('blur', onRelease)
    }
  }, [reduced])
  return pointer
}
