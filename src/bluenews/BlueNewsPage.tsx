import { useEffect, useMemo, useRef, useState } from 'react'
import { pages } from '../features/home/config/pagesConfig'
import { siteConfig } from '../features/home/config/siteConfig'
import { ContactForm } from '../features/home/components/ContactForm'
import { SocialLinks } from '../features/home/components/SocialLinks'
import { withBase } from '../lib/paths'
import { firebaseEnabled } from '../lib/firebase'
import { getPublishedBySlug, listPublished, CATEGORIES, type Post } from './posts'
import { Markdown } from './Markdown'
import { CoverImage } from './CoverImage'

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const dateLong = (d: Date) => `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
const dateShort = (post: Post) => (post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString('pt-BR') : '')
const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id
const postUrl = (slug: string) => withBase(`/bluenews?post=${slug}`)

/**
 * BlueNews: portal editorial em preto e branco, sem tema claro/escuro. Lê as notícias publicadas do Firestore.
 * Início: destaque + grade + seções (filtro por ?secao=) + newsletter. Notícia: ?post=<slug>.
 */
export function BlueNewsPage() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const slug = params.get('post')
  const contact = params.has('contato')
  const [section, setSection] = useState(params.get('secao') ?? '')
  const [posts, setPosts] = useState<Post[]>([])
  const [current, setCurrent] = useState<Post | null | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [subscribe, setSubscribe] = useState(false)
  const [copied, setCopied] = useState(false)
  const formBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    if (!firebaseEnabled) { setCurrent(null); setLoaded(true); return }
    listPublished().then(setPosts).catch(() => setPosts([])).finally(() => setLoaded(true))
    if (slug) getPublishedBySlug(slug).then(setCurrent).catch(() => setCurrent(null))
    else setCurrent(null)
  }, [slug])
  useEffect(() => {
    if (!subscribe || !formBox.current) return
    formBox.current.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    formBox.current.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true })
  }, [subscribe])

  const pick = (id: string) => {
    setSection(id)
    const url = new URL(window.location.href); url.searchParams.delete('post')
    if (id) url.searchParams.set('secao', id); else url.searchParams.delete('secao')
    window.history.replaceState(null, '', url.toString())
    setMenuOpen(false)
  }
  const visible = useMemo(() => (section ? posts.filter((p) => p.category === section) : posts), [posts, section])
  const featured = !section ? visible[0] : undefined
  const rest = featured ? visible.slice(1) : visible
  const related = current ? posts.filter((p) => p.id !== current.id).slice(0, 3) : []
  const share = current ? `${(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')}${withBase(`/bluenews?post=${current.slug}`)}` : ''

  const header = (
    <header className={`news-header${menuOpen ? ' is-open' : ''}`}>
      <a className="news-brand header-brand" href={withBase('/bluenews')} aria-label="BlueNews, início" onClick={(e) => { if (!slug) { e.preventDefault(); pick('') } }}>
        <img src={withBase('/logo-symbol.png')} alt="" decoding="async" /><span><b>Blue</b>News</span>
      </a>
      <nav className="news-nav" aria-label="Seções">
        {CATEGORIES.map((c) => <a key={c.id} href={`${withBase('/bluenews')}?secao=${c.id}`} className={section === c.id && !slug ? 'is-active' : undefined} onClick={(e) => { if (!slug) { e.preventDefault(); pick(c.id) } }}>{c.label}</a>)}
        <a className="news-contact" href={`${withBase('/bluenews')}?contato`}>contato</a>
      </nav>
      <button type="button" className="news-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}><span /><span /><span /></button>
    </header>
  )

  const footer = (
    <footer className="news-footer site-footer">
      <a href={withBase('/#top')} className="footer-brand news-footer-brand" aria-label="Bluezone, voltar ao site">Bluezone</a>
      <nav aria-label="Rodapé">
        <a className="nav-back" href={withBase('/#top')}>voltar ao site</a>
        <a href={`${withBase('/bluenews')}?contato`}>contato</a>
        <a href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">whatsapp</a>
        <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
      </nav>
      <SocialLinks />
      <p className="news-legal">© {siteConfig.year} Bluezone. Todos os direitos reservados.</p>
    </footer>
  )

  const card = (post: Post, big = false) => (
    <article key={post.id} className={`news-card${big ? ' is-featured' : ''}`}>
      <a href={postUrl(post.slug)}>
        {post.coverUrl ? <CoverImage src={post.coverUrl} loading={big ? 'eager' : 'lazy'} /> : <span className="news-card-empty" aria-hidden="true" />}
        <span className="news-kicker">{catLabel(post.category)}<i>·</i>{dateShort(post)}</span>
        <h2 className="news-card-title">{post.title}</h2>
        {post.excerpt && <p className="news-card-excerpt">{post.excerpt}</p>}
        <span className="news-more">ler notícia →</span>
      </a>
    </article>
  )

  if (contact) return (
    <main className="news">
      {header}
      <section className="news-post news-contact-page" aria-labelledby="blog-title">
        <a className="news-backlink" href={withBase('/bluenews')}>← todas as notícias</a>
        <span className="news-kicker">contato</span>
        <h1 id="blog-title" className="news-post-title">Fale com a BlueNews</h1>
        <p className="news-post-lead">Sugestões de pauta, histórias de empreendedores, parcerias de conteúdo ou dúvidas sobre a newsletter. Respondemos em até 1 dia útil.</p>
        <div className="news-form"><ContactForm variant="bluenews-contact" /></div>
      </section>
      {footer}
    </main>
  )

  if (slug && current === undefined) return <main className="news">{header}<p className="news-empty">carregando…</p>{footer}</main>

  if (slug && current) return (
    <main className="news">
      {header}
      <article className="news-post">
        <a className="news-backlink" href={withBase('/bluenews')}>← todas as notícias</a>
        <span className="news-kicker"><a href={`${withBase('/bluenews')}?secao=${current.category}`}>{catLabel(current.category)}</a><i>·</i>{current.author}<i>·</i>{dateShort(current)}</span>
        <h1 id="blog-title" className="news-post-title">{current.title}</h1>
        {current.excerpt && <p className="news-post-lead">{current.excerpt}</p>}
        {current.coverUrl && <CoverImage className="news-post-cover" src={current.coverUrl} loading="eager" />}
        <div className="news-post-body"><Markdown text={current.content} /></div>
        <div className="news-share">
          <span>compartilhar</span>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${current.title} — ${share}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <button type="button" onClick={() => navigator.clipboard?.writeText(share).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800) })}>{copied ? 'link copiado' : 'copiar link'}</button>
        </div>
        {related.length > 0 && <section className="news-related" aria-label="Leia também"><h2 className="news-section-title">leia também</h2><div className="news-grid">{related.map((p) => card(p))}</div></section>}
      </article>
      {footer}
    </main>
  )

  return (
    <main className="news">
      {header}
      <section className="news-masthead">
        <span className="news-date">BlueNews · {dateLong(new Date())}</span>
        <h1 id="blog-title" className="news-title">{slug && current === null ? 'Notícia não encontrada.' : 'Ideias, direção e bastidores de quem está construindo o próprio negócio.'}</h1>
      </section>
      <nav className="news-chips blog-categories" aria-label="Filtrar por seção">
        <ul>
          <li><button type="button" className={!section ? 'is-active' : undefined} onClick={() => pick('')}>todas</button></li>
          {CATEGORIES.map((c) => <li key={c.id}><button type="button" className={section === c.id ? 'is-active' : undefined} onClick={() => pick(c.id)}>{c.label}</button></li>)}
        </ul>
      </nav>
      {loaded && visible.length === 0 && (
        <p className="news-empty">{section ? `Ainda não há notícias em ${catLabel(section)}. Em breve.` : 'As primeiras edições estão sendo preparadas. Em breve.'}</p>
      )}
      {featured && <section className="news-featured" aria-label="Destaque">{card(featured, true)}</section>}
      {rest.length > 0 && <section className="news-grid" aria-label="Notícias">{rest.map((p) => card(p))}</section>}
      <section className="news-newsletter" aria-labelledby="news-newsletter-title">
        <h2 id="news-newsletter-title" className="news-section-title">newsletter</h2>
        <p>{pages.blog.text}</p>
        {!subscribe && <button type="button" className="news-button blog-cta" onClick={() => setSubscribe(true)}>{pages.blog.cta}</button>}
        <div ref={formBox} className="news-form" hidden={!subscribe}>{subscribe && <><p className="news-form-title">{pages.blog.form.title}</p><ContactForm variant="newsletter" /></>}</div>
      </section>
      {footer}
    </main>
  )
}
