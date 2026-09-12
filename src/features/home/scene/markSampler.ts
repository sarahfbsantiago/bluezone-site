/**
 * Extrai a geometria oficial da marca Bluezone a partir do PNG.
 * Nada aqui redesenha o símbolo: a máscara binária do arquivo é a fonte da verdade.
 * O SDF (signed distance field) só serve para renderizar essa mesma máscara com bordas
 * suaves em qualquer escala, e as amostras de pontos alimentam a formação por partículas.
 */

export type MarkGroup = 0 | 1 | 2 // 0 = anel externo, 1 = círculo interno, 2 = traço vertical

export type MarkData = {
  /** largura/altura do recorte com padding, em pixels do PNG */
  width: number
  height: number
  /** padding aplicado em volta da marca, em pixels */
  padding: number
  /** máscara binária (1 = tinta), linha 0 = base da imagem (compatível com UV do Three) */
  mask: Uint8Array
  /** SDF empacotado em 0..255 (128 = borda), mesma orientação da máscara */
  sdf: Uint8Array
  /** alcance do SDF em pixels (valor 0 = -range, 255 = +range) */
  range: number
  /** centro da marca em UV (0..1, origem embaixo/esquerda) */
  center: { x: number; y: number }
  /** metade da largura da marca em pixels */
  halfWidth: number
  /** largura/altura reais da marca (sem padding) em pixels */
  markWidth: number
  markHeight: number
}

/** Limiares de classificação em coordenadas normalizadas (1 = metade da largura da marca). */
export const MARK_GEOMETRY = { outerRadius: 0.74, strokeHalfWidth: 0.15, strokeTop: 0.3 } as const

/** Classifica um ponto da marca em anel externo, círculo interno ou traço vertical. */
export function classifyPoint(nx: number, ny: number): MarkGroup {
  if (Math.abs(nx) < MARK_GEOMETRY.strokeHalfWidth && ny > MARK_GEOMETRY.strokeTop) return 2
  if (Math.hypot(nx, ny) > MARK_GEOMETRY.outerRadius) return 0
  return 1
}

const INF = 1e20

/** Transformada de distância 1D (Felzenszwalb & Huttenlocher). Reutiliza buffers para não alocar. */
function edt1d(f: Float64Array, d: Float64Array, v: Int32Array, z: Float64Array, n: number) {
  let k = 0
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= z[k]) {
      k--
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    }
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
  }
}

/** Distância euclidiana quadrada até o pixel "fonte" mais próximo (fonte = grid[i] !== 0). */
function edt2d(source: Uint8Array, width: number, height: number, out: Float64Array) {
  const size = Math.max(width, height)
  const f = new Float64Array(size)
  const d = new Float64Array(size)
  const v = new Int32Array(size)
  const z = new Float64Array(size + 1)
  for (let i = 0; i < width * height; i++) out[i] = source[i] ? 0 : INF
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = out[y * width + x]
    edt1d(f, d, v, z, height)
    for (let y = 0; y < height; y++) out[y * width + x] = d[y]
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = out[y * width + x]
    edt1d(f, d, v, z, width)
    for (let x = 0; x < width; x++) out[y * width + x] = d[x]
  }
}

/** Distância assinada em pixels (negativa dentro da tinta). */
export function signedDistance(mask: Uint8Array, width: number, height: number): Float64Array {
  const inverse = new Uint8Array(mask.length)
  for (let i = 0; i < mask.length; i++) inverse[i] = mask[i] ? 0 : 1
  const outside = new Float64Array(mask.length)
  const inside = new Float64Array(mask.length)
  edt2d(mask, width, height, outside)
  edt2d(inverse, width, height, inside)
  const signed = new Float64Array(mask.length)
  for (let i = 0; i < mask.length; i++) signed[i] = mask[i] ? -Math.sqrt(inside[i]) + 0.5 : Math.sqrt(outside[i]) - 0.5
  return signed
}

