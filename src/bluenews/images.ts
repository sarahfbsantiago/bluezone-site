import { deleteDoc, doc, getDoc } from 'firebase/firestore'
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, firebaseEnabled } from '../lib/firebase'

/**
 * Imagens das notícias: reduzidas no navegador (máx. 1600px, WebP/JPEG, ≤ 500 KB) e enviadas ao Cloud Storage
 * (pasta `noticias/`); a capa guarda a URL pública. Referências antigas `img:<id>` (guardadas no Firestore antes do Storage)
 * continuam sendo lidas.
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
  const ext = image.dataUrl.startsWith('data:image/webp') ? 'webp' : 'jpg'
  const name = `noticias/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const fileRef = ref(getStorage(), name)
  await uploadString(fileRef, image.dataUrl, 'data_url', { cacheControl: 'public, max-age=31536000, immutable' })
  return getDownloadURL(fileRef)
}

export async function deleteImage(refId: string): Promise<void> {
  if (refId.startsWith('img:')) { await deleteDoc(doc(db(), 'images', refId.slice(4))); return }
  if (refId.includes('firebasestorage.googleapis.com')) { try { await deleteObject(ref(getStorage(), refId)) } catch { /* já removida */ } }
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
