import { useEffect, useState, type CSSProperties } from 'react'
import { siteConfig } from '../features/home/config/siteConfig'
import { SiteFooter } from '../features/home/components/SiteFooter'
import { SiteHeader } from '../features/home/components/SiteHeader'
import { WhatsAppButton } from '../features/home/components/WhatsAppButton'
import { blueprint as bp } from './blueprintConfig'
import { withBase } from '../lib/paths'
import { track } from '../lib/tracking'
import { BlueprintBrand, Newspaper, Phone, Tablet } from './BlueprintPieces'

const BUY = siteConfig.blueprintCourse
const idx = (i: number) => ({ '--i': i } as CSSProperties)

/** Botão de compra: sempre abre o checkout da Kiwify em nova aba. */
function Buy({ label, className = '' }: { label: string; className?: string }) {
  return <a className={`contact-submit blog-cta bp-buy ${className}`} href={BUY} target="_blank" rel="noopener noreferrer" onClick={() => track('begin_checkout', { item: 'blueprint', label })}>{label}</a>
}

/** Marca do curso: símbolo oficial + "Blue" em negrito e "print" leve, como no logotipo. */
function BlueprintMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={`brand-logo brand-news bp-mark bp-mark-${size}`} aria-label="Blueprint">
      <img src={withBase('/logo-symbol.png')} alt="" decoding="async" />
      <span className="brand-news-word"><b>Blue</b>print</span>
    </span>
  )
}

function Badges({ items }: { items: readonly string[] }) {
  return <ul className="bp-badges" aria-label="Garantias">{items.map((item) => <li key={item}>{item}</li>)}</ul>
}

