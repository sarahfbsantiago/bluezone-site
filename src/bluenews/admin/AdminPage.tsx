import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { withBase } from '../../lib/paths'

/** Site público (para os links "ver" e o logotipo); o painel vive em outro endereço. */
const SITE = (import.meta.env.VITE_SITE_URL || 'https://abluezone.com.br').replace(/\/$/, '')
import { db, firebaseEnabled, signInWithGoogle, signOutUser, watchUser, signInWithPassword, sendInvite, isInviteLink, finishInvite, setPassword, resetPassword } from '../../lib/firebase'
import { CATEGORIES, createPost, deletePost, listAll, slugify, updatePost, validatePost, type Post, type PostInput, type PostStatus } from '../posts'
import { Markdown } from '../Markdown'
import { CoverImage } from '../CoverImage'
import { compressImage, uploadImage, MAX_BYTES } from '../images'

const EMPTY: PostInput = { title: '', slug: '', category: CATEGORIES[0]?.id ?? '', excerpt: '', content: '', coverUrl: '', author: 'Equipe Bluezone', status: 'draft' }

/**
 * Painel da BlueNews (/bluenews/admin): login com Google (conta do Workspace), lista de notícias, editor com pré-visualização,
 * publicar/despublicar e excluir. Só e-mails presentes na coleção `admins` conseguem gravar (as regras do Firestore garantem).
 */
