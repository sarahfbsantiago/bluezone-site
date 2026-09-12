import { pages } from '../config/pagesConfig'
import { RichText } from './RichText'

/** Página de soluções: o que fazemos, como fazemos, para quem fazemos. */
export function SolutionsPage() {
  const { solutions, testimonials } = pages
  return (
    <section id={solutions.id} className="page page-long page-solutions" aria-labelledby="solutions-title" data-scroll-section>
      <div className="page-block page-block-long">
        <span className="page-label">{solutions.label}</span>
        <h2 id="solutions-title" className="sr-only">Soluções</h2>
        {solutions.blocks.map((block) => (
          <article key={block.id} id={block.id} className="solution-block" aria-labelledby={`${block.id}-title`}>
            <span className="solution-kicker">{block.kicker}</span>
            <h3 id={`${block.id}-title`} className="solution-title">{block.title}</h3>
            <div className="page-paragraphs page-paragraphs-long">
              {block.paragraphs.map((paragraph) => <p key={paragraph} className={paragraph.endsWith(':') ? 'lead-in' : undefined}><RichText text={paragraph} /></p>)}
            </div>
            <ul className={`solution-items${block.items[0]?.title ? '' : ' solution-items-plain'}`}>
              {block.items.map((item) => (
                <li key={item.text}>
                  {item.title && <strong>{item.title}</strong>}
                  <span><RichText text={item.text} /></span>
                </li>
              ))}
            </ul>
            <div className="page-paragraphs page-paragraphs-long">
              {block.closing.map((paragraph) => <p key={paragraph}><RichText text={paragraph} /></p>)}
            </div>
          </article>
        ))}
      </div>
      <a className="page-continue" href={`#${testimonials.id}`}>continuar<span className="page-continue-line" /></a>
    </section>
  )
}
