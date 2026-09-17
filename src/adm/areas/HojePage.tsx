import type { Post } from '../../bluenews/posts'
import { CATEGORIES } from '../../bluenews/posts'
import type { Role } from '../site'

type Props = { posts: Post[]; role: Role; onDrafts: () => void; onNew: () => void; onOpen: (post: Post) => void }

/** Hoje: o que precisa de ação agora. Por enquanto só a BlueNews alimenta a lista; Publicar e Clientes entram quando existirem. */
export function HojePage({ posts, role, onDrafts, onNew, onOpen }: Props) {
  const drafts = posts.filter((p) => p.status === 'draft')
  const published = posts.filter((p) => p.status === 'published')
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const thisMonth = published.filter((p) => p.publishedAt?.toDate && p.publishedAt.toDate() >= monthStart).length
  const recent = [...posts].sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)).slice(0, 5)
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">Hoje</h1><span className="admin-title">{today}</span></div>
      <h2 className="admin-subtitle">pendências</h2>
      <ul className="adm-pending" aria-label="Pendências">
        {drafts.length > 0
          ? <li><button type="button" className="adm-pending-item" onClick={onDrafts}><strong>{drafts.length}</strong> notícia{drafts.length === 1 ? '' : 's'} em rascunho na BlueNews</button></li>
          : <li className="is-ok">nenhuma notícia parada em rascunho</li>}
        <li className="is-soon"><span>posts para aprovar e para postar hoje</span><span className="admin-soon">quando Publicar entrar</span></li>
        {role === 'admin' && <li className="is-soon"><span>leads sem resposta</span><span className="admin-soon">quando Clientes entrar</span></li>}
      </ul>
      <div className="admin-stats">
        <div className="admin-stat"><strong>{thisMonth}</strong><span>notícias publicadas no mês</span></div>
        <div className="admin-stat"><strong>{published.length}</strong><span>notícias no ar</span></div>
        <div className="admin-stat"><strong>{new Set(published.map((p) => p.category)).size}</strong><span>seções com notícia</span></div>
      </div>
      <div className="admin-toolbar"><h2 className="admin-subtitle">últimas na BlueNews</h2><button type="button" className="admin-link" onClick={onNew}>nova notícia</button></div>
      {recent.length === 0 ? <p className="admin-note">Nenhuma notícia ainda.</p> : (
        <ul className="adm-recent">
          {recent.map((post) => (
            <li key={post.id}>
              <button type="button" className="admin-card-title" onClick={() => onOpen(post)}>{post.title}</button>
              <span className="admin-card-meta">{CATEGORIES.find((c) => c.id === post.category)?.label ?? post.category} · <span className={`admin-status is-${post.status}`}>{post.status === 'published' ? 'publicada' : 'rascunho'}</span>{post.updatedAt?.toDate ? ' · ' + post.updatedAt.toDate().toLocaleDateString('pt-BR') : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
