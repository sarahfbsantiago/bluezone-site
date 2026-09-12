import { useEffect, useRef, useState } from 'react'
import { pages } from '../config/pagesConfig'
import { siteConfig } from '../config/siteConfig'
import { withBase } from '../../../lib/paths'
import type { Theme } from '../hooks/useTheme'
import { BrandLogo } from './BrandLogo'
import { ThemeToggle } from './ThemeToggle'

/** Itens do menu (header e footer). */
export const navItems = [
  { label: 'marca', href: withBase(`/#${pages.two.id}`) },
  { label: 'história', href: withBase(`/#${pages.story.id}`) },
  { label: 'quem somos', href: withBase(`/#${pages.three.id}`) },
  { label: 'soluções', href: withBase(`/#${pages.solutions.id}`) },
  { label: 'clientes', href: withBase(`/#${pages.testimonials.id}`) },
  { label: 'produtos', href: withBase(`/#${pages.products.id}`) },
  { label: 'nosso time', href: withBase(`/#${pages.team.id}`) },
  { label: pages.blog.label, href: withBase(pages.blog.href) },
] as const

/** Item de contato: botão no desktop, último item do painel no mobile. */
export const contactItem = { label: 'contato', href: withBase(`/#${pages.contact.id}`) } as const

type SiteHeaderProps = { theme: Theme; onToggleTheme: () => void; site?: 'home' | 'bluenews' | 'blueprint' }

/** Itens do header da BlueNews: as seções do portal (o menu do site fica no footer, com "voltar ao site"). */
export const blogNavItems = pages.blog.categories.map((category) => ({ label: category.label, href: `#${category.id}` }))

/** Itens do header do Blueprint: as seções da página de vendas. O botão do header é o de compra (Kiwify). */
export const blueprintNavItems = [
  { label: 'o curso', href: '#o-que-e' },
  { label: 'para quem', href: '#para-quem' },
  { label: 'conteúdo', href: '#conteudo' },
  { label: 'resultados', href: '#resultados' },
  { label: 'oferta', href: '#oferta' },
  { label: 'idealizadores', href: '#idealizadores' },
  { label: 'dúvidas', href: '#duvidas' },
] as const
export const buyItem = { label: 'comprar agora', href: siteConfig.blueprintCourse } as const

/** Header de vidro fixo. Em `site="bluenews"`, o logotipo vira BlueNews e o menu mostra as seções do portal; em `site="blueprint"`, logotipo Blueprint, seções da página de vendas e botão de compra (sem sol/lua: a página é sempre escura). Clicar no logotipo sempre volta ao topo do site. */
export function SiteHeader({ theme, onToggleTheme, site = 'home' }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const nav = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const onClick = (event: MouseEvent) => { if (nav.current && !nav.current.contains(event.target as Node)) setOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onClick) }
  }, [open])
  const items = site === 'bluenews' ? blogNavItems : site === 'blueprint' ? blueprintNavItems : navItems
  const action = site === 'blueprint' ? buyItem : contactItem
  const external = site === 'blueprint' ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const brandLabel = site === 'bluenews' ? 'BlueNews, voltar ao início do site' : site === 'blueprint' ? 'Blueprint, voltar ao início do site' : 'Bluezone, início'
  return (
    <header className={`site-header${open ? ' is-open' : ''}${site !== 'home' ? ' header-blog' : ''}`}>
      <a href={withBase('/#top')} className="header-brand" aria-label={brandLabel}><BrandLogo variant={site === 'home' ? 'bluezone' : site} /></a>
      <nav ref={nav} id="site-nav" className="site-nav" aria-label="Navegação principal">
        {items.map((item) => <a key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
        <a className="nav-contact" href={action.href} onClick={() => setOpen(false)} {...external}>{action.label}</a>
      </nav>
      <div className="header-actions">
        {site !== 'blueprint' && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
        <a className="header-cta" href={action.href} {...external}>{action.label}</a>
        <button type="button" className="menu-toggle" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((value) => !value)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
