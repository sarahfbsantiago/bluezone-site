import { deleteObject, getBlob, getStorage, ref, uploadBytes } from 'firebase/storage'

/**
 * Mídia do painel (posts em `conteudo/`, identidade da marca em `marca/`). Segurança: nada vira URL pública. Guardamos
 * só o caminho no Storage e lemos o arquivo pelo SDK com o login da pessoa (as regras do Storage exigem equipe).
 * Imagens até 5 MB, vídeos até 200 MB (as regras conferem de novo no servidor).
 */
export type Folder = 'conteudo' | 'marca'
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime']
export const MAX_IMAGE = 5 * 1024 * 1024
export const MAX_VIDEO = 200 * 1024 * 1024
export const PATH_RE = /^(conteudo|marca)\/[A-Za-z0-9._-]{1,120}$/

export async function uploadMedia(file: Blob, name: string, type: string, folder: Folder = 'conteudo'): Promise<string> {
  if (IMAGE_TYPES.includes(type) && file.size > MAX_IMAGE) throw new Error('imagem acima de 5 MB')
  if (VIDEO_TYPES.includes(type) && file.size > MAX_VIDEO) throw new Error('vídeo acima de 200 MB')
  if (!IMAGE_TYPES.includes(type) && !VIDEO_TYPES.includes(type)) throw new Error('envie JPG, PNG, WebP, MP4 ou MOV')
  if (folder === 'marca' && !IMAGE_TYPES.includes(type)) throw new Error('na marca entram só imagens')
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'video/mp4' ? 'mp4' : type === 'video/quicktime' ? 'mov' : 'jpg'
  const safe = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'arquivo'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.${ext}`
  await uploadBytes(ref(getStorage(), path), file, { contentType: type, cacheControl: 'private, max-age=0' })
  return path
}

export async function deleteMedia(path: string): Promise<void> {
  if (!PATH_RE.test(path)) return
  try { await deleteObject(ref(getStorage(), path)) } catch { /* já removida */ }
}

export function isVideo(path: string): boolean { return /\.(mp4|mov)$/i.test(path) }

const cache = new Map<string, Promise<string>>()
/** Endereço local (blob:) para mostrar a mídia; lido pelo SDK, respeitando as regras. Cacheado por sessão. */
export function mediaUrl(path: string): Promise<string> {
  let pending = cache.get(path)
  if (!pending) {
    pending = getBlob(ref(getStorage(), path)).then((blob) => URL.createObjectURL(blob))
    pending.catch(() => cache.delete(path))
    cache.set(path, pending)
  }
  return pending
}

/** Baixa um arquivo pelo navegador (mídia do Storage por caminho, ou um Blob gerado). */
export async function download(source: string | Blob, filename: string): Promise<void> {
  const blob = typeof source === 'string' ? await getBlob(ref(getStorage(), source)) : source
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 10000)
}
