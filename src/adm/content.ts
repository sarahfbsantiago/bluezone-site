import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { PATH_RE } from './media'

/**
 * Conteúdo da Bluezone nas redes (área Publicar): um documento por post, em qualquer canal.
 * Coleção `conteudos` no Firestore; mídia na pasta `conteudo/` do Storage. Postagem manual por enquanto:
 * a pessoa baixa mídia e legenda pelo painel e posta pelo celular.
 */
export type ChannelId = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin'
export type Status = 'ideia' | 'rascunho' | 'aprovado' | 'postado' | 'arquivado'
export const STATUSES: Array<{ id: Status; label: string }> = [
  { id: 'ideia', label: 'ideia' }, { id: 'rascunho', label: 'rascunho' }, { id: 'aprovado', label: 'aprovado' }, { id: 'postado', label: 'postado' }, { id: 'arquivado', label: 'arquivado' },
]

export type Format = { id: string; label: string; w: number; h: number; video?: boolean; multi?: boolean }
export type Channel = { id: ChannelId; label: string; handle: string; caption: number; formats: Format[] }

/** Canais, formatos (tamanho da mídia) e limite de legenda de cada rede. */
export const CHANNELS: Channel[] = [
  { id: 'instagram', label: 'Instagram', handle: '@abluezone', caption: 2200, formats: [
    { id: 'feed', label: 'feed (4:5)', w: 1080, h: 1350 },
    { id: 'carrossel', label: 'carrossel (4:5)', w: 1080, h: 1350, multi: true },
    { id: 'reels', label: 'reels (9:16)', w: 1080, h: 1920, video: true },
    { id: 'story', label: 'story (9:16)', w: 1080, h: 1920 },
  ] },
  { id: 'tiktok', label: 'TikTok', handle: '@bluezon_e', caption: 2200, formats: [
    { id: 'video', label: 'vídeo (9:16)', w: 1080, h: 1920, video: true },
  ] },
  { id: 'youtube', label: 'YouTube', handle: 'Bluezone', caption: 5000, formats: [
    { id: 'video', label: 'vídeo (16:9)', w: 1920, h: 1080, video: true },
    { id: 'short', label: 'short (9:16)', w: 1080, h: 1920, video: true },
  ] },
  { id: 'facebook', label: 'Facebook', handle: 'Bluezone Marketing & Vendas', caption: 63206, formats: [
    { id: 'post', label: 'post (4:5)', w: 1080, h: 1350 },
    { id: 'video', label: 'vídeo (16:9)', w: 1920, h: 1080, video: true },
  ] },
  { id: 'linkedin', label: 'LinkedIn', handle: 'Bluezone Marketing & Vendas', caption: 3000, formats: [
    { id: 'post', label: 'post (1:1)', w: 1080, h: 1080 },
    { id: 'carrossel', label: 'carrossel (documento 4:5)', w: 1080, h: 1350, multi: true },
  ] },
]
export function channel(id: string): Channel { return CHANNELS.find((c) => c.id === id) ?? CHANNELS[0] }
export function format(channelId: string, formatId: string): Format { const c = channel(channelId); return c.formats.find((f) => f.id === formatId) ?? c.formats[0] }

