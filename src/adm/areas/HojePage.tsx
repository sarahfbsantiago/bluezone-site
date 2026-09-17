import type { Post } from '../../bluenews/posts'
import { CATEGORIES } from '../../bluenews/posts'
import { channel, pending, type Content } from '../content'
import type { Role } from '../site'

type Props = {
  posts: Post[]; contents: Content[]; role: Role
  onDrafts: () => void; onNew: () => void; onOpen: (post: Post) => void
  onContent: (item: Content) => void; onContents: (status: 'rascunho' | 'aprovado') => void
}

/** Hoje: o que precisa de ação agora, vindo do Publicar e da BlueNews. Clientes entra quando existir. */
export function HojePage({ posts, contents, role, onDrafts, onNew, onOpen, onContent, onContents }: Props) {
  const drafts = posts.filter((p) => p.status === 'draft')
  const published = posts.filter((p) => p.status === 'published')
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const thisMonth = published.filter((p) => p.publishedAt?.toDate && p.publishedAt.toDate() >= monthStart).length
  const recent = [...posts].sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)).slice(0, 4)
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const { toPost, late, toApprove, next7 } = pending(contents)
  const postedThisMonth = contents.filter((c) => c.status === 'postado' && c.date >= `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01`).length
  const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`
  const nothing = toPost.length + late.length + toApprove.length + drafts.length === 0
  return (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">Hoje</h1><span className="admin-title">{today}</span></div>
      <h2 className="admin-subtitle">pendências</h2>
      <ul className="adm-pending" aria-label="Pendências">
        {toPost.length > 0 && <li><button type="button" className="adm-pending-item" onClick={() => onContents('aprovado')}><strong>{toPost.length}</strong> {toPost.length === 1 ? 'post aprovado para postar hoje' : 'posts aprovados para postar hoje'}</button></li>}
        {late.length > 0 && <li className="is-late"><button type="button" className="adm-pending-item" onClick={() => onContents('aprovado')}><strong>{late.length}</strong> {late.length === 1 ? 'post aprovado com data passada e ainda não postado' : 'posts aprovados com data passada e ainda não postados'}</button></li>}
        {toApprove.length > 0 && <li><button type="button" className="adm-pending-item" onClick={() => onContents('rascunho')}><strong>{toApprove.length}</strong> {plural(toApprove.length, 'post esperando aprovação', 'posts esperando aprovação').replace(/^\d+ /, '')}</button></li>}
        {drafts.length > 0 && <li><button type="button" className="adm-pending-item" onClick={onDrafts}><strong>{drafts.length}</strong> {drafts.length === 1 ? 'notícia em rascunho na BlueNews' : 'notícias em rascunho na BlueNews'}</button></li>}
        {nothing && <li className="is-ok">nada pendente. bom dia.</li>}
        {role === 'admin' && <li className="is-soon"><span>leads sem resposta</span><span className="admin-soon">quando Clientes entrar</span></li>}
      </ul>
      <div className="admin-stats">
        <div className="admin-stat"><strong>{postedThisMonth}</strong><span>posts postados no mês</span></div>
        <div className="admin-stat"><strong>{thisMonth}</strong><span>notícias publicadas no mês</span></div>
        <div className="admin-stat"><strong>{published.length}</strong><span>notícias no ar</span></div>
      </div>
      <h2 className="admin-subtitle">próximos 7 dias</h2>
      {next7.length === 0 ? <p className="admin-note">Nenhum post com data nos próximos dias. Planeje no calendário em Publicar.</p> : (
        <ul className="adm-recent">
          {next7.map((item) => (
            <li key={item.id}>
              <button type="button" className="admin-card-title" onClick={() => onContent(item)}>{item.topic}</button>
              <span className="admin-card-meta">{item.date.split('-').reverse().slice(0, 2).join('/')} · {channel(item.channel).label} · <span className={`admin-status is-${item.status}`}>{item.status}</span></span>
            </li>
          ))}
        </ul>
      )}
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
