import { describe, expect, it } from 'vitest'
import { buildMarkData, buildSdf, classifyPoint, measureMark, sampleMark, signedDistance, smoothField } from '../src/features/home/scene/markSampler'

function disc(width: number, height: number, cx: number, cy: number, radius: number) {
  const alpha = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius) alpha[y * width + x] = 255
  return alpha
}

describe('markSampler', () => {
  it('classifica anel externo, círculo interno e traço vertical pela geometria da marca', () => {
    expect(classifyPoint(0.95, 0)).toBe(0)
    expect(classifyPoint(0, -0.9)).toBe(0)
    expect(classifyPoint(0.5, 0)).toBe(1)
    expect(classifyPoint(0, -0.5)).toBe(1)
    expect(classifyPoint(0.02, 0.6)).toBe(2)
    expect(classifyPoint(0.02, 0.95)).toBe(2)
    expect(classifyPoint(0.4, 0.6)).toBe(1)
  })

  it('mede a marca ignorando o artefato de borda no topo do PNG', () => {
    const width = 60
    const height = 40
    const alpha = disc(width, height, 15, 22, 8)
    for (let x = 0; x < width; x++) alpha[x] = 255 // linha opaca de artefato no topo
    for (let y = 0; y < height; y++) alpha[y * width + 50] = 255 // "texto" à direita da marca
    const box = measureMark(alpha, width, height)
    expect(box).not.toBeNull()
    expect(box!.x0).toBe(7)
    expect(box!.x1).toBe(22)
    expect(box!.y0).toBe(14)
    expect(box!.y1).toBe(29)
  })

  it('gera distância assinada negativa dentro da tinta e crescente para fora', () => {
    const width = 41
    const height = 41
    const mask = new Uint8Array(width * height)
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (Math.hypot(x - 20, y - 20) <= 8) mask[y * width + x] = 1
    const field = signedDistance(mask, width, height)
    expect(field[20 * width + 20]).toBeLessThan(-6)
    expect(field[20 * width + 39]).toBeGreaterThan(9)
    const row = Array.from({ length: 10 }, (_, i) => field[20 * width + 30 + i])
    for (let i = 1; i < row.length; i++) expect(row[i] - row[i - 1]).toBeCloseTo(1, 5)
    const packed = buildSdf(mask, width, height, 10, 0)
    expect(packed[20 * width + 20]).toBeLessThan(128)
    expect(packed[20 * width + 39]).toBeGreaterThan(128)
  })

  it('suaviza a escada do PNG sem deslocar uma borda reta', () => {
    const width = 32
    const height = 32
    const mask = new Uint8Array(width * height)
    for (let y = 0; y < height; y++) for (let x = 0; x < 16; x++) mask[y * width + x] = 1
    const field = signedDistance(mask, width, height)
    const smooth = smoothField(field, width, height, 2)
    // borda entre x=15 (dentro, -0.5) e x=16 (fora, +0.5) continua com sinal trocado e centrada
    expect(smooth[16 * width + 15]).toBeLessThan(0)
    expect(smooth[16 * width + 16]).toBeGreaterThan(0)
    expect(smooth[16 * width + 15] + smooth[16 * width + 16]).toBeCloseTo(0, 5)
  })

  it('constrói MarkData com padding, centro em UV e amostras dentro da tinta', () => {
    const width = 80
    const height = 50
    const alpha = disc(width, height, 20, 25, 10)
    const mark = buildMarkData(alpha, width, height, 8, 12)
    expect(mark).not.toBeNull()
    expect(mark!.markWidth).toBe(20)
    expect(mark!.width).toBe(36)
    expect(mark!.center.x).toBeCloseTo(0.5, 5)
    let seed = 1
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    const samples = sampleMark(mark!, 200, random)
    expect(samples.count).toBe(200)
    for (let i = 0; i < samples.count; i++) {
      expect(Math.hypot(samples.positions[i * 2], samples.positions[i * 2 + 1])).toBeLessThanOrEqual(1.1)
      expect(samples.tones[i]).toBeGreaterThanOrEqual(0)
      expect(samples.tones[i]).toBeLessThanOrEqual(1)
    }
  })
})
