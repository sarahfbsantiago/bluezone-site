import { describe, expect, it } from 'vitest'
import { captionForPosting, captionLength, emptyContent, monthGrid, pending, validateContent, type Content } from '../src/adm/content'
import { PATH_RE } from '../src/adm/media'
import { AREAS, canSee } from '../src/adm/site'

const base = (patch: Partial<Content> = {}): Content => ({ id: 'x', channel: 'instagram', format: 'feed', topic: 'tema de teste', caption: '', hashtags: '', media: [], date: '', notes: '', status: 'ideia', createdBy: 'a@b.co', ...patch })

describe('Bluezone.adm', () => {
  it('papéis: editor vê hoje, publicar, BlueNews e marca; admin vê tudo', () => {
    const editor = AREAS.filter((a) => canSee(a.id, 'editor')).map((a) => a.id)
    expect(editor).toEqual(['hoje', 'publicar', 'bluenews', 'marca'])
    expect(AREAS.every((a) => canSee(a.id, 'admin'))).toBe(true)
  })

  it('valida o post: canal/formato, tema, limite de legenda por canal, mídia só por caminho do Storage, aprovado exige data', () => {
    const ok = { ...emptyContent('a@b.co'), topic: 'Frase de posicionamento' }
    expect(validateContent(ok)).toEqual([])
    expect(validateContent({ ...ok, format: 'short' })).toContain('formato inválido para o canal')
    expect(validateContent({ ...ok, topic: 'ab' })).toContain('dê um tema ao post (mínimo 3 caracteres)')
    expect(validateContent({ ...ok, channel: 'linkedin', format: 'post', caption: 'x'.repeat(3001) })).toContain('legenda acima do limite do LinkedIn (3000)')
    expect(validateContent({ ...ok, media: ['https://evil.example/x.jpg'] })).toContain('mídia inválida')
    expect(validateContent({ ...ok, media: ['conteudo/1-abc-foto.jpg'] })).toEqual([])
    expect(validateContent({ ...ok, status: 'aprovado' })).toContain('post aprovado precisa de data')
    expect(validateContent({ ...ok, status: 'aprovado', date: '2026-09-20' })).toEqual([])
    expect(validateContent({ ...ok, date: '20/09/2026' })).toContain('data inválida')
  })

  it('caminhos de mídia: só conteudo/ e marca/, sem barras extras nem caracteres estranhos', () => {
    expect(PATH_RE.test('conteudo/1726500000-ab12cd-frase.jpg')).toBe(true)
    expect(PATH_RE.test('marca/logo.png')).toBe(true)
    expect(PATH_RE.test('noticias/x.jpg')).toBe(false)
    expect(PATH_RE.test('conteudo/../admins/x')).toBe(false)
    expect(PATH_RE.test('conteudo/a/b.jpg')).toBe(false)
  })

  it('legenda para colar junta hashtags com linha em branco e conta tudo', () => {
    expect(captionForPosting({ caption: 'Oi ', hashtags: '#a #b' })).toBe('Oi\n\n#a #b')
    expect(captionLength({ caption: 'abc', hashtags: '#a' })).toBe(6)
    expect(captionLength({ caption: 'abc', hashtags: '' })).toBe(3)
  })

  it('pendências: para postar hoje, atrasados, esperando aprovação e próximos 7 dias', () => {
    const items = [
      base({ id: 'hoje', status: 'aprovado', date: '2026-09-16' }),
      base({ id: 'atrasado', status: 'aprovado', date: '2026-09-10' }),
      base({ id: 'rascunho', status: 'rascunho', date: '2026-09-18' }),
      base({ id: 'longe', status: 'aprovado', date: '2026-10-01' }),
      base({ id: 'postado', status: 'postado', date: '2026-09-10' }),
    ]
    const p = pending(items, '2026-09-16')
    expect(p.toPost.map((c) => c.id)).toEqual(['hoje'])
    expect(p.late.map((c) => c.id)).toEqual(['atrasado'])
    expect(p.toApprove.map((c) => c.id)).toEqual(['rascunho'])
    expect(p.next7.map((c) => c.id)).toEqual(['rascunho'])
  })

  it('calendário: 42 células a partir da segunda, com os posts do dia e sem arquivados', () => {
    const grid = monthGrid(2026, 8, [base({ id: 'a', date: '2026-09-16' }), base({ id: 'b', date: '2026-09-16', status: 'arquivado' })])
    expect(grid).toHaveLength(42)
    expect(grid[0].key).toBe('2026-08-31')
    expect(grid[0].inMonth).toBe(false)
    const day = grid.find((c) => c.key === '2026-09-16')!
    expect(day.inMonth).toBe(true)
    expect(day.items.map((c) => c.id)).toEqual(['a'])
  })
})
