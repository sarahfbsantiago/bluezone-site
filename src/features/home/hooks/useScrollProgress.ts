import { useEffect, useRef, type RefObject } from 'react'

export const SCROLL_PAGES = 6

export type ScrollProgress = {
  /** rolagem em "telas" (0 = hero, 1 = página 2, 2 = página 3, 3 = página 4, …) */
  pages: number
  /** 0 = contato ainda a uma tela de distância … 1 = contato no topo da janela; cresce além de 1 dentro dele */
  contact: number
}

/**
 * Progresso da rolagem, guardado em um ref e espelhado nas variáveis CSS `--p` (telas) e `--pc` (contato); cada seção `.page` recebe `--ps` (0 = uma tela antes do seu topo, 1 = topo na janela), para animar entradas independentemente da posição na rolagem
 * do elemento raiz, sem re-render por scroll. O contato é medido pela posição real da seção, porque as páginas
 * de soluções e time são mais altas que uma tela.
 */
export function useScrollProgress(target: RefObject<HTMLElement | null>, contactId = 'contato') {
  const progress = useRef<ScrollProgress>({ pages: 0, contact: 0 })
  useEffect(() => {
    let frame = 0
    let pending = false
    const update = () => {
      pending = false
      const height = Math.max(1, window.innerHeight)
      const pages = Math.min(SCROLL_PAGES, Math.max(0, window.scrollY / height))
      const section = document.getElementById(contactId)
      const contactTop = section ? section.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY
      const contact = Number.isFinite(contactTop) ? Math.max(0, (window.scrollY - (contactTop - height)) / height) : 0
      const sections = target.current?.querySelectorAll<HTMLElement>('.page[data-scroll-section]')
      sections?.forEach((section) => {
        const top = section.getBoundingClientRect().top
        section.style.setProperty('--ps', Math.max(-1, Math.min(3, (height - top) / height)).toFixed(4))
      })
      progress.current.pages = pages
      progress.current.contact = contact
      target.current?.style.setProperty('--p', pages.toFixed(4))
      target.current?.style.setProperty('--pc', Math.min(1, contact).toFixed(4))
    }
    const schedule = () => { if (pending) return; pending = true; frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [target, contactId])
  return progress
}
