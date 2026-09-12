import { Fragment, type ReactNode } from 'react'

/** Texto da notícia com formatação básica, renderizado como nós React (nunca HTML cru): parágrafos, títulos (#, ##), listas (- ), **negrito**, _itálico_ e links [texto](https://...). */
export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '')
        if (lines.length === 0) return null
        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ''))}</li>)}</ul>
        if (/^##\s+/.test(lines[0])) return <h3 key={i}>{inline(lines[0].replace(/^##\s+/, ''))}</h3>
        if (/^#\s+/.test(lines[0])) return <h2 key={i}>{inline(lines[0].replace(/^#\s+/, ''))}</h2>
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p>
      })}
    </>
  )
}

const TOKEN = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).filter((part) => part !== '').map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>
    return part
  })
}
