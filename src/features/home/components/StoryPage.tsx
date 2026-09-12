import { pages } from '../config/pagesConfig'
import { RichText } from './RichText'

/** História da Bluezone: as Zonas Azuis, a proposta Blue e os novos braços (IA e tecnologia). */
export function StoryPage() {
  const { story, three } = pages
  return (
    <section id={story.id} className="page page-long page-story" aria-labelledby="story-title" data-scroll-section>
      <div className="page-block page-block-long">
        <span className="page-label">{story.label}</span>
        <h2 id="story-title" className="solution-title story-title">{story.title}</h2>
        <div className="page-paragraphs page-paragraphs-long">
          {story.paragraphs.map((paragraph) => <p key={paragraph}><RichText text={paragraph} /></p>)}
        </div>
        {story.blocks.map((block) => (
          <article key={block.id} id={block.id} className="solution-block story-block" aria-labelledby={`${block.id}-title`}>
            <h3 id={`${block.id}-title`} className="solution-kicker story-kicker">{block.kicker}</h3>
            <div className="page-paragraphs page-paragraphs-long">
              {block.paragraphs.map((paragraph) => <p key={paragraph}><RichText text={paragraph} /></p>)}
            </div>
          </article>
        ))}
      </div>
      <a className="page-continue" href={`#${three.id}`}>continuar<span className="page-continue-line" /></a>
    </section>
  )
}
