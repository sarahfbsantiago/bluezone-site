import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Markdown } from '../src/bluenews/Markdown'

vi.mock('../src/lib/firebase', () => ({ firebaseEnabled: false, db: () => { throw new Error('sem firebase') }, auth: () => { throw new Error('sem firebase') } }))

const { slugify, validatePost } = await import('../src/bluenews/posts')

describe('BlueNews', () => {
  it('gera endereço amigável a partir do título', () => {
    expect(slugify('Como vender sem parecer insistente!')).toBe('como-vender-sem-parecer-insistente')
    expect(slugify('  Ação & Reação  ')).toBe('acao-reacao')
  })

  it('valida os campos da notícia antes de gravar', () => {
    const base = { title: 'Título de teste', slug: 'titulo-de-teste', category: 'marketing', excerpt: '', content: 'Texto com mais de vinte caracteres para valer.', coverUrl: '', author: 'Equipe', status: 'draft' as const }
    expect(validatePost(base)).toEqual([])
    expect(validatePost({ ...base, title: 'ab', coverUrl: 'http://inseguro', category: 'x' })).toEqual(['título muito curto', 'seção inválida', 'imagem de capa precisa ser um endereço https://'])
  })

  it('renderiza o texto com formatação básica sem HTML cru', () => {
    render(<Markdown text={'# Título\n\nParágrafo com **negrito** e [link](https://abluezone.com.br).\n\n- item um\n- item dois\n\n<script>alert(1)</script>'} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Título')
    expect(screen.getByText('negrito').tagName).toBe('STRONG')
    expect(screen.getByRole('link', { name: 'link' })).toHaveAttribute('href', 'https://abluezone.com.br')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
  })
})
