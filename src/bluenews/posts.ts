import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where, limit, type Timestamp } from 'firebase/firestore'
import { db, firebaseEnabled } from '../lib/firebase'
import { pages } from '../features/home/config/pagesConfig'

export type PostStatus = 'draft' | 'published'
export type Post = {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  coverUrl: string
  author: string
  status: PostStatus
  createdAt?: Timestamp
  updatedAt?: Timestamp
  publishedAt?: Timestamp | null
}
export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>

export const CATEGORIES = pages.blog.categories.map((c) => ({ id: c.id, label: c.title }))

/** Endereço amigável a partir do título: sem acentos, minúsculas, hífens. */
export function slugify(title: string): string {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

const LIMITS = { title: 140, excerpt: 300, content: 20000, coverUrl: 500, author: 80 }

/** Garante tamanhos e valores válidos antes de gravar (as regras do Firestore conferem de novo no servidor). */
export function validatePost(input: PostInput): string[] {
  const problems: string[] = []
  if (input.title.trim().length < 3) problems.push('título muito curto')
  if (input.title.length > LIMITS.title) problems.push('título muito longo')
  if (!CATEGORIES.some((c) => c.id === input.category)) problems.push('seção inválida')
  if (input.excerpt.length > LIMITS.excerpt) problems.push('resumo muito longo')
  if (input.content.trim().length < 20) problems.push('texto muito curto')
  if (input.content.length > LIMITS.content) problems.push('texto muito longo')
  if (input.coverUrl && !/^https:\/\/[^\s]+$/.test(input.coverUrl) && !/^img:[A-Za-z0-9_-]+$/.test(input.coverUrl)) problems.push('imagem de capa precisa ser um endereço https:// ou uma imagem enviada')
  if (input.coverUrl.length > LIMITS.coverUrl) problems.push('endereço da capa muito longo')
  if (!['draft', 'published'].includes(input.status)) problems.push('status inválido')
  return problems
}

function postsRef() { return collection(db(), 'posts') }
function fromDoc(id: string, data: Record<string, unknown>): Post {
  return { id, title: String(data.title ?? ''), slug: String(data.slug ?? ''), category: String(data.category ?? ''), excerpt: String(data.excerpt ?? ''), content: String(data.content ?? ''), coverUrl: String(data.coverUrl ?? ''), author: String(data.author ?? ''), status: (data.status as PostStatus) ?? 'draft', createdAt: data.createdAt as Timestamp, updatedAt: data.updatedAt as Timestamp, publishedAt: (data.publishedAt as Timestamp) ?? null }
}

/** Notícias publicadas, mais recentes primeiro (leitura pública). */
export async function listPublished(max = 50): Promise<Post[]> {
  if (!firebaseEnabled) return []
  const snap = await getDocs(query(postsRef(), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(max)))
  return snap.docs.map((d) => fromDoc(d.id, d.data()))
}

export async function getPublishedBySlug(slug: string): Promise<Post | null> {
  if (!firebaseEnabled) return null
  const snap = await getDocs(query(postsRef(), where('slug', '==', slug), where('status', '==', 'published'), limit(1)))
  return snap.empty ? null : fromDoc(snap.docs[0].id, snap.docs[0].data())
}

/** Todas as notícias (rascunhos incluídos) — só para administradores logados. */
export async function listAll(): Promise<Post[]> {
  const snap = await getDocs(query(postsRef(), orderBy('updatedAt', 'desc'), limit(200)))
  return snap.docs.map((d) => fromDoc(d.id, d.data()))
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await getDoc(doc(db(), 'posts', id))
  return snap.exists() ? fromDoc(snap.id, snap.data()) : null
}

export async function createPost(input: PostInput): Promise<string> {
  const now = serverTimestamp()
  const ref = await addDoc(postsRef(), { ...input, slug: input.slug || slugify(input.title), createdAt: now, updatedAt: now, publishedAt: input.status === 'published' ? now : null })
  return ref.id
}

export async function updatePost(id: string, input: PostInput, wasPublished: boolean): Promise<void> {
  const now = serverTimestamp()
  const publishedAt = input.status === 'published' ? (wasPublished ? undefined : now) : null
  await updateDoc(doc(db(), 'posts', id), { ...input, slug: input.slug || slugify(input.title), updatedAt: now, ...(publishedAt === undefined ? {} : { publishedAt }) })
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'posts', id))
}
