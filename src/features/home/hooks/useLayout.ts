import { useEffect, useState } from 'react'
import type { Layout } from '../scene/createHeroScene'

const queries: [Layout, string][] = [['mobile', '(max-width: 600px)'], ['tablet', '(max-width: 1024px)']]

function resolve(): Layout {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop'
  for (const [layout, query] of queries) if (window.matchMedia(query).matches) return layout
  return 'desktop'
}

/** Layout atual (desktop, tablet, mobile) para a cena reposicionar a composição, não apenas encolher. */
export function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>(resolve)
  useEffect(() => {
    const lists = queries.map(([, query]) => window.matchMedia(query))
    const onChange = () => setLayout(resolve())
    lists.forEach((list) => list.addEventListener('change', onChange))
    return () => lists.forEach((list) => list.removeEventListener('change', onChange))
  }, [])
  return layout
}