/**
 * Suaviza o campo de distância com um gaussiano separável.
 * O PNG oficial tem bordas em escada (upscale ~3,5x sem antialiasing); o blur reconstrói as curvas
 * contínuas da marca sem deslocar o contorno (o nível zero de uma borda é preservado pelo kernel simétrico).
 */
export function smoothField(field: Float64Array, width: number, height: number, sigma: number): Float64Array {
  if (sigma <= 0) return field
  const radius = Math.ceil(sigma * 3)
  const kernel = new Float64Array(radius * 2 + 1)
  let sum = 0
  for (let i = -radius; i <= radius; i++) { kernel[i + radius] = Math.exp(-(i * i) / (2 * sigma * sigma)); sum += kernel[i + radius] }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum
  const temp = new Float64Array(field.length)
  const out = new Float64Array(field.length)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let acc = 0
    for (let k = -radius; k <= radius; k++) { const sx = Math.min(width - 1, Math.max(0, x + k)); acc += field[y * width + sx] * kernel[k + radius] }
    temp[y * width + x] = acc
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let acc = 0
    for (let k = -radius; k <= radius; k++) { const sy = Math.min(height - 1, Math.max(0, y + k)); acc += temp[sy * width + x] * kernel[k + radius] }
    out[y * width + x] = acc
  }
  return out
}

/** Gera o SDF assinado, suavizado, e empacota em 8 bits (128 = borda). */
export function buildSdf(mask: Uint8Array, width: number, height: number, range: number, smoothing = 3.2): Uint8Array {
  const signed = smoothField(signedDistance(mask, width, height), width, height, smoothing)
  const packed = new Uint8Array(mask.length)
  for (let i = 0; i < mask.length; i++) packed[i] = Math.round(Math.max(0, Math.min(1, signed[i] / (2 * range) + 0.5)) * 255)
  return packed
}

/** Mede a marca (primeiro bloco de colunas com tinta) ignorando o artefato de borda no topo do PNG. */
export function measureMark(alpha: Uint8Array, width: number, height: number, threshold = 128, skipRows = 4) {
  let x0 = -1
  let x1 = -1
  for (let x = 0; x < width; x++) {
    let has = false
    for (let y = skipRows; y < height; y++) if (alpha[y * width + x] > threshold) { has = true; break }
    if (has && x0 < 0) x0 = x
    if (!has && x0 >= 0) { x1 = x - 1; break }
  }
  if (x0 < 0) return null
  if (x1 < 0) x1 = width - 1
  let y0 = height
  let y1 = -1
  for (let y = skipRows; y < height; y++) for (let x = x0; x <= x1; x++) if (alpha[y * width + x] > threshold) { if (y < y0) y0 = y; if (y > y1) y1 = y; break }
  return { x0, x1, y0, y1 }
}

/** Constrói MarkData a partir do canal alpha bruto (linha 0 = topo, como no PNG). */
export function buildMarkData(alpha: Uint8Array, width: number, height: number, padding = 48, range = 40): MarkData | null {
  const box = measureMark(alpha, width, height)
  if (!box) return null
  const markWidth = box.x1 - box.x0 + 1
  const markHeight = box.y1 - box.y0 + 1
  const outWidth = markWidth + padding * 2
  const outHeight = markHeight + padding * 2
  const mask = new Uint8Array(outWidth * outHeight)
  for (let y = 0; y < markHeight; y++) {
    const srcY = box.y0 + y
    const dstY = outHeight - 1 - (padding + y) // inverte para linha 0 = base
    for (let x = 0; x < markWidth; x++) mask[dstY * outWidth + padding + x] = alpha[srcY * width + box.x0 + x] > 128 ? 1 : 0
  }
  const sdf = buildSdf(mask, outWidth, outHeight, range)
  return {
    width: outWidth,
    height: outHeight,
    padding,
    mask,
    sdf,
    range,
    center: { x: (padding + markWidth / 2) / outWidth, y: (padding + markHeight / 2) / outHeight },
    halfWidth: markWidth / 2,
    markWidth,
    markHeight,
  }
}

