import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { BrandLogo } from '../features/home/components/BrandLogo'
import { db, firebaseEnabled, signInWithGoogle, signOutUser, watchUser, signInWithPassword, isInviteLink, finishInvite, setPassword, resetPassword } from '../lib/firebase'
import { CATEGORIES, listAll, type Post, type PostStatus } from '../bluenews/posts'
import { AREAS, canSee, type AreaId, type Role } from './site'
import { BlueNewsArea, type BlueNewsTab } from './areas/BlueNewsArea'
import { HojePage } from './areas/HojePage'
import { EquipePage } from './areas/EquipePage'
import { CAMPANHAS, CLIENTES, Scaffold } from './areas/Scaffold'
import { PublicarArea } from './areas/PublicarArea'
import { MarcaPage } from './areas/MarcaPage'
import { listContents, type Content } from './content'

type BlueNewsInit = { search: string; status: '' | PostStatus; openNew: boolean; openPost?: Post; nonce: number }
type PublicarInit = { openId?: string; openNew: boolean; nonce: number }

/**
 * Bluezone.adm: o centro de marketing e vendas da Bluezone. Login (Google para administradores; Google ou e-mail e senha
 * para editores convidados), barra lateral por área e o conteúdo de cada área. Só e-mails em `admins` ou `editors` entram.
 */
