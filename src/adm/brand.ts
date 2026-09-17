import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

/** Guia da marca (área Marca): como a Bluezone fala. Documento `marca/guia`; editores leem, administradores editam. */
export type Reference = { path: string; nota: string }
export type Brand = {
  paleta: string
  tipografia: string
  logos: string[]
  referencias: Reference[]
  tom: string
  usamos: string
  evitamos: string
  ctas: string
  publico: string
  exemplosBons: string
  exemplosRuins: string
  fontesNoticias: string
}
export type TextField = Exclude<keyof Brand, 'logos' | 'referencias'>
export const VISUAL_FIELDS: Array<{ id: 'paleta' | 'tipografia'; label: string; hint: string; rows: number }> = [
  { id: 'paleta', label: 'paleta', hint: 'Cores e quando usar cada uma. Ex.: azul #1f6dff (destaque), carbono #0b0f14 (fundo), laranja #ff8a2a (só Blueprint).', rows: 4 },
  { id: 'tipografia', label: 'tipografia', hint: 'Fontes e hierarquia. Ex.: IBM Plex Mono em tudo; títulos em negrito, texto em regular; nunca itálico.', rows: 3 },
]
export const BRAND_FIELDS: Array<{ id: TextField; label: string; hint: string; rows: number }> = [
  { id: 'tom', label: 'tom de voz', hint: 'Como a Bluezone fala: direta, próxima, sem jargão? Em que pessoa? Que humor?', rows: 4 },
  { id: 'publico', label: 'para quem falamos', hint: 'Quem é a pessoa do outro lado: dono de negócio pequeno, momento dela, dores e o que ela quer ouvir.', rows: 4 },
  { id: 'usamos', label: 'palavras e expressões que usamos', hint: 'Uma por linha. Ex.: direção, estratégia em movimento, crescer com estrutura.', rows: 5 },
  { id: 'evitamos', label: 'o que nunca dizemos', hint: 'Uma por linha. Ex.: "alavancar", promessas de resultado, gírias de coach.', rows: 5 },
  { id: 'ctas', label: 'chamadas para ação', hint: 'Como a gente convida: "chama no WhatsApp", "conhece o Blueprint"…', rows: 3 },
  { id: 'exemplosBons', label: 'exemplos que ficaram bons', hint: 'Cole legendas ou trechos aprovados, um por bloco, e por que funcionaram.', rows: 8 },
  { id: 'exemplosRuins', label: 'exemplos que não funcionaram', hint: 'O que a gente já reprovou e o motivo. É o que mais ensina a geração.', rows: 6 },
  { id: 'fontesNoticias', label: 'fontes de notícias da BlueNews', hint: 'Uma por linha: nome e endereço do feed ou do site, com a seção entre parênteses.', rows: 6 },
]
export const EMPTY_BRAND: Brand = { paleta: '', tipografia: '', logos: [], referencias: [], tom: '', usamos: '', evitamos: '', ctas: '', publico: '', exemplosBons: '', exemplosRuins: '', fontesNoticias: '' }
export const BRAND_LIMIT = 6000
export const BRAND_MAX_FILES = 30

export async function getBrand(): Promise<Brand> {
  const snap = await getDoc(doc(db(), 'marca', 'guia'))
  if (!snap.exists()) return EMPTY_BRAND
  const data = snap.data()
  const out: Brand = { ...EMPTY_BRAND }
  for (const f of [...BRAND_FIELDS, ...VISUAL_FIELDS]) out[f.id] = String(data[f.id] ?? '')
  out.logos = Array.isArray(data.logos) ? (data.logos as unknown[]).filter((x): x is string => typeof x === 'string') : []
  out.referencias = Array.isArray(data.referencias) ? (data.referencias as Array<Record<string, unknown>>).map((r) => ({ path: String(r?.path ?? ''), nota: String(r?.nota ?? '') })).filter((r) => r.path) : []
  return out
}
export async function saveBrand(brand: Brand, by: string): Promise<void> {
  await setDoc(doc(db(), 'marca', 'guia'), { ...brand, updatedBy: by, updatedAt: serverTimestamp() })
}
