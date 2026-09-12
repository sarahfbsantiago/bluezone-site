import { useEffect, useState } from 'react'
import { resolveImage } from './images'

/** Capa da notícia: aceita URL https ou referência `img:<id>` (imagem enviada pelo painel). Sem capa, não renderiza nada. */
export function CoverImage({ src, alt = '', className, loading = 'lazy' }: { src: string; alt?: string; className?: string; loading?: 'lazy' | 'eager' }) {
  const [url, setUrl] = useState(src.startsWith('img:') ? '' : src)
  useEffect(() => { let alive = true; resolveImage(src).then((u) => { if (alive) setUrl(u) }); return () => { alive = false } }, [src])
  if (!url) return null
  return <img src={url} alt={alt} className={className} loading={loading} decoding="async" />
}