export function AdminPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [role, setRole] = useState<'admin' | 'editor' | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [invite, setInvite] = useState<'none' | 'email' | 'password' | 'done'>('none')
  const [inviteEmail, setInviteEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [editors, setEditors] = useState<Array<{ email: string; name: string }>>([])
  const [newEditor, setNewEditor] = useState({ name: '', email: '' })
  const [forgotMode, setForgotMode] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [editing, setEditing] = useState<Post | 'new' | null>(null)
  const [form, setForm] = useState<PostInput>(EMPTY)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<PostInput | null>(null)
  const [view, setView] = useState<'inicio' | 'noticias' | 'secoes' | 'newsletter' | 'leads' | 'config'>('inicio')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | PostStatus>('')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const onFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true); setMessage('')
    try { const image = await compressImage(file); const ref = await uploadImage(image); update({ coverUrl: ref }); setMessage(`imagem enviada (${Math.round(image.bytes / 1024)} KB, ${image.width}×${image.height}).`) }
    catch (error) { setMessage('não foi possível enviar a imagem: ' + (error as Error).message) }
    finally { setUploading(false) }
  }

  const demo = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    if (demo) {
      setUser({ email: 'demo@abluezone.com.br' } as User); setIsAdmin(true); setRole('admin')
      const now = { toDate: () => new Date() } as unknown as Post['updatedAt']
      setPosts([1, 2, 3, 4].map((i) => ({ id: String(i), title: `Notícia de exemplo ${i} com um título um pouco mais longo`, slug: `noticia-${i}`, category: CATEGORIES[i % CATEGORIES.length].id, excerpt: 'Resumo de exemplo para conferir o layout.', content: 'Texto de exemplo.\n\nSegundo parágrafo.', coverUrl: '', author: 'Equipe Bluezone', status: i % 2 ? 'published' : 'draft', updatedAt: now, publishedAt: now })))
      return
    }
    if (!firebaseEnabled) { setUser(null); return }
    if (isInviteLink()) {
      const fromLink = new URLSearchParams(window.location.search).get('email')
      if (fromLink) {
        setInviteEmail(fromLink)
        finishInvite(fromLink).then(() => setInvite('password')).catch(() => { setInvite('email'); setMessage('link inválido ou expirado. peça um novo convite.') })
      } else setInvite('email')
    }
    return watchUser(async (next) => {
      setUser(next)
      if (!next?.email) { setIsAdmin(null); setRole(null); return }
      try {
        const admin = (await getDoc(doc(db(), 'admins', next.email))).exists()
        if (admin) {
          // administradores entram só com Google
          const viaPassword = next.providerData.some((p) => p.providerId === 'password') && !next.providerData.some((p) => p.providerId === 'google.com')
          if (viaPassword) { await signOutUser(); setMessage('administradores entram com Google.'); return }
          setIsAdmin(true); setRole('admin'); return
        }
        const editor = (await getDoc(doc(db(), 'editors', next.email))).exists()
        setIsAdmin(editor); setRole(editor ? 'editor' : null)
      } catch { setIsAdmin(false); setRole(null) }
    })
  }, [])

  const reload = useCallback(async () => {
    if (demo) return
    try { setPosts(await listAll()) } catch (error) { setMessage('não foi possível carregar as notícias: ' + (error as Error).message) }
  }, [demo])
  useEffect(() => { if (isAdmin) void reload() }, [isAdmin, reload])
  const loadEditors = useCallback(async () => {
    if (demo) { setEditors([{ email: 'editor@exemplo.com', name: 'Editor de exemplo' }]); return }
    try { const snap = await getDocs(collection(db(), 'editors')); setEditors(snap.docs.map((d) => ({ email: d.id, name: String(d.data().name ?? '') }))) } catch { setEditors([]) }
  }, [demo])
  useEffect(() => { if (role === 'admin') void loadEditors() }, [role, loadEditors])
  const addEditor = async (event: FormEvent) => {
    event.preventDefault()
    const email = newEditor.email.trim().toLowerCase()
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) { setMessage('confira o e-mail do editor.'); return }
    setBusy(true)
    try {
      await setDoc(doc(db(), 'editors', email), { name: newEditor.name.trim().slice(0, 80), invitedBy: user?.email ?? '', createdAt: serverTimestamp() })
      await sendInvite(email)
      setMessage(`convite enviado para ${email}. A pessoa recebe um link para entrar e criar a senha.`)
      setNewEditor({ name: '', email: '' }); await loadEditors()
    } catch (error) { setMessage('não foi possível convidar: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const removeEditor = async (email: string) => {
    if (!window.confirm(`Remover o acesso de ${email}?`)) return
    setBusy(true)
    try { await deleteDoc(doc(db(), 'editors', email)); await loadEditors() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const resendInvite = async (email: string) => {
    try { await sendInvite(email); setMessage(`convite reenviado para ${email}.`) } catch (error) { setMessage('erro: ' + (error as Error).message) }
  }
  const loginWithPassword = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    try { await signInWithPassword(loginEmail, loginPassword) } catch { setMessage('e-mail ou senha incorretos.') }
  }
  const forgot = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    try { await resetPassword(loginEmail); setMessage('se este e-mail tiver acesso, enviamos um link para redefinir a senha. Olhe também o spam.'); setForgotMode(false) } catch { setMessage('não foi possível enviar. confira o e-mail.') }
  }
  const completeInvite = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    try { await finishInvite(inviteEmail); setInvite('password') } catch (error) { setMessage('link inválido ou expirado. peça um novo convite. (' + (error as Error).message + ')') }
  }
  const savePassword = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    if (newPassword.length < 10 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) { setMessage('a senha precisa ter pelo menos 10 caracteres, com letra minúscula e número.'); return }
    try { await setPassword(newPassword); setInvite('done'); setNewPassword(''); window.history.replaceState(null, '', window.location.pathname); setMessage('senha criada. bem-vindo(a) ao painel!') } catch (error) { setMessage('não foi possível criar a senha: ' + (error as Error).message) }
  }

  const goHome = () => { setEditing(null); setPreview(null); setMessage(''); setView('inicio'); setMenuOpen(false) }
  const go = (next: typeof view) => { setEditing(null); setPreview(null); setMessage(''); setView(next); setMenuOpen(false) }
  const startNew = (category?: string) => { setForm({ ...EMPTY, category: category ?? EMPTY.category }); setEditing('new'); setPreview(null); setMessage(''); setMenuOpen(false) }
  const startEdit = (post: Post) => { setForm({ title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt, content: post.content, coverUrl: post.coverUrl, author: post.author, status: post.status }); setEditing(post); setPreview(null); setMessage(''); setMenuOpen(false) }
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
      {user && isAdmin && <button type="button" className="admin-menu-toggle" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>}
      {user && <button type="button" className="admin-link admin-signout" onClick={() => signOutUser()}>sair ({user.email})</button>}
    </header>
  )

  if (!firebaseEnabled) return <main className="admin">{header}<p className="admin-note">Painel indisponível: o Firebase não está configurado neste ambiente.</p></main>
  if (user === undefined) return <main className="admin">{header}<p className="admin-note">carregando…</p></main>
  if (invite === 'email' && !user) return (
    <main className="admin">{header}
      <section className="admin-login">
        <h1 className="solution-title">Convite para o painel</h1>
        <p className="admin-note">Confirme o e-mail que recebeu o convite para concluir o acesso (o link abriu sem o e-mail, provavelmente em outro navegador).</p>
        <form className="contact-form admin-loginform" onSubmit={completeInvite}>
          <label className="field"><span>e-mail</span><input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required autoComplete="email" /></label>
          <div className="contact-actions"><button type="submit" className="contact-submit">continuar</button></div>
        </form>
        {message && <p className="admin-note admin-error">{message}</p>}
      </section>
    </main>
  )
  if (user && invite === 'password') return (
    <main className="admin">{header}
      <section className="admin-login">
        <h1 className="solution-title">Crie sua senha</h1>
        <p className="admin-note">Você entrou como {user.email}. Crie uma senha para os próximos acessos (mínimo 10 caracteres, com letra e número). Também dá para entrar com Google usando este mesmo e-mail.</p>
        <form className="contact-form admin-loginform" onSubmit={savePassword}>
          <label className="field"><span>nova senha</span><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={10} required autoComplete="new-password" /></label>
          <div className="contact-actions"><button type="submit" className="contact-submit">salvar senha</button></div>
        </form>
        {message && <p className="admin-note admin-error">{message}</p>}
      </section>
    </main>
  )
  if (!user) return (
    <main className="admin">{header}
      <section className="admin-login">
        <h1 className="solution-title">Entrar no painel da BlueNews</h1>
        <p className="admin-note">Administradores entram com Google. Editores entram com Google ou com e-mail e senha criada no convite.</p>
        <button type="button" className="contact-submit" onClick={() => signInWithGoogle().catch((error) => setMessage('não foi possível entrar: ' + error.message))}>entrar com Google</button>
        {forgotMode ? (
          <form className="contact-form admin-loginform" onSubmit={forgot} aria-label="Redefinir senha">
            <span className="admin-subtitle">redefinir senha</span>
            <p className="admin-note">Digite o e-mail do seu acesso. Você recebe um link para criar uma senha nova.</p>
            <label className="field"><span>e-mail</span><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="username" required /></label>
            <div className="contact-actions"><button type="submit" className="contact-submit">enviar link</button><button type="button" className="admin-link" onClick={() => { setForgotMode(false); setMessage('') }}>voltar</button></div>
          </form>
        ) : (
          <form className="contact-form admin-loginform" onSubmit={loginWithPassword} aria-label="Entrar com e-mail e senha">
            <span className="admin-subtitle">ou com e-mail e senha</span>
            <label className="field"><span>e-mail</span><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="username" required /></label>
            <label className="field"><span>senha</span><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" required /></label>
            <div className="contact-actions"><button type="submit" className="contact-submit">entrar</button><button type="button" className="admin-link" onClick={() => { setForgotMode(true); setMessage('') }}>esqueci a senha</button></div>
          </form>
        )}
        <p className="admin-note">Recebeu um convite? Clique no link do e-mail: ele abre o painel direto na criação da sua senha.</p>
        {message && <p className="admin-note admin-error">{message}</p>}
      </section>
    </main>
  )
  if (isAdmin === false) return <main className="admin">{header}<section className="admin-login"><h1 className="solution-title">Sem permissão</h1><p className="admin-note">A conta {user.email} não está na lista de administradores nem de editores. Peça um convite em contato@abluezone.com.br.</p><button type="button" className="admin-link" onClick={() => signOutUser()}>sair</button></section></main>
  if (isAdmin === null) return <main className="admin">{header}<p className="admin-note">verificando permissão…</p></main>

  const previewView = (post: PostInput) => (
    <section className="admin-previewpage">
      <div className="admin-toolbar"><span className="admin-title">pré-visualização · assim a notícia aparece no portal</span><button type="button" className="admin-link" onClick={() => setPreview(null)}>fechar pré-visualização</button></div>
      <article className="post admin-postpreview">
        {post.coverUrl && <CoverImage src={post.coverUrl} className="post-cover" loading="eager" />}
        <span className="solution-kicker">{CATEGORIES.find((c) => c.id === post.category)?.label}</span>
        <h1 className="post-title">{post.title || 'Título'}</h1>
        <p className="post-meta">{post.author}{post.status === 'draft' ? ' · rascunho' : ''}</p>
        <div className="post-body"><Markdown text={post.content} /></div>
      </article>
    </section>
  )

  const published = posts.filter((p) => p.status === 'published')
  const drafts = posts.filter((p) => p.status === 'draft')
  const filtered = posts.filter((p) => (!filterCat || p.category === filterCat) && (!filterStatus || p.status === filterStatus) && (!search || p.title.toLowerCase().includes(search.toLowerCase())))
  const NAV: Array<{ id: typeof view; label: string; soon?: boolean }> = role === 'admin' ? [
    { id: 'inicio', label: 'início' }, { id: 'noticias', label: 'notícias' }, { id: 'secoes', label: 'seções' },
    { id: 'newsletter', label: 'newsletter', soon: true }, { id: 'leads', label: 'leads', soon: true }, { id: 'config', label: 'configurações' },
  ] : [
    { id: 'inicio', label: 'início' }, { id: 'noticias', label: 'notícias' }, { id: 'secoes', label: 'seções' },
  ]
  const sidebar = (
    <nav className={`admin-sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Menu do painel">
      <button type="button" className="contact-submit admin-new" onClick={() => startNew()}>nova notícia</button>
      {NAV.map((item) => (
        <button key={item.id} type="button" className={`admin-nav${view === item.id && !editing && !preview ? ' is-active' : ''}`} onClick={() => go(item.id)}>
          {item.label}{item.soon && <span className="admin-soon">em breve</span>}
        </button>
      ))}
    </nav>
  )
  const soon = (title: string, text: string) => (
    <section className="admin-list"><div className="admin-toolbar"><h1 className="solution-title">{title}</h1></div><p className="admin-note">{text}</p></section>
  )
  const table = (list: Post[]) => (
    list.length === 0 ? <p className="admin-note">Nenhuma notícia aqui.</p> : (<>
      <ul className="admin-cards" aria-label="Notícias">
        {list.map((post) => (
          <li key={post.id}>
            <button type="button" className="admin-card-title" onClick={() => startEdit(post)}>{post.title}</button>
            <span className="admin-card-meta">{CATEGORIES.find((c) => c.id === post.category)?.label ?? post.category} · <span className={`admin-status is-${post.status}`}>{post.status === 'published' ? 'publicada' : 'rascunho'}</span>{post.updatedAt?.toDate ? ' · ' + post.updatedAt.toDate().toLocaleDateString('pt-BR') : ''}</span>
            <div className="admin-actions">
              <button type="button" className="admin-link" onClick={() => setPreview({ title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt, content: post.content, coverUrl: post.coverUrl, author: post.author, status: post.status })}>pré-visualizar</button>
              <button type="button" className="admin-link" onClick={() => toggleStatus(post)} disabled={busy}>{post.status === 'published' ? 'despublicar' : 'publicar'}</button>
              {post.status === 'published' && <a className="admin-link" href={`${SITE}/bluenews?post=${post.slug}`} target="_blank" rel="noopener noreferrer">ver</a>}
              <button type="button" className="admin-link admin-danger" onClick={() => remove(post)} disabled={busy}>excluir</button>
            </div>
          </li>
        ))}
      </ul>
      <table className="admin-table">
        <thead><tr><th>título</th><th>seção</th><th>status</th><th>atualizada</th><th /></tr></thead>
        <tbody>
          {list.map((post) => (
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
    </>)
  )
  const screen = (role !== 'admin' && (view === 'config' || view === 'leads' || view === 'newsletter')) ? soon('Sem acesso', 'Esta área é só da administração.') : view === 'inicio' ? (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">Início</h1></div>
      <div className="admin-stats">
        <button type="button" className="admin-stat" onClick={() => { setFilterStatus('published'); setFilterCat(''); go('noticias') }}><strong>{published.length}</strong><span>publicadas</span></button>
        <button type="button" className="admin-stat" onClick={() => { setFilterStatus('draft'); setFilterCat(''); go('noticias') }}><strong>{drafts.length}</strong><span>rascunhos</span></button>
        <button type="button" className="admin-stat" onClick={() => go('secoes')}><strong>{new Set(published.map((p) => p.category)).size}</strong><span>seções com notícia</span></button>
      </div>
      {message && <p className="admin-note">{message}</p>}
      <h2 className="admin-subtitle">últimas atualizadas</h2>
      {table(posts.slice(0, 5))}
    </section>
  ) : view === 'noticias' ? (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">Notícias</h1><button type="button" className="contact-submit" onClick={() => startNew()}>nova notícia</button></div>
      <div className="admin-filters">
        <input type="search" placeholder="buscar por título" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} aria-label="Seção"><option value="">todas as seções</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as '' | PostStatus)} aria-label="Status"><option value="">todos os status</option><option value="published">publicadas</option><option value="draft">rascunhos</option></select>
      </div>
      {message && <p className="admin-note">{message}</p>}
      {table(filtered)}
    </section>
  ) : view === 'secoes' ? (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">Seções</h1></div>
      <ul className="admin-sections">
        {CATEGORIES.map((c) => { const n = posts.filter((p) => p.category === c.id); const pub = n.filter((p) => p.status === 'published').length; return (
          <li key={c.id}>
            <strong>{c.label}</strong>
            <span>{pub} publicada{pub === 1 ? '' : 's'} · {n.length - pub} rascunho{n.length - pub === 1 ? '' : 's'}</span>
            <div className="admin-actions"><button type="button" className="admin-link" onClick={() => { setFilterCat(c.id); setFilterStatus(''); go('noticias') }}>ver notícias</button><button type="button" className="admin-link" onClick={() => startNew(c.id)}>nova nesta seção</button></div>
          </li>
        ) })}
      </ul>
    </section>
  ) : view === 'newsletter' ? soon('Newsletter', 'Em breve: lista de inscritos da BlueNews e envio de edições a partir das notícias publicadas. Hoje as inscrições chegam por e-mail e na planilha.')
  : view === 'leads' ? soon('Leads', 'Em breve: quem chegou pelos formulários do site, do Blueprint e do pop-up, com a linha do tempo do que aconteceu com cada um. Hoje chegam por e-mail e na planilha.')
  : (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">Configurações</h1></div>
      <dl className="admin-config">
        <dt>conta conectada</dt><dd>{user.email} · {role === 'admin' ? 'administradora' : 'editor(a)'}</dd>
        <dt>acesso ao painel</dt><dd>administradores entram com Google e gerenciam pessoas; editores criam, publicam e excluem notícias e entram com Google ou e-mail e senha.</dd>
        <dt>portal público</dt><dd><a className="admin-link" href={`${SITE}/bluenews`} target="_blank" rel="noopener noreferrer">{SITE.replace('https://', '')}/bluenews</a></dd>
        <dt>e-mail de suporte</dt><dd>contato@abluezone.com.br</dd>
      </dl>
      {role === 'admin' && (
        <section className="admin-editors" aria-labelledby="admin-editors-title">
          <h2 id="admin-editors-title" className="admin-subtitle">editores</h2>
          <form className="admin-editor-form" onSubmit={addEditor}>
            <input placeholder="nome" value={newEditor.name} onChange={(e) => setNewEditor({ ...newEditor, name: e.target.value })} maxLength={80} aria-label="Nome" />
            <input type="email" placeholder="e-mail" value={newEditor.email} onChange={(e) => setNewEditor({ ...newEditor, email: e.target.value })} required aria-label="E-mail" />
            <button type="submit" className="contact-submit" disabled={busy}>convidar</button>
          </form>
          <p className="admin-note">A pessoa recebe um e-mail com o link de acesso, entra por ele e cria a senha. Depois pode entrar com Google (mesmo e-mail) ou com e-mail e senha.</p>
          {editors.length > 0 && (
            <ul className="admin-editor-list">
              {editors.map((e) => <li key={e.email}><span><strong>{e.name || '(sem nome)'}</strong> · {e.email}</span><span className="admin-actions"><button type="button" className="admin-link" onClick={() => resendInvite(e.email)}>reenviar convite</button><button type="button" className="admin-link admin-danger" onClick={() => removeEditor(e.email)} disabled={busy}>remover</button></span></li>)}
            </ul>
          )}
          {message && <p className="admin-note">{message}</p>}
        </section>
      )}
      <button type="button" className="admin-link" onClick={() => signOutUser()}>sair</button>
    </section>
  )

  return (
    <main className="admin admin-with-sidebar">
      {header}
      <div className="admin-body">
      {sidebar}
      <div className="admin-content">
      {preview ? previewView(preview) : editing ? (
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
      ) : screen}
      </div>
      </div>
    </main>
  )
}
