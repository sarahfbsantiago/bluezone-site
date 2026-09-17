import { useState, type FormEvent } from 'react'
import { CATEGORIES, createPost, deletePost, slugify, updatePost, validatePost, type Post, type PostInput, type PostStatus } from '../../bluenews/posts'
import { Markdown } from '../../bluenews/Markdown'
import { CoverImage } from '../../bluenews/CoverImage'
import { compressImage, uploadImage, MAX_BYTES } from '../../bluenews/images'
import { SITE } from '../site'

const EMPTY: PostInput = { title: '', slug: '', category: CATEGORIES[0]?.id ?? '', excerpt: '', content: '', coverUrl: '', author: 'Equipe Bluezone', status: 'draft' }

export type BlueNewsTab = 'noticias' | 'secoes' | 'newsletter'
type Props = {
  posts: Post[]
  reload: () => Promise<void>
  tab: BlueNewsTab
  onTab: (tab: BlueNewsTab) => void
  /** Filtros iniciais vindos de fora (busca do topo, atalhos do Hoje). */
  initialSearch?: string
  initialStatus?: '' | PostStatus
  /** Abre o editor de nova notícia ao montar (atalho do Hoje). */
  openNew?: boolean
  /** Abre uma notícia no editor ao montar (atalho do Hoje). */
  openPost?: Post
}

/**
 * Área BlueNews do painel: lista de notícias (busca e filtros), seções, editor com pré-visualização, publicar/despublicar
 * e excluir. Mesmo comportamento do painel antigo da BlueNews, agora como uma área do Bluezone.adm.
 */
