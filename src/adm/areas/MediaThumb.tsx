import { useEffect, useState } from 'react'
import { isVideo, mediaUrl } from '../media'

/** Mostra uma mídia do Storage (imagem ou vídeo) lida pelo SDK com o login da pessoa. `demo` mostra um quadro vazio. */
export function MediaThumb({ path, className = '', demo = false }: { path: string; className?: string; demo?: boolean }) {
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (demo) return
    let alive = true
    mediaUrl(path).then((url) => { if (alive) setSrc(url) }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [path, demo])
  if (failed) return <span className={`adm-thumb is-failed ${className}`} title="não foi possível carregar">×</span>
  if (!src) return <span className={`adm-thumb is-loading ${className}`} />
  return isVideo(path) ? <video className={className} src={src} muted playsInline /> : <img className={className} src={src} alt="" />
}
