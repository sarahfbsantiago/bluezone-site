import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, sendInvite, signOutUser } from '../../lib/firebase'
import { SITE, type Role } from '../site'
import { BackButton } from './BackButton'

type Props = { email: string; role: Role; demo: boolean; onBack: () => void }

/** Equipe: quem tem acesso, convites e a conta conectada. Só administradores chegam aqui. */
export function EquipePage({ email, role, demo, onBack }: Props) {
  const [editors, setEditors] = useState<Array<{ email: string; name: string }>>([])
  const [newEditor, setNewEditor] = useState({ name: '', email: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (demo) { setEditors([{ email: 'editor@exemplo.com', name: 'Editor de exemplo' }]); return }
    try { const snap = await getDocs(collection(db(), 'editors')); setEditors(snap.docs.map((d) => ({ email: d.id, name: String(d.data().name ?? '') }))) } catch { setEditors([]) }
  }, [demo])
  useEffect(() => { void load() }, [load])

  const add = async (event: FormEvent) => {
    event.preventDefault()
    const target = newEditor.email.trim().toLowerCase()
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(target)) { setMessage('confira o e-mail.'); return }
    setBusy(true)
    try {
      await setDoc(doc(db(), 'editors', target), { name: newEditor.name.trim().slice(0, 80), invitedBy: email, createdAt: serverTimestamp() })
      await sendInvite(target)
      setMessage(`convite enviado para ${target}. A pessoa recebe um link para entrar e criar a senha.`)
      setNewEditor({ name: '', email: '' }); await load()
    } catch (error) { setMessage('não foi possível convidar: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const remove = async (target: string) => {
    if (!window.confirm(`Remover o acesso de ${target}?`)) return
    setBusy(true)
    try { await deleteDoc(doc(db(), 'editors', target)); await load() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const resend = async (target: string) => {
    try { await sendInvite(target); setMessage(`convite reenviado para ${target}.`) } catch (error) { setMessage('erro: ' + (error as Error).message) }
  }

  return (
    <section className="admin-list">
      <div className="admin-toolbar"><BackButton onClick={onBack} /><h1 className="solution-title">Equipe</h1></div>
      <dl className="admin-config">
        <dt>conta conectada</dt><dd>{email} · {role === 'admin' ? 'administradora' : 'editor(a)'}</dd>
        <dt>papéis</dt><dd>administradores entram com Google e veem tudo, inclusive campanhas, clientes e equipe. Editores entram com Google ou e-mail e senha e veem hoje, publicar, BlueNews e marca.</dd>
        <dt>site público</dt><dd><a className="admin-link" href={SITE} target="_blank" rel="noopener noreferrer">{SITE.replace('https://', '')}</a> · <a className="admin-link" href={`${SITE}/bluenews`} target="_blank" rel="noopener noreferrer">/bluenews</a></dd>
        <dt>e-mail da equipe</dt><dd>contato@abluezone.com.br</dd>
      </dl>
      <section className="admin-editors" aria-labelledby="adm-editors-title">
        <h2 id="adm-editors-title" className="admin-subtitle">editores</h2>
        <form className="admin-editor-form" onSubmit={add}>
          <input placeholder="nome" value={newEditor.name} onChange={(e) => setNewEditor({ ...newEditor, name: e.target.value })} maxLength={80} aria-label="Nome" />
          <input type="email" placeholder="e-mail" value={newEditor.email} onChange={(e) => setNewEditor({ ...newEditor, email: e.target.value })} required aria-label="E-mail" />
          <button type="submit" className="contact-submit" disabled={busy}>convidar</button>
        </form>
        <p className="admin-note">A pessoa recebe um e-mail com o link de acesso, entra por ele e cria a senha. Depois pode entrar com Google (mesmo e-mail) ou com e-mail e senha.</p>
        {editors.length > 0 && (
          <ul className="admin-editor-list">
            {editors.map((e) => <li key={e.email}><span><strong>{e.name || '(sem nome)'}</strong> · {e.email}</span><span className="admin-actions"><button type="button" className="admin-link" onClick={() => resend(e.email)}>reenviar convite</button><button type="button" className="admin-link admin-danger" onClick={() => remove(e.email)} disabled={busy}>remover</button></span></li>)}
          </ul>
        )}
        {message && <p className="admin-note">{message}</p>}
      </section>
      <button type="button" className="admin-link" onClick={() => signOutUser()}>sair</button>
    </section>
  )
}
