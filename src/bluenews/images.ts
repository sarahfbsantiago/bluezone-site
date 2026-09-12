import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, firebaseEnabled } from '../lib/firebase'

/**
 * Imagens das notícias. Enquanto o projeto não tem Cloud Storage (exige plano Blaze), a imagem é reduzida no navegador
 * (máx. 1600px, WebP/JPEG) e guardada na coleção `images` como data URL (≤ 500 KB). A capa da notícia guarda `img:<id>`.
 * Quando o Storage entrar, só a função de envio muda; o painel e o portal continuam iguais.
 */
export const MAX_BYTES = 500 * 1024
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp']

export type Compressed = { dataUrl: string; width: number; height: number; bytes: number }

export async function compressImage(file: File, maxWidth = 1600): Promise<Compressed> {
  if (!ACCEPT.includes(file.type)) throw new Error('envie uma imagem PNG, JPG ou WebP')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('não foi possível processar a imagem')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()
  const type = canvas.toDataURL('image/webp', 0.5).startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
  for (const quality of [0.86, 0.78, 0.7, 0.6, 0.5]) {
    const dataUrl = canvas.toDataURL(type, quality)
    const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
    if (bytes <= MAX_BYTES) return { dataUrl, width, height, bytes }
  }
  throw new Error('imagem grande demais mesmo comprimida; tente uma imagem menor')
}

export async function uploadImage(image: Compressed): Promise<string> {
  const ref = await addDoc(collection(db(), 'images'), { data: image.dataUrl, width: image.width, height: image.height, bytes: image.bytes, createdAt: serverTimestamp() })
  return `img:${ref.id}`
}

export async function deleteImage(refId: string): Promise<void> {
  if (!refId.startsWith('img:')) return
  await deleteDoc(doc(db(), 'images', refId.slice(4)))
}

const cache = new Map<string, Promise<string>>()

/** Resolve a referência da capa para algo que o <img> mostre: URL https direto, ou `img:<id>` lido do banco. */
export function resolveImage(ref: string): Promise<string> {
  if (!ref) return Promise.resolve('')
  if (!ref.startsWith('img:')) return Promise.resolve(ref)
  if (!firebaseEnabled) return Promise.resolve('')
  let pending = cache.get(ref)
  if (!pending) {
    pending = getDoc(doc(db(), 'images', ref.slice(4))).then((snap) => (snap.exists() ? String(snap.data().data ?? '') : ''))
    cache.set(ref, pending)
  }
  return pending
}