/** Página de vendas do curso Blueprint: textos em `blueprintConfig.ts`, checkout na Kiwify (`siteConfig.blueprintCourse`). */
export function BlueprintPage() {
  const [open, setOpen] = useState<number | null>(0)
  // A página do Blueprint é sempre escura, independentemente do tema escolhido no site (a escolha do visitante não é alterada).
  useEffect(() => { document.documentElement.setAttribute('data-theme', 'dark') }, [])
  // Cada seção recebe `--ps` (0→1) conforme entra na tela; os boxes sobem em cascata acompanhando a rolagem (e voltam ao subir).
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.bp-section, .bp-offer'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { sections.forEach((s) => s.style.setProperty('--ps', '1')); return }
    let frame = 0
    const update = () => {
      frame = 0
      const vh = window.innerHeight || 1
      sections.forEach((s) => { const top = s.getBoundingClientRect().top; s.style.setProperty('--ps', Math.min(1.4, Math.max(0, (vh * 0.9 - top) / (vh * 0.5))).toFixed(4)) })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [])
  return (
    <main id="top" className="home-page blog-page blueprint-page theme-dark">
      <div className="backdrop" aria-hidden="true" />
      <SiteHeader theme="dark" onToggleTheme={() => {}} site="blueprint" />

      <section className="page page-long page-blog bp-hero" aria-labelledby="blueprint-title">
        <div className="bp-hero-grid">
        <div className="page-block page-block-long bp-hero-copy">
          <BlueprintBrand />
          <span className="solution-kicker">{bp.tagline}</span>
          <h1 id="blueprint-title" className="bp-title">
            {bp.hero.lines.map((line) => <span key={line} className="bp-title-line">{line}</span>)}
            <span className="bp-title-punch">{bp.hero.punch}</span>
          </h1>
          <p className="products-intro blog-intro bp-sub">{bp.hero.sub}</p>
          <div className="blog-actions"><Buy label={bp.hero.cta} /></div>
          <Badges items={bp.hero.badges} />
        </div>
        <Tablet src={withBase('/midia/blueprint/hero.jpg')} alt="Alisson e Isabela, criadores do Blueprint, gravando com celular e notebook" />
        </div>
        <div className="bp-marquee" aria-hidden="true"><div className="bp-marquee-track">{Array.from({ length: 16 }, (_, i) => <span key={i}>Blueprint</span>)}</div></div>
      </section>

      <section className="page page-long bp-section" aria-labelledby="bp-foryou-title">
        <div className="page-block page-block-long">
          <h2 id="bp-foryou-title" className="solution-title">{bp.forYou.title}</h2>
          <ul className="solution-items solution-items-plain bp-list">{bp.forYou.items.map((item, i) => <li key={item} style={idx(i)}><span>{item}</span></li>)}</ul>
        </div>
      </section>

      <section className="page page-long bp-section" aria-labelledby="bp-problem-title">
        <div className="page-block page-block-long">
          <h2 id="bp-problem-title" className="solution-title">{bp.problem.title}</h2>
          <p className="bp-lead">{bp.problem.lead}</p>
          <p className="products-intro bp-text">{bp.problem.text}</p>
          <blockquote className="bp-quote">{bp.problem.quote}</blockquote>
          {bp.problem.statNumber && (
            <p className="bp-stat"><strong>{bp.problem.statNumber}</strong><span>{bp.problem.statText}</span><small>{bp.problem.statSource}</small></p>
          )}
          <div className="blog-actions"><Buy label={bp.problem.cta} /></div>
        </div>
      </section>

      <section id="o-que-e" className="page page-long bp-section" aria-labelledby="bp-what-title">
        <div className="page-block page-block-long">
          <h2 id="bp-what-title" className="solution-title">{bp.what.title}</h2>
          <p className="products-intro bp-text">{bp.what.text}</p>
          <ul className="solution-items solution-items-plain bp-list">{bp.what.items.map((item, i) => <li key={item} style={idx(i)}><span>{item}</span></li>)}</ul>
          <p className="bp-lead">{bp.what.closing}</p>
          <div className="blog-actions"><Buy label={bp.what.cta} /></div>
        </div>
      </section>

      <section className="page page-long bp-banner" aria-label={bp.banner.join(' ')}>
        <p className="bp-banner-text">{bp.banner.map((line) => <span key={line}>{line}</span>)}</p>
      </section>

      <section id="para-quem" className="page page-long bp-section" aria-labelledby="bp-audience-title">
        <div className="page-block page-block-long">
          <h2 id="bp-audience-title" className="solution-title">{bp.audience.title}</h2>
          <ul className="solution-items bp-grid">{bp.audience.items.map((item, i) => <li key={item} style={idx(i)}><strong>{item}</strong></li>)}</ul>
        </div>
      </section>

      <section id="conteudo" className="page page-long bp-section" aria-labelledby="bp-learn-title">
        <div className="page-block page-block-long">
          <h2 id="bp-learn-title" className="solution-title">{bp.learn.title}</h2>
          <ol className="solution-items bp-grid bp-modules">{bp.learn.items.map((item, i) => <li key={item} style={idx(i)}><span className="bp-num">{String(i + 1).padStart(2, '0')}</span><strong>{item}</strong></li>)}</ol>
          <div className="blog-actions"><Buy label={bp.learn.cta} /></div>
        </div>
      </section>

      <section id="resultados" className="page page-long bp-section bp-after" aria-labelledby="bp-after-title">
        <div className="bp-after-grid">
          <Phone src={withBase('/midia/blueprint/palco.jpg')} alt="Alisson e Isabela em um estúdio, com luz de LED e celulares na mão" />
          <div className="page-block page-block-long bp-after-copy">
            <h2 id="bp-after-title" className="solution-title">{bp.after.title}</h2>
            <ul className="solution-items solution-items-plain bp-list">{bp.after.items.map((item, i) => <li key={item} style={idx(i)}><span>{item}</span></li>)}</ul>
            <p className="bp-lead">{bp.banner.join(' ')}</p>
          </div>
        </div>
      </section>

      <section id="oferta" className="page page-long bp-section bp-offer" aria-labelledby="bp-offer-title">
        <div className="page-block page-block-long">
          <h2 id="bp-offer-title" className="solution-title">{bp.offer.title}</h2>
          <div className="bp-card">
            <BlueprintMark />
            <span className="solution-kicker">{bp.tagline}</span>
            <p className="products-intro bp-text">{bp.offer.text}</p>
            <p className="bp-price"><span className="bp-price-x">{bp.offer.installments}</span><span className="bp-price-of">de</span><strong>{bp.offer.price}</strong></p>
            <Buy label={bp.offer.cta} className="bp-buy-main" />
            <Badges items={bp.offer.badges} />
            <p className="bp-platform">{bp.offer.platformNote} <img src={withBase('/midia/kiwify.png')} alt="Kiwify" width="80" height="22" decoding="async" /></p>
          </div>
        </div>
      </section>

      <section id="idealizadores" className="page page-long bp-section bp-founders-section" aria-labelledby="bp-founders-title">
        <div className="page-block page-block-long">
          <span className="solution-kicker">{bp.founders.kicker}</span>
          <Newspaper masthead="Bluezone · edição especial" dateline="Belo Horizonte · Blueprint da Comunicação Estratégica" headline="Quem criou o Blueprint" photo={withBase('/midia/blueprint/idealizadores.jpg')} caption={<>{bp.founders.people.map((person) => <span key={person.name}><strong>{person.name}</strong>, {person.role}. </span>)}</>}>
            {bp.founders.paragraphs.map((paragraph, i) => <p key={paragraph} style={idx(i)}>{paragraph}</p>)}
          </Newspaper>
        </div>
      </section>

      <section id="duvidas" className="page page-long bp-section" aria-labelledby="bp-faq-title">
        <div className="page-block page-block-long">
          <h2 id="bp-faq-title" className="solution-title">{bp.faq.title}</h2>
          <div className="bp-faq">
            {bp.faq.items.map((item, i) => (
              <div key={item.q} className={`bp-faq-item${open === i ? ' is-open' : ''}`} style={idx(i)}>
                <button type="button" className="bp-faq-q" aria-expanded={open === i} aria-controls={`bp-faq-${i}`} onClick={() => setOpen(open === i ? null : i)}>{item.q}<span aria-hidden="true">{open === i ? '−' : '+'}</span></button>
                <p id={`bp-faq-${i}`} className="bp-faq-a" hidden={open !== i}>{item.a}</p>
              </div>
            ))}
          </div>
          <div className="bp-help">
            <p className="products-intro bp-text">{bp.faq.help}</p>
            <div className="blog-actions">
              <a className="contact-submit blog-cta" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">{bp.faq.whatsapp}</a>
              <a className="products-note" href={`mailto:${siteConfig.supportEmail}`}>{bp.faq.email}</a>
            </div>
          </div>
        </div>
        <SiteFooter site="blueprint" />
      </section>
      <WhatsAppButton />
    </main>
  )
}
