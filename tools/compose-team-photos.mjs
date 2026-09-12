// Monta os retratos do time: recorte transparente (media-src/cutout) sobre fundo cinza, cabeça no mesmo tamanho e altura.
// Uso: PUPPETEER_EXECUTABLE_PATH=... node tools/compose-team-photos.mjs

import puppeteer from 'puppeteer'
import fs from 'fs'
const names = ['isabela-lima', 'alisson-werneck', 'raphael-bretz', 'ana-simoes', 'luiz-philipe', 'hebert-coutinho', 'sarah-santiago']
// ajustes manuais onde a medida automática da cabeça se confunde (rabo de cavalo, cabelo curto)
const tweak = { 'ana-simoes': { scale: 1.6, cx: 0.09, top: -0.02 }, 'luiz-philipe': { scale: 0.88, cx: 0, top: 0.01 }, 'raphael-bretz': { scale: 1.2, cx: 0, top: 0.02 }, 'sarah-santiago': { scale: 1.05, cx: 0.02, top: 0 } }
const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setContent('<canvas id="c"></canvas>')
for (const name of names) {
  const b64 = fs.readFileSync(`media-src/cutout/${name}.png`).toString('base64')
  const t = tweak[name] || { scale: 1, cx: 0, top: 0 }
  const out = await page.evaluate(async (b64, t) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const w = img.width, h = img.height
    const m = document.createElement('canvas'); m.width = w; m.height = h
    const mc = m.getContext('2d'); mc.drawImage(img, 0, 0)
    const d = mc.getImageData(0, 0, w, h).data
    const A = (x, y) => d[(y * w + x) * 4 + 3]
    // topo da cabeça: primeira linha com pelo menos 4 px opacos
    let top = 0
    for (let y = 0; y < h; y++) { let n = 0; for (let x = 0; x < w; x++) if (A(x, y) > 60) n++; if (n >= 4) { top = y; break } }
    // largura da cabeça na altura da testa/olhos (~12% da imagem abaixo do topo) e centro
    const rowW = (y) => { let l = -1, r = -1; for (let x = 0; x < w; x++) if (A(x, y) > 60) { if (l < 0) l = x; r = x } return [l, r] }
    let best = 0, cx = w / 2
    for (let y = top + Math.round(h * 0.08); y < top + Math.round(h * 0.2); y++) { const [l, r] = rowW(y); if (l >= 0 && r - l > best) { best = r - l; cx = (l + r) / 2 } }
    const S = 800
    const targetHead = S * 0.36      // largura da cabeça igual para todos
    const scale = (targetHead / best) * t.scale
    const headTop = S * (0.15 + t.top) // topo da cabeça na mesma altura
    const c = document.getElementById('c'); c.width = S; c.height = S
    const ctx = c.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#e3e6ec'); g.addColorStop(1, '#c6cad2')
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)
    ctx.imageSmoothingQuality = 'high'
    const dw = w * scale, dh = h * scale
    const dx = S / 2 - (cx + t.cx * w) * scale, dy = headTop - top * scale
    ctx.drawImage(img, dx, dy, dw, dh)
    return { png: c.toDataURL('image/png'), scale: scale.toFixed(2), top, head: best }
  }, b64, t)
  fs.writeFileSync(`public/midia/${name}.png`, Buffer.from(out.png.split(',')[1], 'base64'))
  console.log(name, 'escala', out.scale, 'topo', out.top, 'cabeça', out.head)
}
await browser.close()
