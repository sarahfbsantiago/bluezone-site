import { withBase } from '../lib/paths'

/**
 * Moldes de imagem no navegador (canvas): lâminas no visual da Bluezone, no tamanho do formato escolhido.
 * Sem servidor: o painel desenha, mostra a prévia e envia o JPEG para o Storage como mídia do post.
 */
export type TemplateId = 'frase' | 'titulo' | 'lista' | 'capa'
export type Theme = 'escuro' | 'claro'
export type TemplateSpec = { template: TemplateId; theme: Theme; kicker: string; title: string; body: string; footer: string; w: number; h: number }

export const TEMPLATES: Array<{ id: TemplateId; label: string; hint: string }> = [
  { id: 'frase', label: 'frase', hint: 'uma frase grande no centro, para posicionamento' },
  { id: 'titulo', label: 'título + texto', hint: 'título em cima e um parágrafo curto embaixo' },
  { id: 'lista', label: 'lista', hint: 'título e até 5 itens, um por linha' },
  { id: 'capa', label: 'capa de carrossel', hint: 'título forte, "arrasta" no rodapé' },
]

const FONT = "'IBM Plex Mono', Menlo, Consolas, monospace"
let symbol: Promise<HTMLImageElement> | null = null
function loadSymbol(): Promise<HTMLImageElement> {
  if (!symbol) symbol = new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = withBase('/logo-symbol.png') })
  return symbol
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.replace(/\r/g, '').split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word } else line = test
    }
    lines.push(line)
  }
  return lines
}

/** Ajusta o tamanho da fonte até o texto caber na caixa (largura e altura). */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number, weight: number, start: number, min: number, lineHeight: number): { size: number; lines: string[] } {
  for (let size = start; size >= min; size -= Math.max(2, Math.round(size * 0.06))) {
    ctx.font = `${weight} ${size}px ${FONT}`
    const lines = wrap(ctx, text, maxWidth)
    if (lines.length * size * lineHeight <= maxHeight) return { size, lines }
  }
  ctx.font = `${weight} ${min}px ${FONT}`
  return { size: min, lines: wrap(ctx, text, maxWidth) }
}

function seeded(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }

/** Anel pontilhista (referência ao símbolo) e estrelas, como na capa da BlueNews. */
function drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha: number) {
  const rnd = seeded(7)
  for (let i = 0; i < 7000; i++) {
    const a = rnd() * Math.PI * 2
    const rr = r + rnd() * rnd() * r * 0.45 * (rnd() < 0.5 ? -1 : 1)
    ctx.globalAlpha = alpha * (0.2 + rnd() * 0.8)
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.72, 1 + rnd() * 2.2, 0, 7); ctx.fill()
  }
  ctx.globalAlpha = 1
}