export function BlueNewsArea({ posts, reload, tab, onTab, initialSearch = '', initialStatus = '', openNew = false, openPost }: Props) {
  const [editing, setEditing] = useState<Post | 'new' | null>(openPost ?? (openNew ? 'new' : null))
  const [form, setForm] = useState<PostInput>(openPost ? toInput(openPost) : EMPTY)
  const [preview, setPreview] = useState<PostInput | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | PostStatus>(initialStatus)
  const [search, setSearch] = useState(initialSearch)

  const update = (patch: Partial<PostInput>) => setForm((current) => ({ ...current, ...patch }))
  const startNew = (category?: string) => { setForm({ ...EMPTY, category: category ?? EMPTY.category }); setEditing('new'); setPreview(null); setMessage('') }
  const startEdit = (post: Post) => { setForm(toInput(post)); setEditing(post); setPreview(null); setMessage('') }
  const onFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true); setMessage('')
    try { const image = await compressImage(file); const ref = await uploadImage(image); update({ coverUrl: ref }); setMessage(`imagem enviada (${Math.round(image.bytes / 1024)} KB, ${image.width}×${image.height}).`) }
    catch (error) { setMessage('não foi possível enviar a imagem: ' + (error as Error).message) }
    finally { setUploading(false) }
  }
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
    try { await updatePost(post.id, { ...toInput(post), status: post.status === 'published' ? 'draft' : 'published' }, post.status === 'published'); await reload() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const remove = async (post: Post) => {
    if (!window.confirm(`Excluir "${post.title}"? Não dá para desfazer.`)) return
    setBusy(true)
    try { await deletePost(post.id); await reload() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }

  const label = (post: Post) => CATEGORIES.find((c) => c.id === post.category)?.label ?? post.category
  const statusText = (post: Post) => post.status === 'published' ? 'publicada' : 'rascunho'
  const date = (post: Post) => post.updatedAt?.toDate ? post.updatedAt.toDate().toLocaleDateString('pt-BR') : ''
  const actions = (post: Post) => (<>
    <button type="button" className="admin-link" onClick={() => setPreview(toInput(post))}>pré-visualizar</button>
    <button type="button" className="admin-link" onClick={() => toggleStatus(post)} disabled={busy}>{post.status === 'published' ? 'despublicar' : 'publicar'}</button>
    {post.status === 'published' && <a className="admin-link" href={`${SITE}/bluenews?post=${post.slug}`} target="_blank" rel="noopener noreferrer">ver</a>}
    <button type="button" className="admin-link admin-danger" onClick={() => remove(post)} disabled={busy}>excluir</button>
  </>)
  const table = (list: Post[]) => (
    list.length === 0 ? <p className="admin-note">Nenhuma notícia aqui.</p> : (<>
      <ul className="admin-cards" aria-label="Notícias">
        {list.map((post) => (
          <li key={post.id}>
            <button type="button" className="admin-card-title" onClick={() => startEdit(post)}>{post.title}</button>
            <span className="admin-card-meta">{label(post)} · <span className={`admin-status is-${post.status}`}>{statusText(post)}</span>{date(post) && ' · ' + date(post)}</span>
            <div className="admin-actions">{actions(post)}</div>
          </li>
        ))}
      </ul>
      <table className="admin-table">
        <thead><tr><th>título</th><th>seção</th><th>status</th><th>atualizada</th><th /></tr></thead>
        <tbody>
          {list.map((post) => (
            <tr key={post.id}>
              <td><button type="button" className="admin-link" onClick={() => startEdit(post)}>{post.title}</button></td>
              <td>{label(post)}</td>
              <td><span className={`admin-status is-${post.status}`}>{statusText(post)}</span></td>
              <td>{date(post)}</td>
              <td className="admin-actions">{actions(post)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>)
  )

  if (preview) return (
    <section className="admin-previewpage">
      <div className="admin-toolbar"><span className="admin-title">pré-visualização · assim a notícia aparece no portal</span><button type="button" className="admin-link" onClick={() => setPreview(null)}>fechar pré-visualização</button></div>
      <article className="post admin-postpreview">
        {preview.coverUrl && <CoverImage src={preview.coverUrl} className="post-cover" loading="eager" />}
        <span className="solution-kicker">{CATEGORIES.find((c) => c.id === preview.category)?.label}</span>
        <h1 className="post-title">{preview.title || 'Título'}</h1>
        <p className="post-meta">{preview.author}{preview.status === 'draft' ? ' · rascunho' : ''}</p>
        <div className="post-body"><Markdown text={preview.content} /></div>
      </article>
    </section>
  )

  if (editing) return (
    <form className="admin-form" onSubmit={save}>
      <div className="admin-toolbar"><h1 className="solution-title">{editing === 'new' ? 'Nova notícia' : 'Editar notícia'}</h1><button type="button" className="admin-link" onClick={() => setEditing(null)}>voltar</button></div>
      <div className="admin-grid">
        <div className="admin-fields">
          <label className="field"><span>título</span><input value={form.title} onChange={(e) => update({ title: e.target.value, slug: editing === 'new' ? slugify(e.target.value) : form.slug })} maxLength={140} required /></label>
          <label className="field"><span>endereço (slug)</span><input value={form.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} maxLength={80} /></label>
          <label className="field"><span>seção</span><select value={form.category} onChange={(e) => update({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label className="field"><span>autor</span><input value={form.author} onChange={(e) => update({ author: e.target.value })} maxLength={80} /></label>
          <div className="field admin-upload"><span>imagem de capa</span>
            <label className="admin-upload-btn"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />{uploading ? 'enviando…' : 'enviar imagem (PNG, JPG ou WebP)'}</label>
            <small>reduzida automaticamente para até 1600px e {Math.round(MAX_BYTES / 1024)} KB. Ou cole um endereço https abaixo.</small>
            <input value={form.coverUrl} onChange={(e) => update({ coverUrl: e.target.value.trim() })} placeholder="https://… ou imagem enviada" maxLength={500} />
            {form.coverUrl && <button type="button" className="admin-link admin-danger" onClick={() => update({ coverUrl: '' })}>remover capa</button>}
          </div>
          <label className="field"><span>resumo (aparece na lista)</span><textarea value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} rows={3} maxLength={300} /></label>
          <label className="field"><span>texto · parágrafos separados por linha em branco · # título · - lista · **negrito** · [link](https://…)</span><textarea value={form.content} onChange={(e) => update({ content: e.target.value })} rows={16} maxLength={20000} required /></label>
          <label className="field"><span>status</span><select value={form.status} onChange={(e) => update({ status: e.target.value as PostInput['status'] })}><option value="draft">rascunho (invisível)</option><option value="published">publicada</option></select></label>
          <div className="contact-actions"><button type="submit" className="contact-submit" disabled={busy}>{busy ? 'salvando…' : 'salvar'}</button><button type="button" className="admin-link" onClick={() => setPreview({ ...form, slug: form.slug || slugify(form.title) })}>pré-visualizar</button><span className="contact-feedback">{message}</span></div>
        </div>
        <aside className="admin-preview" aria-label="Pré-visualização">
          {form.coverUrl && <CoverImage src={form.coverUrl} className="post-cover" loading="eager" />}
          <span className="solution-kicker">{CATEGORIES.find((c) => c.id === form.category)?.label}</span>
          <h2 className="post-title">{form.title || 'Título'}</h2>
          <p className="post-meta">{form.author}</p>
          <div className="post-body"><Markdown text={form.content} /></div>
        </aside>
      </div>
    </form>
  )

  const filtered = posts.filter((p) => (!filterCat || p.category === filterCat) && (!filterStatus || p.status === filterStatus) && (!search || p.title.toLowerCase().includes(search.toLowerCase())))
  const tabs = (
    <nav className="adm-tabs" aria-label="BlueNews">
      {(['noticias', 'secoes', 'newsletter'] as const).map((id) => (
        <button key={id} type="button" className={`adm-tab${tab === id ? ' is-active' : ''}`} onClick={() => onTab(id)}>{{ noticias: 'notícias', secoes: 'seções', newsletter: 'newsletter' }[id]}</button>
      ))}
    </nav>
  )

  if (tab === 'secoes') return (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">BlueNews</h1><button type="button" className="contact-submit" onClick={() => startNew()}>nova notícia</button></div>
      {tabs}
      <ul className="admin-sections">
        {CATEGORIES.map((c) => { const n = posts.filter((p) => p.category === c.id); const pub = n.filter((p) => p.status === 'published').length; return (
          <li key={c.id}>
            <strong>{c.label}</strong>
            <span>{pub} publicada{pub === 1 ? '' : 's'} · {n.length - pub} rascunho{n.length - pub === 1 ? '' : 's'}</span>
            <div className="admin-actions"><button type="button" className="admin-link" onClick={() => { setFilterCat(c.id); setFilterStatus(''); onTab('noticias') }}>ver notícias</button><button type="button" className="admin-link" onClick={() => startNew(c.id)}>nova nesta seção</button></div>
          </li>
        ) })}
      </ul>
    </section>
  )

  if (tab === 'newsletter') return (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">BlueNews</h1></div>
      {tabs}
      <p className="admin-note">Em breve: lista de inscritos da BlueNews e envio de edições a partir das notícias publicadas. Hoje as inscrições chegam por e-mail em contato@ e na planilha de contatos, aba "bluenews".</p>
    </section>
  )

  return (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">BlueNews</h1><button type="button" className="contact-submit" onClick={() => startNew()}>nova notícia</button></div>
      {tabs}
      <div className="admin-filters">
        <input type="search" placeholder="buscar por título" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} aria-label="Seção"><option value="">todas as seções</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as '' | PostStatus)} aria-label="Status"><option value="">todos os status</option><option value="published">publicadas</option><option value="draft">rascunhos</option></select>
      </div>
      {message && <p className="admin-note">{message}</p>}
      {table(filtered)}
    </section>
  )
}

function toInput(post: Post): PostInput {
  return { title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt, content: post.content, coverUrl: post.coverUrl, author: post.author, status: post.status }
}
