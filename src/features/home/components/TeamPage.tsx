import { pages } from '../config/pagesConfig'
import { withBase } from '../../../lib/paths'

type Person = { name: string; role: string; photo: string; tags?: readonly string[]; bio?: string }

function Photo({ person, index, large }: { person: Person; index: number; large?: boolean }) {
  return (
    <div className={`team-photo${large ? ' team-photo-large' : ''}`} aria-hidden={person.photo ? undefined : true}>
      {person.photo ? <img src={withBase(person.photo)} alt={person.name} loading="lazy" /> : <span className="team-photo-placeholder">{String(index + 1).padStart(2, '0')}</span>}
    </div>
  )
}

/** Nosso time: fundadores em destaque acima (foto maior, tags e bio) e os demais abaixo. */
export function TeamPage() {
  const { team, contact } = pages
  return (
    <section id={team.id} className="page page-long page-team" aria-labelledby="team-title">
      <div className="page-block page-block-long">
        <span className="page-label">{team.label}</span>
        <h2 id="team-title" className="page-title team-title">{team.title}</h2>
        <ul className="founders-grid" aria-label="Fundadores">
          {team.founders.map((person, index) => (
            <li key={person.name} className="team-card founder-card">
              <Photo person={person} index={index} large />
              <strong className="team-name">{person.name}</strong>
              <span className="team-role">{person.role}</span>
              <ul className="founder-tags" aria-label="Áreas">
                {person.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
              <p className="founder-bio">{person.bio}</p>
            </li>
          ))}
        </ul>
        <ul className="team-grid" aria-label="Time e parceiros">
          {team.members.map((member, index) => (
            <li key={member.name} className="team-card member-card">
              <Photo person={member} index={index + team.founders.length} />
              <strong className="team-name">{member.name}</strong>
              <span className="team-role">{member.role}</span>
              {member.tags.length > 0 && (
                <ul className="founder-tags" aria-label="Áreas">
                  {member.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              )}
              <p className="founder-bio member-bio">{member.bio}</p>
            </li>
          ))}
        </ul>
      </div>
      <a className="page-continue" href={`#${contact.id}`}>continuar<span className="page-continue-line" /></a>
    </section>
  )
}
