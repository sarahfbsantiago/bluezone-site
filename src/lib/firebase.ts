import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type Auth, type User } from 'firebase/auth'
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

/** Login da equipe com a conta Google do Workspace. */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ hd: 'abluezone.com.br', prompt: 'select_account' })
  const result = await signInWithPopup(auth(), provider)
  return result.user
}

export function signOutUser(): Promise<void> { return signOut(auth()) }

export function watchUser(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth(), callback)
}
