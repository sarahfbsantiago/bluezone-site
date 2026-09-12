import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { withBase } from '../../lib/paths'

/** Site público (para os links "ver" e o logotipo); o painel vive em outro endereço. */
const SITE = (import.meta.env.VITE_SITE_URL || 'https://abluezone.com.br').replace(/\/$/, '')
import { db, firebaseEnabled, signInWithGoogle, signOutUser, watchUser } from '../../lib/firebase'
import { CATEGORIES, createPost, deletePost, listAll, slugify, updatePost, validatePost, type Post, type PostInput } from '../posts'
import { Markdown } from '../Markdown'

const EMPTY: PostInput = { title: '', slug: '', category: CATEGORIES[0]?.id ?? '', excerpt: '', content: '', coverUrl: '', author: 'Equipe Bluezone', status: 'draft' }

/**
 * Painel da BlueNews (/bluenews/admin): login com Google (conta do Workspace), lista de notícias, editor com pré-visualização,
 * publicar/despublicar e excluir. Só e-mails presentes na coleção `admins` conseguem gravar (as regras do Firestore garantem).
 */
export function AdminPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [editing, setEditing] = useState<Post | 'new' | null>(null)
  const [form, setForm] = useState<PostInput>(EMPTY)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<PostInput | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    if (!firebaseEnabled) { setUser(null); return }
    return watchUser(async (next) => {
      setUser(next)
      if (!next?.email) { setIsAdmin(null); return }
      try { setIsAdmin((await getDoc(doc(db(), 'admins', next.email))).exists()) } catch { setIsAdmin(false) }
    })
  }, [])

  const reload = useCallback(async () => {
    try { setPosts(await listAll()) } catch (error) { setMessage('não foi possível carregar as notícias: ' + (error as Error).message) }
  }, [])
  useEffect(() => { if (isAdmin) void reload() }, [isAdmin, reload])

  const goHome = () => { setEditing(null); setPreview(null); setMessage('') }
  const startNew = () => { setForm(EMPTY); setEditing('new'); setMessage('') }
  const startEdit = (post: Post) => { setForm({ title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt, content: post.content, coverUrl: post.coverUrl, author: post.author, status: post.status }); setEditing(post); setMessage('') }
  const update = (patch: Partial<PostInput>) => setForm((current) => ({ ...current, ...patch }))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const input: PostInput = { ...form, slug: form.slug || slugify(form.title) }
    const problems = validatePost(input)
    if (problems.length) { setMessage(problems.join(' · ')); return }
    setBusy(true)
    try {
      if (editing === 'new') await createPost(input)
      else if (editing) await updatePost(editing.id, input, editing.status === 'published')
      setMessage('salvo.'); setEditing(null); await reload()
    } catch (error) { setMessage('erro ao salvar: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const toggleStatus = async (post: Post) => {
    setBusy(true)
    try { await updatePost(post.id, { title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt, content: post.content, coverUrl: post.coverUrl, author: post.author, status: post.status === 'published' ? 'draft' : 'published' }, post.status === 'published'); await reload() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const remove = async (post: Post) => {
    if (!window.confirm(`Excluir "${post.title}"? Não dá para desfazer.`)) return
    setBusy(true)
    try { await deletePost(post.id); await reload() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }

  const header = (
    <header className="admin-header">
      <a href="#" className="header-brand" aria-label="BlueNews.adm, início do painel" onClick={(event) => { event.preventDefault(); goHome() }}>
        <span className="brand-logo brand-news"><img src={withBase('/logo-symbol.png')} alt="" decoding="async" /><span className="brand-news-word"><b>Blue</b>News<span className="brand-adm">.adm</span></span></span>
      </a>
      {user && <button type="button" className="admin-link" onClick={() => signOutUser()}>sair ({user.email})</button>}
    </header>
  )

  if (!firebaseEnabled) return <main className="admin">{header}<p className="admin-note">Painel indisponível: o Firebase não está configurado neste ambiente.</p></main>
  if (user === undefined) return <main className="admin">{header}<p className="admin-note">carregando…</p></main>
  if (!user) return (
    <main className="admin">{header}
      <section className="admin-login">
        <h1 className="solution-title">Entrar no painel da BlueNews</h1>
        <p className="admin-note">Use a conta Google da Bluezone. Só e-mails autorizados conseguem publicar.</p>
        <button type="button" className="contact-submit" onClick={() => signInWithGoogle().catch((error) => setMessage('não foi possível entrar: ' + error.message))}>entrar com Google</button>
        {message && <p className="admin-note admin-error">{message}</p>}
      </section>
    </main>
  )
  if (isAdmin === false) return <main className="admin">{header}<section className="admin-login"><h1 className="solution-title">Sem permissão</h1><p className="admin-note">A conta {user.email} não está na lista de administradores. Peça para adicionar em contato@abluezone.com.br.</p></section></main>
  if (isAdmin === null) return <main className="admin">{header}<p className="admin-note">verificando permissão…</p></main>

  const previewView = (post: PostInput) => (
    <section className="admin-previewpage">
      <div className="admin-toolbar"><span className="admin-title">pré-visualização · assim a notícia aparece no portal</span><button type="button" className="admin-link" onClick={() => setPreview(null)}>fechar pré-visualização</button></div>
      <article className="post admin-postpreview">
        {post.coverUrl && <img src={post.coverUrl} alt="" className="post-cover" />}
        <span className="solution-kicker">{CATEGORIES.find((c) => c.id === post.category)?.label}</span>
        <h1 className="post-title">{post.title || 'Título'}</h1>
        <p className="post-meta">{post.author}{post.status === 'draft' ? ' · rascunho' : ''}</p>
        <div className="post-body"><Markdown text={post.content} /></div>
      </article>
    </section>
  )

  return (
    <main className="admin">
      {header}
      {preview ? previewView(preview) : editing ? (
        <form className="admin-form" onSubmit={save}>
          <div className="admin-toolbar"><h1 className="solution-title">{editing === 'new' ? 'Nova notícia' : 'Editar notícia'}</h1><button type="button" className="admin-link" onClick={() => setEditing(null)}>voltar</button></div>
          <div className="admin-grid">
            <div className="admin-fields">
              <label className="field"><span>título</span><input value={form.title} onChange={(e) => update({ title: e.target.value, slug: editing === 'new' ? slugify(e.target.value) : form.slug })} maxLength={140} required /></label>
              <label className="field"><span>endereço (slug)</span><input value={form.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} maxLength={80} /></label>
              <label className="field"><span>seção</span><select value={form.category} onChange={(e) => update({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
              <label className="field"><span>autor</span><input value={form.author} onChange={(e) => update({ author: e.target.value })} maxLength={80} /></label>
              <label className="field"><span>imagem de capa (endereço https)</span><input value={form.coverUrl} onChange={(e) => update({ coverUrl: e.target.value.trim() })} placeholder="https://…" maxLength={500} /></label>
              <label className="field"><span>resumo (aparece na lista)</span><textarea value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} rows={3} maxLength={300} /></label>
              <label className="field"><span>texto · parágrafos separados por linha em branco · # título · - lista · **negrito** · [link](https://…)</span><textarea value={form.content} onChange={(e) => update({ content: e.target.value })} rows={16} maxLength={20000} required /></label>
              <label className="field"><span>status</span><select value={form.status} onChange={(e) => update({ status: e.target.value as PostInput['status'] })}><option value="draft">rascunho (invisível)</option><option value="published">publicada</option></select></label>
              <div className="contact-actions"><button type="submit" className="contact-submit" disabled={busy}>{busy ? 'salvando…' : 'salvar'}</button><button type="button" className="admin-link" onClick={() => setPreview({ ...form, slug: form.slug || slugify(form.title) })}>pré-visualizar</button><span className="contact-feedback">{message}</span></div>
            </div>
            <aside className="admin-preview" aria-label="Pré-visualização">
              {form.coverUrl && <img src={form.coverUrl} alt="" className="post-cover" />}
              <span className="solution-kicker">{CATEGORIES.find((c) => c.id === form.category)?.label}</span>
              <h2 className="post-title">{form.title || 'Título'}</h2>
              <p className="post-meta">{form.author}</p>
              <div className="post-body"><Markdown text={form.content} /></div>
            </aside>
          </div>
        </form>
      ) : (
        <section className="admin-list">
          <div className="admin-toolbar"><h1 className="solution-title">Notícias</h1><button type="button" className="contact-submit" onClick={startNew}>nova notícia</button></div>
          {message && <p className="admin-note">{message}</p>}
          {posts.length === 0 ? <p className="admin-note">Nenhuma notícia ainda. Clique em "nova notícia".</p> : (
            <table className="admin-table">
              <thead><tr><th>título</th><th>seção</th><th>status</th><th>atualizada</th><th /></tr></thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td><button type="button" className="admin-link" onClick={() => startEdit(post)}>{post.title}</button></td>
                    <td>{CATEGORIES.find((c) => c.id === post.category)?.label ?? post.category}</td>
                    <td><span className={`admin-status is-${post.status}`}>{post.status === 'published' ? 'publicada' : 'rascunho'}</span></td>
                    <td>{post.updatedAt?.toDate ? post.updatedAt.toDate().toLocaleDateString('pt-BR') : ''}</td>
                    <td className="admin-actions">
                      <button type="button" className="admin-link" onClick={() => setPreview({ title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt, content: post.content, coverUrl: post.coverUrl, author: post.author, status: post.status })}>pré-visualizar</button>
                      <button type="button" className="admin-link" onClick={() => toggleStatus(post)} disabled={busy}>{post.status === 'published' ? 'despublicar' : 'publicar'}</button>
                      {post.status === 'published' && <a className="admin-link" href={`${SITE}/bluenews?post=${post.slug}`} target="_blank" rel="noopener noreferrer">ver</a>}
                      <button type="button" className="admin-link admin-danger" onClick={() => remove(post)} disabled={busy}>excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  )
}
