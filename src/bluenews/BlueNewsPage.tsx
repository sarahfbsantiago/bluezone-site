import { useEffect, useRef, useState } from 'react'
import { pages } from '../features/home/config/pagesConfig'
import { ContactForm } from '../features/home/components/ContactForm'
import { SiteFooter } from '../features/home/components/SiteFooter'
import { SiteHeader } from '../features/home/components/SiteHeader'
import { WhatsAppButton } from '../features/home/components/WhatsAppButton'
import { useTheme } from '../features/home/hooks/useTheme'
import { withBase } from '../lib/paths'
import { firebaseEnabled } from '../lib/firebase'
import { getPublishedBySlug, listPublished, CATEGORIES, type Post } from './posts'
import { Markdown } from './Markdown'

/**
 * BlueNews: newsletter por e-mail + portal de conteúdo da Bluezone. Por enquanto, página "em breve" com o mesmo tema e footer do site,
 * header com logotipo BlueNews e "voltar ao site", e um único botão que abre a inscrição (nome, e-mail, telefone → Apps Script, origem "bluenews").
 */
export function BlueNewsPage() {
  const [theme, toggleTheme] = useTheme()
  const [open, setOpen] = useState(false)
  const formBox = useRef<HTMLDivElement>(null)
  const { blog } = pages
  const [posts, setPosts] = useState<Post[]>([])
  const [current, setCurrent] = useState<Post | null | undefined>(undefined)
  const slug = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('post') : null
  useEffect(() => {
    if (!firebaseEnabled) { setCurrent(null); return }
    listPublished().then(setPosts).catch(() => setPosts([]))
    if (slug) getPublishedBySlug(slug).then(setCurrent).catch(() => setCurrent(null))
    else setCurrent(null)
  }, [slug])
  useEffect(() => {
    if (!open || !formBox.current) return
    formBox.current.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true })
    formBox.current.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [open])
  return (
    <main id="top" className={`home-page blog-page theme-${theme}`}>
      <div className="backdrop" aria-hidden="true" />
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} site="bluenews" />
      <section className="page page-long page-blog" aria-labelledby="blog-title">
        {slug && current ? (
          <article className="page-block page-block-long post">
            <a className="products-note" href={withBase('/bluenews')}>← todas as notícias</a>
            {current.coverUrl && <img src={current.coverUrl} alt="" className="post-cover" />}
            <span className="solution-kicker">{CATEGORIES.find((c) => c.id === current.category)?.label}</span>
            <h1 className="post-title">{current.title}</h1>
            <p className="post-meta">{current.author}{current.publishedAt?.toDate ? ' · ' + current.publishedAt.toDate().toLocaleDateString('pt-BR') : ''}</p>
            <div className="post-body"><Markdown text={current.content} /></div>
          </article>
        ) : (
        <div className="page-block page-block-long">
          <span className="page-label">{blog.name}</span>
          {slug && current === null && <p className="products-intro">Notícia não encontrada.</p>}
          {posts.length > 0 && (
            <ul className="post-list" aria-label="Notícias">
              {posts.map((post) => (
                <li key={post.id} className="post-card">
                  <a href={withBase(`/bluenews?post=${post.slug}`)}>
                    {post.coverUrl && <img src={post.coverUrl} alt="" loading="lazy" />}
                    <span className="solution-kicker">{CATEGORIES.find((c) => c.id === post.category)?.label}</span>
                    <strong>{post.title}</strong>
                    <span className="post-excerpt">{post.excerpt}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {posts.length === 0 && <span className="solution-kicker products-kicker">{blog.kicker}</span>}
          <h1 id="blog-title" className="solution-title blog-title">{blog.title}</h1>
          <p className="products-intro blog-intro">{blog.text}</p>
          {!open && (
            <div className="blog-actions">
              <button type="button" className="contact-submit blog-cta" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="blog-form">{blog.cta}</button>
            </div>
          )}
          <div id="blog-form" ref={formBox} className="blog-form" hidden={!open}>
            <p className="blog-form-title">{blog.form.title}</p>
            {open && <ContactForm variant="newsletter" />}
          </div>
          <ul className="solution-items products-grid blog-categories" aria-label="Seções da BlueNews">
            {blog.categories.map((category) => (
              <li key={category.id} id={category.id}>
                <span className="product-badge">em breve</span>
                <strong>{category.title}</strong>
                <span>{category.text}</span>
              </li>
            ))}
          </ul>
        </div>
        )}
        <SiteFooter site="bluenews" />
      </section>
      <WhatsAppButton />
    </main>
  )
}