export type MarkSamples = { positions: Float32Array; groups: Uint8Array; tones: Float32Array; count: number }

/** Distância assinada (px) lida do SDF empacotado, em coordenadas de pixel da máscara. */
function sdfAt(mark: MarkData, x: number, y: number) {
  const cx = Math.min(mark.width - 1, Math.max(0, Math.round(x)))
  const cy = Math.min(mark.height - 1, Math.max(0, Math.round(y)))
  return (mark.sdf[cy * mark.width + cx] / 255 - 0.5) * 2 * mark.range
}

const LIGHT = { x: -0.5, y: 0.72, z: 0.48 }

/**
 * Tom de iluminação (0 = sombra, 1 = luz) de um ponto da tinta, tratando cada traço como um tubo:
 * a normal inclina para fora perto da borda (gradiente do SDF) e aponta para a câmera no centro.
 */
export function toneAt(mark: MarkData, x: number, y: number, halfStroke: number) {
  const d = sdfAt(mark, x, y)
  const gx = sdfAt(mark, x + 1, y) - sdfAt(mark, x - 1, y)
  const gy = sdfAt(mark, x, y + 1) - sdfAt(mark, x, y - 1)
  const len = Math.hypot(gx, gy) || 1
  const edge = Math.max(0, Math.min(1, 1 + d / halfStroke)) // 1 na borda, 0 no centro do traço
  const s = Math.sin(edge * Math.PI * 0.5)
  const nx = (gx / len) * s
  const ny = (gy / len) * s
  const nz = Math.sqrt(Math.max(0, 1 - s * s))
  const lit = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z
  return Math.max(0, Math.min(1, lit * 0.5 + 0.5))
}

/**
 * Amostra `count` pontos da tinta da marca em unidades normalizadas (1 = metade da largura da marca).
 * Stippling: pontos do mesmo tamanho; o volume vem da densidade (sombra mais densa, luz mais rala) e do tom.
 */
export function sampleMark(mark: MarkData, count: number, random: () => number = Math.random): MarkSamples {
  const candidates: number[] = []
  let halfStroke = 1
  for (let i = 0; i < mark.mask.length; i++) if (mark.mask[i]) { candidates.push(i); halfStroke = Math.max(halfStroke, -(mark.sdf[i] / 255 - 0.5) * 2 * mark.range) }
  const positions = new Float32Array(count * 2)
  const groups = new Uint8Array(count)
  const tones = new Float32Array(count)
  const cx = mark.center.x * mark.width
  const cy = mark.center.y * mark.height
  let i = 0
  let guard = 0
  while (i < count && guard < count * 40) {
    guard++
    const index = candidates.length ? candidates[Math.floor(random() * candidates.length)] : 0
    const px = (index % mark.width) + random()
    const py = Math.floor(index / mark.width) + random()
    const tone = toneAt(mark, px, py, halfStroke)
    // rejeição: a luz afina a trama, a sombra adensa
    if (random() > 0.42 + 0.58 * (1 - tone)) continue
    const nx = (px - cx) / mark.halfWidth
    const ny = (py - cy) / mark.halfWidth
    positions[i * 2] = nx
    positions[i * 2 + 1] = ny
    groups[i] = classifyPoint(nx, ny)
    tones[i] = tone
    i++
  }
  return { positions, groups, tones, count: i }
}

let cache: Promise<MarkData | null> | null = null

/** Carrega e processa o PNG oficial uma única vez por sessão. */
export function loadMark(src = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/logo-bluezone-white.png`): Promise<MarkData | null> {
  if (cache) return cache
  cache = new Promise((resolve) => {
    if (typeof Image === 'undefined') return resolve(null)
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return resolve(null)
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      const alpha = new Uint8Array(canvas.width * canvas.height)
      for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3]
      resolve(buildMarkData(alpha, canvas.width, canvas.height))
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
  return cache
}
