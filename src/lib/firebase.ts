import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, updatePassword, sendPasswordResetEmail, type Auth, type User } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/** Config pública do app Web (Console → Configurações do projeto). Sem ela, o site funciona sem banco. */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | null = null
function getApp(): FirebaseApp {
  if (!firebaseEnabled) throw new Error('Firebase não configurado (VITE_FIREBASE_*)')
  if (!app) app = getApps()[0] ?? initializeApp(config)
  return app
}

export function db(): Firestore { return getFirestore(getApp()) }
export function auth(): Auth { return getAuth(getApp()) }

/** Login com Google (administradores e editores; o e-mail precisa estar nas listas do banco). */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth(), provider)
  return result.user
}

export function signOutUser(): Promise<void> { return signOut(auth()) }

export function watchUser(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth(), callback)
}

/** Login de editor com e-mail e senha (senha criada no primeiro acesso, pelo convite). */
export function signInWithPassword(email: string, password: string): Promise<User> {
  return signInWithEmailAndPassword(auth(), email.trim().toLowerCase(), password).then((r) => r.user)
}

const INVITE_KEY = 'bluezone-convite-email'

/** Convite: o Firebase envia um link de acesso para o e-mail; ao abrir, a pessoa entra e cria a senha. */
export async function sendInvite(email: string): Promise<void> {
  const target = email.trim().toLowerCase()
  // o e-mail vai na URL de retorno: ao abrir o link, o painel conclui o acesso sozinho e já pede a senha
  await sendSignInLinkToEmail(auth(), target, { url: `${window.location.origin}/?convite=1&email=${encodeURIComponent(target)}`, handleCodeInApp: true })
}

export function isInviteLink(): boolean {
  return typeof window !== 'undefined' && isSignInWithEmailLink(auth(), window.location.href)
}

/** Conclui o convite a partir do link (pede o e-mail se não estiver guardado neste navegador). */
export async function finishInvite(email: string): Promise<User> {
  const result = await signInWithEmailLink(auth(), email.trim().toLowerCase(), window.location.href)
  try { window.localStorage.removeItem(INVITE_KEY) } catch { /* ignora */ }
  return result.user
}

export function setPassword(password: string): Promise<void> {
  const user = auth().currentUser
  if (!user) return Promise.reject(new Error('sem sessão'))
  return updatePassword(user, password)
}

export function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth(), email.trim().toLowerCase())
}
