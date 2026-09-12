import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from '../src/features/home/HomePage'
import { heroStates } from '../src/features/home/config/heroConfig'

describe('Bluezone home hero', () => {
  afterEach(() => cleanup())

  it('renderiza a marca oficial, o headline no DOM e controles acessíveis', () => {
    render(<HomePage />)
    expect(screen.getAllByAltText('Bluezone')[0]).toHaveAttribute('src', '/logo-bluezone.png')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('estratégia em movimento.')
    expect(screen.getByText('estratégia')).toBeInTheDocument()
    expect(screen.getByText('em movimento.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo estado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Estado anterior' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Estados da experiência' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  })

  it('oferece o WhatsApp em nova aba com o número da Bluezone', () => {
    render(<HomePage />)
    const link = screen.getByRole('link', { name: 'Falar com a Bluezone no WhatsApp' })
    expect(link).toHaveAttribute('href', 'https://wa.me/5531993341543')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link.querySelector('.whatsapp-label')).toHaveTextContent('chame a gente!') // reduced motion no setup: texto completo
  })

  it('usa a marca oficial como fallback estável quando não há WebGL', () => {
    render(<HomePage />)
    expect(document.querySelector('.hero-fallback .brand-mark')).toBeInTheDocument()
    expect(document.querySelector('.home-page')).toHaveClass('scene-fallback')
  })

  it('troca o estado pelas setas, percorre os cinco estados e volta ao primeiro', () => {
    render(<HomePage />)
    const next = screen.getByRole('button', { name: 'Próximo estado' })
    fireEvent.click(next)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('criatividade com direção.')
    fireEvent.click(next)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('da marca ao crescimento.')
    expect(screen.getByRole('tab', { name: 'Estado 3' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(next)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('do analógico ao digital.')
    fireEvent.click(next)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IA com direção humana.')
    expect(screen.getByRole('tablist', { name: 'Estados da experiência' }).querySelectorAll('[role="tab"]')).toHaveLength(5)
    fireEvent.click(next)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('estratégia em movimento.')
  })

  it('navega pelo teclado com as setas e mantém foco visível nos controles', () => {
    render(<HomePage />)
    const next = screen.getByRole('button', { name: 'Próximo estado' })
    next.focus()
    expect(document.activeElement).toBe(next)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heroStates[1].headline.join(' '))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heroStates[0].headline.join(' '))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heroStates[heroStates.length - 1].headline.join(' '))
  })

  it('seleciona um estado direto pelo indicador', () => {
    render(<HomePage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Estado 2' }))
    expect(screen.getByText('criatividade')).toBeInTheDocument()
  })

  it('renderiza as páginas 2 e 3 com os textos combinados', () => {
    render(<HomePage />)
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Transformamos pequenos e médios empreendedores em negócios e marcas preparadas para crescer')
    expect(document.querySelector('.page-text')).toHaveTextContent('A Bluezone é uma assessoria de comunicação, estratégia e tecnologia')
    expect(screen.getByText('Somos a estrutura estratégica por trás de quem quer crescer, mas não quer crescer no improviso.', { exact: false })).toBeInTheDocument()
    expect(document.querySelector('.page-three .page-paragraphs strong')).toHaveTextContent('clara, profissional e estratégica')
    expect(document.getElementById('page-two')).toBeInTheDocument()
    expect(document.getElementById('page-three')).toBeInTheDocument()
    expect(document.getElementById('page-four')).toBeInTheDocument()
    expect(screen.getByText('Criamos direção para fazê-la crescer e permanecer.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Espaço reservado para o vídeo' })).toBeInTheDocument()
    expect(screen.getByText('03 — quem somos')).toBeInTheDocument()
    expect(screen.getByText('02 — história')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /continuar/ })).toHaveLength(8)
    expect(document.getElementById('historia')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Você já ouviu falar nas "Zonas Azuis"?' })).toBeInTheDocument()
    expect(document.getElementById('contato')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Entre em contato' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Bluezone')
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(nav.querySelector('a[href="/#contato"]')).toBeInTheDocument()
    expect(nav.querySelector('a[href="/#historia"]')).toHaveTextContent('história')
    expect(nav.querySelector('a[href="/#page-two"]')).toHaveTextContent('marca')
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual(['marca', 'história', 'quem somos', 'soluções', 'clientes', 'produtos', 'nosso time', 'bluenews', 'contato'])
    expect(nav.querySelector('a[href="/bluenews"]')).toHaveTextContent('bluenews')
    expect(document.querySelector('.header-cta')).toHaveTextContent('contato')
    expect(screen.getByRole('list', { name: 'Redes sociais' }).children).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/abluezone/')
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', expect.stringContaining('linkedin.com/company/bluezone-marketing-vendas'))
    expect(screen.getByRole('link', { name: 'TikTok' })).toHaveAttribute('href', 'https://www.tiktok.com/@bluezon_e')
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', expect.stringContaining('facebook.com/people/Bluezone-Marketing-Vendas'))
    expect(nav).toHaveTextContent('quem somos')
    expect(nav).toHaveTextContent('soluções')
    expect(nav).toHaveTextContent('clientes')
    expect(nav).toHaveTextContent('produtos')
    expect(nav).toHaveTextContent('nosso time')
    expect(nav).not.toHaveTextContent('parceiros')
    expect(document.getElementById('clientes')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'O que nossos clientes dizem sobre nós.' })).toBeInTheDocument()
    expect(document.querySelectorAll('.carousel-card')).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Próximo depoimento' }))
    expect(screen.getByRole('tab', { name: 'Depoimento 2' })).toHaveAttribute('aria-selected', 'true')
    expect(document.getElementById('produtos')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'O que estamos construindo.' })).toBeInTheDocument()
    expect(screen.getAllByText('em breve')).toHaveLength(4)
    expect(screen.getByRole('link', { name: /conheça o Blueprint/ })).toHaveAttribute('href', '/blueprint')
    expect(document.getElementById('solucoes')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Comunicação, estratégia e tecnologia que trabalham juntas.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Clareza antes de execução.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Para quem constrói um negócio de verdade.' })).toBeInTheDocument()
    expect(document.getElementById('time')).toBeInTheDocument()
    expect(document.querySelectorAll('.team-card')).toHaveLength(7)
    expect(screen.getByText('Sarah Santiago')).toBeInTheDocument()
    expect(screen.getByText('Hebert Coutinho')).toBeInTheDocument()
    expect(screen.getByText('Isabela Lima')).toBeInTheDocument()
    expect(screen.getByText('Alisson Werneck')).toBeInTheDocument()
    expect(screen.getByText('Co-founder da Bluezone')).toBeInTheDocument()
  })

  it('espelha o progresso da rolagem em páginas na variável --p', () => {
    render(<HomePage />)
    const main = document.querySelector('.home-page') as HTMLElement
    expect(main.style.getPropertyValue('--p')).toBe('0.0000')
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true })
    fireEvent.scroll(window)
    expect(main.style.getPropertyValue('--p')).toBe('1.5000')
    Object.defineProperty(window, 'scrollY', { value: 99999, configurable: true })
    fireEvent.scroll(window)
    expect(main.style.getPropertyValue('--p')).toBe('6.0000')
    expect(main.style.getPropertyValue('--pc')).toBe('1.0000')
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })

  it('alterna entre modo claro e escuro e lembra a escolha', () => {
    window.localStorage.removeItem('bluezone-theme')
    render(<HomePage />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.querySelector('.home-page')).toHaveClass('theme-dark')
    fireEvent.click(screen.getByRole('button', { name: 'Ativar modo claro' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(window.localStorage.getItem('bluezone-theme')).toBe('light')
    fireEvent.click(screen.getByRole('button', { name: 'Ativar modo escuro' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('abre e fecha o menu no mobile', () => {
    render(<HomePage />)
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    fireEvent.click(toggle)
    expect(document.querySelector('.site-header')).toHaveClass('is-open')
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.querySelector('.site-header')).not.toHaveClass('is-open')
    // o X fecha de verdade: o "apertar" no botão não conta como clique fora
    fireEvent.click(toggle)
    expect(document.querySelector('.site-header')).toHaveClass('is-open')
    fireEvent.pointerDown(toggle)
    fireEvent.click(toggle)
    expect(document.querySelector('.site-header')).not.toHaveClass('is-open')
  })

  it('passa os estados sozinho depois da entrada e pausa com interação', () => {
    vi.useFakeTimers()
    try {
      // fora de reduced motion (o setup do teste força reduce; simula o contrário aqui)
      const original = window.matchMedia
      window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia
      render(<HomePage />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('estratégia em movimento.')
      act(() => { vi.advanceTimersByTime(3400) }) // fim da entrada (interface)
      act(() => { vi.advanceTimersByTime(6200) }) // um intervalo da troca automática
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('criatividade com direção.')
      fireEvent.click(screen.getByRole('button', { name: 'Estado anterior' }))
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('estratégia em movimento.')
      act(() => { vi.advanceTimersByTime(6200) }) // dentro da pausa de 12 s: não troca
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('estratégia em movimento.')
      window.matchMedia = original
    } finally {
      vi.useRealTimers()
    }
  })

  it('não troca sozinho com reduced motion', () => {
    vi.useFakeTimers()
    try {
      render(<HomePage />)
      act(() => { vi.advanceTimersByTime(20000) })
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('estratégia em movimento.')
    } finally {
      vi.useRealTimers()
    }
  })

  it('respeita reduced motion sem esconder a interface', () => {
    render(<HomePage />)
    expect(document.querySelector('.home-page')).toHaveClass('reduced-motion')
    expect(document.querySelector('.home-page')).toHaveClass('intro-ready')
  })
})