export async function renderTemplate(spec: TemplateSpec): Promise<{ blob: Blob; dataUrl: string }> {
  await (document.fonts?.load(`700 40px ${FONT}`) ?? Promise.resolve())
  await (document.fonts?.load(`400 40px ${FONT}`) ?? Promise.resolve())
  const canvas = document.createElement('canvas')
  canvas.width = spec.w; canvas.height = spec.h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas indisponível')
  const dark = spec.theme === 'escuro'
  const bg = dark ? '#06080d' : '#f4f7fb', ink = dark ? '#ffffff' : '#10243a', soft = dark ? 'rgba(255,255,255,.62)' : 'rgba(16,36,58,.62)', blue = '#1f6dff'
  const W = spec.w, H = spec.h, pad = Math.round(W * 0.085)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  // brilho azul discreto no canto e anel pontilhista
  const glow = ctx.createRadialGradient(W * 0.78, H * 0.28, 0, W * 0.78, H * 0.28, W * 0.7)
  glow.addColorStop(0, dark ? 'rgba(31,109,255,.28)' : 'rgba(31,109,255,.12)'); glow.addColorStop(1, 'rgba(31,109,255,0)')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
  drawRing(ctx, W * 0.78, H * 0.3, W * 0.22, dark ? '#dbe9ff' : '#1f6dff', dark ? 0.55 : 0.35)
  // cabeçalho: símbolo + nome
  try {
    const img = await loadSymbol()
    const s = Math.round(W * 0.05)
    ctx.drawImage(img, pad, pad, s, Math.round(s * img.height / img.width))
    ctx.fillStyle = ink; ctx.font = `700 ${Math.round(W * 0.026)}px ${FONT}`; ctx.textBaseline = 'middle'
    ctx.fillText('Bluezone', pad + s + Math.round(W * 0.015), pad + s * 0.55)
  } catch { /* sem símbolo, segue */ }
  if (spec.kicker) { ctx.fillStyle = soft; ctx.font = `500 ${Math.round(W * 0.02)}px ${FONT}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'right'; ctx.fillText(spec.kicker.toUpperCase().split('').join(' '), W - pad, pad + Math.round(W * 0.035)); ctx.textAlign = 'left' }

  const boxW = W - pad * 2
  const top = pad + Math.round(H * 0.12), bottom = H - pad - Math.round(H * 0.07)
  ctx.textBaseline = 'alphabetic'
  const drawLines = (lines: string[], size: number, y: number, lineHeight: number, color: string, weight: number) => {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${FONT}`
    lines.forEach((line, i) => ctx.fillText(line, pad, y + size + i * size * lineHeight))
    return y + lines.length * size * lineHeight
  }
  if (spec.template === 'frase') {
    const t = fit(ctx, spec.title, boxW, bottom - top, 700, Math.round(W * 0.085), Math.round(W * 0.04), 1.12)
    const totalH = t.lines.length * t.size * 1.12
    drawLines(t.lines, t.size, top + (bottom - top - totalH) / 2, 1.12, ink, 700)
  } else if (spec.template === 'titulo') {
    const t = fit(ctx, spec.title, boxW, (bottom - top) * 0.5, 700, Math.round(W * 0.07), Math.round(W * 0.036), 1.1)
    const y = drawLines(t.lines, t.size, top, 1.1, ink, 700)
    const b = fit(ctx, spec.body, boxW, bottom - y - Math.round(H * 0.03), 400, Math.round(W * 0.03), Math.round(W * 0.02), 1.5)
    drawLines(b.lines, b.size, y + Math.round(H * 0.03), 1.5, soft, 400)
  } else if (spec.template === 'lista') {
    const t = fit(ctx, spec.title, boxW, (bottom - top) * 0.35, 700, Math.round(W * 0.06), Math.round(W * 0.034), 1.1)
    let y = drawLines(t.lines, t.size, top, 1.1, ink, 700) + Math.round(H * 0.03)
    const items = spec.body.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 5)
    const size = Math.round(W * 0.03)
    ctx.font = `400 ${size}px ${FONT}`
    for (const [i, item] of items.entries()) {
      const lines = wrap(ctx, item, boxW - size * 2.2)
      ctx.fillStyle = blue; ctx.font = `700 ${size}px ${FONT}`; ctx.fillText(String(i + 1).padStart(2, '0'), pad, y + size)
      ctx.fillStyle = ink; ctx.font = `400 ${size}px ${FONT}`
      lines.forEach((line, j) => ctx.fillText(line, pad + size * 2.2, y + size + j * size * 1.45))
      y += lines.length * size * 1.45 + size * 0.7
      if (y > bottom) break
    }
  } else {
    const t = fit(ctx, spec.title, boxW, (bottom - top) * 0.7, 700, Math.round(W * 0.09), Math.round(W * 0.04), 1.08)
    const y = drawLines(t.lines, t.size, top + Math.round(H * 0.08), 1.08, ink, 700)
    if (spec.body) { const b = fit(ctx, spec.body, boxW, bottom - y - Math.round(H * 0.03), 400, Math.round(W * 0.03), Math.round(W * 0.02), 1.5); drawLines(b.lines, b.size, y + Math.round(H * 0.03), 1.5, soft, 400) }
    ctx.fillStyle = blue; ctx.font = `500 ${Math.round(W * 0.022)}px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText('arrasta  →', W - pad, H - pad); ctx.textAlign = 'left'
  }
  // rodapé
  ctx.fillStyle = soft; ctx.font = `500 ${Math.round(W * 0.019)}px ${FONT}`
  ctx.fillText((spec.footer || 'abluezone.com.br · @abluezone').toUpperCase().split('').join(' '), pad, H - pad)

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('sem imagem'))), 'image/jpeg', 0.9))
  return { blob, dataUrl }
}