export function AdmPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [invite, setInvite] = useState<'none' | 'email' | 'password' | 'done'>('none')
  const [inviteEmail, setInviteEmail] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [message, setMessage] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [pubInit, setPubInit] = useState<PublicarInit>({ openNew: false, nonce: 0 })
  const [area, setArea] = useState<AreaId>('hoje')
  const [bnTab, setBnTab] = useState<BlueNewsTab>('noticias')
  const [bnInit, setBnInit] = useState<BlueNewsInit>({ search: '', status: '', openNew: false, nonce: 0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  const demo = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    if (demo) {
      setUser({ email: 'demo@abluezone.com.br' } as User); setAllowed(true); setRole('admin')
      const now = { toDate: () => new Date(), toMillis: () => Date.now() } as unknown as Post['updatedAt']
      const today = new Date(); const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const plus = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return key(d) }
      setContents([
        { id: 'c1', channel: 'instagram', format: 'carrossel', topic: '3 erros de quem posta sem estratégia', caption: 'Postar todo dia não é estratégia. É rotina sem direção.\n\nOs três erros mais comuns que a gente vê…', hashtags: '#marketing #pequenosnegocios', media: [], date: key(today), notes: '', status: 'aprovado', createdBy: 'demo@abluezone.com.br' },
        { id: 'c2', channel: 'linkedin', format: 'post', topic: 'Por que estratégia não é um documento', caption: '', hashtags: '', media: [], date: plus(2), notes: '', status: 'rascunho', createdBy: 'demo@abluezone.com.br' },
        { id: 'c3', channel: 'tiktok', format: 'video', topic: 'Bastidor: como planejamos o mês de um cliente', caption: '', hashtags: '', media: [], date: plus(5), notes: '', status: 'ideia', createdBy: 'demo@abluezone.com.br' },
        { id: 'c4', channel: 'instagram', format: 'feed', topic: 'Frase: estratégia em movimento', caption: 'Estratégia em movimento.', hashtags: '#abluezone', media: [], date: plus(-3), notes: '', status: 'postado', createdBy: 'demo@abluezone.com.br' },
      ])
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
      if (!next?.email) { setAllowed(null); setRole(null); return }
      try {
        const admin = (await getDoc(doc(db(), 'admins', next.email))).exists()
        if (admin) {
          // administradores entram só com Google
          const viaPassword = next.providerData.some((p) => p.providerId === 'password') && !next.providerData.some((p) => p.providerId === 'google.com')
          if (viaPassword) { await signOutUser(); setMessage('administradores entram com Google.'); return }
          setAllowed(true); setRole('admin'); return
        }
        const editor = (await getDoc(doc(db(), 'editors', next.email))).exists()
        setAllowed(editor); setRole(editor ? 'editor' : null)
      } catch { setAllowed(false); setRole(null) }
    })
  }, [])

  const reload = useCallback(async () => {
    if (demo) return
    try { setPosts(await listAll()) } catch (error) { setMessage('não foi possível carregar as notícias: ' + (error as Error).message) }
  }, [demo])
  const reloadContents = useCallback(async () => {
    if (demo) return
    try { setContents(await listContents()) } catch (error) { setMessage('não foi possível carregar os posts: ' + (error as Error).message) }
  }, [demo])
  useEffect(() => { if (allowed) void reloadContents() }, [allowed, reloadContents])
  useEffect(() => { if (allowed) void reload() }, [allowed, reload])

  const loginWithPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage('')
    const form = event.currentTarget
    const password = String(new FormData(form).get('password') ?? '')
    try { await signInWithPassword(loginEmail, password) } catch { setMessage('e-mail ou senha incorretos.') } finally { form.reset() }
  }
  const forgot = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    try { await resetPassword(loginEmail); setMessage('se este e-mail tiver acesso, enviamos um link para redefinir a senha. Olhe também o spam.'); setForgotMode(false) } catch { setMessage('não foi possível enviar. confira o e-mail.') }
  }
  const completeInvite = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    try { await finishInvite(inviteEmail); setInvite('password') } catch (error) { setMessage('link inválido ou expirado. peça um novo convite. (' + (error as Error).message + ')') }
  }
  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage('')
    const form = event.currentTarget
    const newPassword = String(new FormData(form).get('password') ?? '')
    if (newPassword.length < 10 || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) { setMessage('a senha precisa ter pelo menos 10 caracteres, com letra minúscula e número.'); return }
    try { await setPassword(newPassword); form.reset(); setInvite('done'); window.history.replaceState(null, '', window.location.pathname); setMessage('senha criada. bem-vindo(a) ao painel!') } catch (error) { setMessage('não foi possível criar a senha: ' + (error as Error).message) }
  }

  const go = (next: AreaId) => { setArea(next); setMenuOpen(false); setMessage('') }
  /** Abre a BlueNews com filtros ou editor prontos (busca do topo, atalhos do Hoje). O `nonce` remonta a área com o estado novo. */
  const openBlueNews = (init: Partial<Omit<BlueNewsInit, 'nonce'>>, tab: BlueNewsTab = 'noticias') => {
    setBnInit((current) => ({ search: '', status: '', openNew: false, openPost: undefined, ...init, nonce: current.nonce + 1 }))
    setBnTab(tab); go('bluenews')
  }
  const openPublicar = (init: Partial<Omit<PublicarInit, 'nonce'>>) => { setPubInit((current) => ({ openNew: false, openId: undefined, ...init, nonce: current.nonce + 1 })); go('publicar') }
  const submitSearch = (event: FormEvent) => { event.preventDefault(); if (query.trim()) openBlueNews({ search: query.trim() }) }

  const brand = (
    <a href="#" className="header-brand adm-brand" aria-label="Bluezone.adm, início do painel" onClick={(event) => { event.preventDefault(); go('hoje') }}>
      <BrandLogo /><span className="brand-adm">.adm</span>
    </a>
  )
  const header = (
    <header className="admin-header">
      {brand}
      {user && allowed && (
        <form className="adm-search" role="search" onSubmit={submitSearch}>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar notícia…" aria-label="Buscar no painel" />
        </form>
      )}
      {user && allowed && <button type="button" className="admin-menu-toggle" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>}
      {user && <button type="button" className="admin-link admin-signout" onClick={() => signOutUser()}>sair</button>}
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
          <label className="field"><span>nova senha</span><input type="password" name="password" minLength={10} required autoComplete="new-password" /></label>
          <div className="contact-actions"><button type="submit" className="contact-submit">salvar senha</button></div>
        </form>
        {message && <p className="admin-note admin-error">{message}</p>}
      </section>
    </main>
  )
  if (!user) return (
    <main className="admin">{header}
      <section className="admin-login">
        <h1 className="solution-title">Entrar no Bluezone.adm</h1>
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
            <label className="field"><span>senha</span><input type="password" name="password" autoComplete="current-password" required /></label>
            <div className="contact-actions"><button type="submit" className="contact-submit">entrar</button><button type="button" className="admin-link" onClick={() => { setForgotMode(true); setMessage('') }}>esqueci a senha</button></div>
          </form>
        )}
        <p className="admin-note">Recebeu um convite? Clique no link do e-mail: ele abre o painel direto na criação da sua senha.</p>
        {message && <p className="admin-note admin-error">{message}</p>}
      </section>
    </main>
  )
  if (allowed === false) return <main className="admin">{header}<section className="admin-login"><h1 className="solution-title">Sem permissão</h1><p className="admin-note">A conta {user.email} não está na lista de administradores nem de editores. Peça um convite em contato@abluezone.com.br.</p><button type="button" className="admin-link" onClick={() => signOutUser()}>sair</button></section></main>
  if (allowed === null || !role) return <main className="admin">{header}<p className="admin-note">verificando permissão…</p></main>

  const visible = AREAS.filter((a) => canSee(a.id, role))
  const sidebar = (
    <nav className={`admin-sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Menu do painel">
      {visible.map((item) => (
        <button key={item.id} type="button" className={`admin-nav${area === item.id ? ' is-active' : ''}`} onClick={() => go(item.id)}>
          {item.label}{'soon' in item && item.soon && <span className="admin-soon">em breve</span>}
        </button>
      ))}
      <div className="adm-sidebar-foot"><strong>{user.email}</strong><span>{role === 'admin' ? 'administradora' : 'editor(a)'}</span></div>
    </nav>
  )

  const screen = !canSee(area, role)
    ? <section className="admin-list"><div className="admin-toolbar"><h1 className="solution-title">Sem acesso</h1></div><p className="admin-note">Esta área é só da administração.</p></section>
    : area === 'hoje' ? <HojePage posts={posts} contents={contents} role={role} onDrafts={() => openBlueNews({ status: 'draft' })} onNew={() => openBlueNews({ openNew: true })} onOpen={(post) => openBlueNews({ openPost: post })} onContent={(item) => openPublicar({ openId: item.id })} onContents={() => openPublicar({})} />
    : area === 'publicar' ? <PublicarArea key={pubInit.nonce} contents={contents} reload={reloadContents} userEmail={user.email ?? ''} openId={pubInit.openId} openNew={pubInit.openNew} onBack={() => go('hoje')} demo={demo} />
    : area === 'bluenews' ? <BlueNewsArea key={bnInit.nonce} posts={posts} reload={reload} tab={bnTab} onTab={setBnTab} onBack={() => go('hoje')} initialSearch={bnInit.search} initialStatus={bnInit.status} openNew={bnInit.openNew} openPost={bnInit.openPost} />
    : area === 'campanhas' ? <Scaffold {...CAMPANHAS} onBack={() => go('hoje')} />
    : area === 'clientes' ? <Scaffold {...CLIENTES} onBack={() => go('hoje')} />
    : area === 'marca' ? <MarcaPage role={role} email={user.email ?? ''} demo={demo} onBack={() => go('hoje')} />
    : <EquipePage email={user.email ?? ''} role={role} demo={demo} onBack={() => go('hoje')} />

  return (
    <main className="admin admin-with-sidebar">
      {header}
      <div className="admin-body">
        {sidebar}
        <div className="admin-content">
          {message && <p className="admin-note admin-error">{message}</p>}
          {screen}
        </div>
      </div>
    </main>
  )
}