export type Content = {
  id: string
  channel: ChannelId
  format: string
  topic: string
  caption: string
  hashtags: string
  media: string[]
  /** Data prevista, AAAA-MM-DD; vazio = sem data. */
  date: string
  notes: string
  status: Status
  createdBy: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
export type ContentInput = Omit<Content, 'id' | 'createdAt' | 'updatedAt'>

export const LIMITS = { topic: 140, hashtags: 600, notes: 2000, media: 20 }

export function emptyContent(createdBy: string): ContentInput {
  return { channel: 'instagram', format: 'feed', topic: '', caption: '', hashtags: '', media: [], date: '', notes: '', status: 'ideia', createdBy }
}

/** Confere tamanhos e valores antes de gravar (as regras do Firestore conferem de novo no servidor). */
export function validateContent(input: ContentInput): string[] {
  const problems: string[] = []
  const c = CHANNELS.find((x) => x.id === input.channel)
  if (!c) problems.push('canal inválido')
  else if (!c.formats.some((f) => f.id === input.format)) problems.push('formato inválido para o canal')
  if (input.topic.trim().length < 3) problems.push('dê um tema ao post (mínimo 3 caracteres)')
  if (input.topic.length > LIMITS.topic) problems.push('tema muito longo')
  if (c && input.caption.length > c.caption) problems.push(`legenda acima do limite do ${c.label} (${c.caption})`)
  if (input.hashtags.length > LIMITS.hashtags) problems.push('hashtags muito longas')
  if (input.notes.length > LIMITS.notes) problems.push('anotações muito longas')
  if (input.media.length > LIMITS.media) problems.push(`no máximo ${LIMITS.media} arquivos de mídia`)
  if (input.media.some((m) => !PATH_RE.test(m))) problems.push('mídia inválida')
  if (input.date && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) problems.push('data inválida')
  if (!STATUSES.some((s) => s.id === input.status)) problems.push('status inválido')
  if (input.status === 'aprovado' && !input.date) problems.push('post aprovado precisa de data')
  return problems
}

/** Quantos caracteres a legenda mais as hashtags ocupam no canal (as redes contam tudo junto). */
export function captionLength(input: Pick<ContentInput, 'caption' | 'hashtags'>): number {
  return input.caption.length + (input.hashtags ? 1 + input.hashtags.length : 0)
}

/** Texto pronto para colar na rede: legenda, linha em branco, hashtags. */
export function captionForPosting(input: Pick<ContentInput, 'caption' | 'hashtags'>): string {
  return [input.caption.trim(), input.hashtags.trim()].filter(Boolean).join('\n\n')
}

export function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Pendências para o Hoje: aprovados com data de hoje ou atrasados, e rascunhos esperando aprovação. */
export function pending(contents: Content[], today = todayKey()): { toPost: Content[]; late: Content[]; toApprove: Content[]; next7: Content[] } {
  const toPost = contents.filter((c) => c.status === 'aprovado' && c.date === today)
  const late = contents.filter((c) => c.status === 'aprovado' && c.date && c.date < today)
  const toApprove = contents.filter((c) => c.status === 'rascunho')
  const limit = new Date(today + 'T00:00:00'); limit.setDate(limit.getDate() + 7)
  const limitKey = todayKey(limit)
  const next7 = contents.filter((c) => (c.status === 'aprovado' || c.status === 'rascunho') && c.date && c.date > today && c.date <= limitKey).sort((a, b) => a.date.localeCompare(b.date))
  return { toPost, late, toApprove, next7 }
}

/** Dias do mês para o calendário: 42 células a partir da segunda-feira, com os posts de cada dia. */
export function monthGrid(year: number, month: number, contents: Content[]): Array<{ key: string; day: number; inMonth: boolean; items: Content[] }> {
  const first = new Date(year, month, 1)
  const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7))
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const key = todayKey(d)
    cells.push({ key, day: d.getDate(), inMonth: d.getMonth() === month, items: contents.filter((c) => c.date === key && c.status !== 'arquivado') })
  }
  return cells
}

function ref() { return collection(db(), 'conteudos') }
function fromDoc(id: string, data: Record<string, unknown>): Content {
  return { id, channel: (data.channel as ChannelId) ?? 'instagram', format: String(data.format ?? ''), topic: String(data.topic ?? ''), caption: String(data.caption ?? ''), hashtags: String(data.hashtags ?? ''), media: Array.isArray(data.media) ? (data.media as string[]) : [], date: String(data.date ?? ''), notes: String(data.notes ?? ''), status: (data.status as Status) ?? 'ideia', createdBy: String(data.createdBy ?? ''), createdAt: data.createdAt as Timestamp, updatedAt: data.updatedAt as Timestamp }
}
export async function listContents(): Promise<Content[]> {
  const snap = await getDocs(query(ref(), orderBy('updatedAt', 'desc')))
  return snap.docs.map((d) => fromDoc(d.id, d.data()))
}
export async function createContent(input: ContentInput): Promise<string> {
  const now = serverTimestamp()
  const created = await addDoc(ref(), { ...input, createdAt: now, updatedAt: now })
  return created.id
}
export async function updateContent(id: string, input: ContentInput): Promise<void> {
  await updateDoc(doc(db(), 'conteudos', id), { ...input, updatedAt: serverTimestamp() })
}
export async function deleteContent(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'conteudos', id))
}
