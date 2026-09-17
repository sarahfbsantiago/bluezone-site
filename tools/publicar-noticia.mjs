// Publica uma notícia na BlueNews sem o painel: sobe a capa para o Storage e cria o documento em `posts` (publicado),
// usando a sessão do Firebase CLI (firebase login, conta da equipe). Mesmo formato do painel (pasta noticias/, limites).
// Uso: node tools/publicar-noticia.mjs <rascunho.md> <capa.jpg|png|webp> [secao] [autor]
// O rascunho tem os blocos "## Título", "## Resumo" e "## Texto" (ver bluenews-rascunhos/).
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'

const [draftPath, coverPath, category = 'tecnologia', author = 'Equipe Bluezone'] = process.argv.slice(2)
if (!draftPath || !coverPath) { console.error('uso: node tools/publicar-noticia.mjs <rascunho.md> <capa> [secao] [autor]'); process.exit(2) }

const require = createRequire('/opt/homebrew/lib/node_modules/firebase-tools/package.json')
const authMod = require('firebase-tools/lib/auth')
const account = authMod.getGlobalDefaultAccount?.() ?? null
const refresh = account?.tokens?.refresh_token
if (!refresh) throw new Error('sem sessão do Firebase CLI: rode firebase login')
const SCOPES = ['email', 'openid', 'https://www.googleapis.com/auth/cloudplatformprojects.readonly', 'https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform']
const tok = await authMod.getAccessToken(refresh, SCOPES)
const token = typeof tok === 'string' ? tok : tok.access_token
if (!token) throw new Error('não foi possível renovar a sessão do Firebase CLI')
console.log('conta:', account.user?.email)

const PROJECT = 'bluezone-d2757', BUCKET = 'bluezone-d2757.firebasestorage.app'
const H = { Authorization: 'Bearer ' + token }

// 1) capa -> Storage
const img = readFileSync(coverPath)
if (img.length > 500 * 1024) throw new Error('capa acima de 500 KB: reduza antes')
const ext = coverPath.toLowerCase().endsWith('.png') ? 'png' : coverPath.toLowerCase().endsWith('.webp') ? 'webp' : 'jpg'
const contentType = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg' }[ext]
const name = `noticias/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
const dl = randomUUID()
const meta = { name, contentType, cacheControl: 'public, max-age=31536000, immutable', metadata: { firebaseStorageDownloadTokens: dl } }
const boundary = 'bz' + Date.now()
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
  img,
  Buffer.from(`\r\n--${boundary}--`),
])
const up = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=multipart`, { method: 'POST', headers: { ...H, 'Content-Type': `multipart/related; boundary=${boundary}` }, body })
if (!up.ok) throw new Error('upload: ' + up.status + ' ' + await up.text())
const coverUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(name)}?alt=media&token=${dl}`
const check = await fetch(coverUrl, { method: 'HEAD' })
if (!check.ok) throw new Error('capa não ficou pública: ' + check.status)

// 2) texto do rascunho
const md = readFileSync(draftPath, 'utf8')
const title = md.match(/## Título\n(.+)/)[1].trim()
const excerpt = md.match(/## Resumo\n(.+)/)[1].trim()
const content = md.slice(md.indexOf('## Texto\n') + 9).trim()
const slugify = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
const slug = slugify(title)
if (title.length > 140 || excerpt.length > 300 || content.length > 20000) throw new Error('limites do painel estourados (título 140, resumo 300, texto 20000)')

// 3) notícia -> Firestore, publicada
const now = new Date().toISOString()
const S = (v) => ({ stringValue: v })
const fields = { title: S(title), slug: S(slug), category: S(category), excerpt: S(excerpt), content: S(content), coverUrl: S(coverUrl), author: S(author), status: S('published'), createdAt: { timestampValue: now }, updatedAt: { timestampValue: now }, publishedAt: { timestampValue: now } }
const fs = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/posts`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) })
if (!fs.ok) throw new Error('firestore: ' + fs.status + ' ' + await fs.text())
const doc = await fs.json()
console.log('id:', doc.name.split('/').pop())
console.log('slug:', slug)
console.log('url: https://abluezone.com.br/bluenews?post=' + slug)
