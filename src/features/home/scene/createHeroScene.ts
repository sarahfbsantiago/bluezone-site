import * as THREE from 'three'
import { heroTimeline, stateTransitionDuration, type SceneMood } from '../config/heroConfig'
import { MARK_GEOMETRY, loadMark, sampleMark, type MarkData } from './markSampler'
import * as glsl from './shaders'

export type Layout = 'desktop' | 'tablet' | 'mobile'

export type SceneOptions = { reduced: boolean; layout: Layout; mood: SceneMood; skipIntro?: boolean; dark?: boolean }

export type HeroSceneHandle = {
  setMood(mood: SceneMood): void
  /** Posição do ponteiro em NDC (-1..1) e se ele está sobre o hero. */
  setPointer(x: number, y: number, active: boolean): void
  /** Progresso da rolagem: `pages` em telas (0 hero, 1 deitada, 2 estrelas) e `contact` (0 → 1 ao chegar no contato, > 1 dentro dele). */
  setScroll(pages: number, contact: number): void
  /** Modo escuro: fundo preto e pontilhismo branco (transição suave). */
  setTheme(dark: boolean): void
  /** Posiciona a timeline de entrada em `seconds` (ferramenta de desenvolvimento e smoke test). */
  seek(seconds: number): void
  /** Segundos decorridos da timeline de entrada. */
  elapsed(): number
  setLayout(layout: Layout): void
  setVisible(visible: boolean): void
  dispose(): void
}

/** Largura da marca em unidades de cena. Tudo (partículas, SDF, órbitas) usa a mesma referência. */
const MARK_WIDTH = 2.5
const ORBIT_BASE = 1.95
const ORBIT_STEP = 0.23
const ORBIT_RATIO = 0.62

const QUALITY = {
  desktop: { form: 15000, dust: 600, orbits: 5, dotted: 2, spheres: 6, spherePoints: 900, sparkles: 10, octaves: 4, dpr: 1.75, dot: 0.98, sphereScale: 1, comets: 6 },
  tablet: { form: 12000, dust: 450, orbits: 4, dotted: 2, spheres: 6, spherePoints: 1000, sparkles: 8, octaves: 3, dpr: 1.8, dot: 1.2, sphereScale: 1, comets: 4 },
  mobile: { form: 9000, dust: 280, orbits: 4, dotted: 1, spheres: 6, spherePoints: 780, sparkles: 6, octaves: 3, dpr: 2, dot: 1.45, sphereScale: 0.85, comets: 3 },
} as const

/** Posição da marca reconstruída na página de contato (coluna da esquerda no desktop, topo no mobile). */
const CONTACT_PLACEMENT: Record<Layout, { x: number; y: number; scale: number }> = {
  desktop: { x: -2.45, y: -1.45, scale: 0.48 },
  tablet: { x: 0, y: -0.3, scale: 0.5 },
  mobile: { x: 0, y: -0.7, scale: 0.44 },
}
/** Pose da marca no contato: vista de três quartos (inclinada para trás e girada), diferente do hero e da página 2. */
const CONTACT_POSE = { x: -0.55, y: 0.38, z: -0.08 }

/** Posição da composição por layout: centro da página no desktop (headline dividida nos lados); no tablet e mobile a marca sobe e a headline entra abaixo. */
const PLACEMENT: Record<Layout, { x: number; y: number; scale: number }> = {
  desktop: { x: 0, y: 0.08, scale: 0.94 },
  tablet: { x: 0, y: 0.85, scale: 0.8 },
  mobile: { x: 0, y: 0.95, scale: 0.68 },
}

const ramp = (t: number, range: readonly [number, number]) => {
  const x = Math.min(1, Math.max(0, (t - range[0]) / (range[1] - range[0])))
  return x * x * (3 - 2 * x)
}
const smooth = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt))

/** Gerador determinístico (mulberry32) para a cena ser reproduzível entre recargas. */
function createRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mesma fórmula de `tilt()` no shader das partículas: Ry(ay) · Rx(ax) · Rz(az). */
function orbitEuler(index: number, tilt: number, target: THREE.Euler) {
  target.set((index - 2.5) * 0.14 + tilt, (index - 2.5) * 0.16, (index - 2.5) * 0.21, 'YXZ')
  return target
}

function radialTexture(): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,.55)')
    gradient.addColorStop(0.25, 'rgba(170,240,255,.32)')
    gradient.addColorStop(0.6, 'rgba(120,225,235,.1)')
    gradient.addColorStop(1, 'rgba(120,225,235,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function ellipseGeometry(rx: number, ry: number, segments: number, closed: boolean) {
  const positions = new Float32Array(segments * 3)
  const phase = new Float32Array(segments)
  for (let i = 0; i < segments; i++) {
    const t = i / (closed ? segments : segments - 1)
    const angle = t * Math.PI * 2
    positions[i * 3] = Math.cos(angle) * rx
    positions[i * 3 + 1] = Math.sin(angle) * ry
    positions[i * 3 + 2] = 0
    phase[i] = t
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  return geometry
}

export function createHeroScene(host: HTMLElement, options: SceneOptions): HeroSceneHandle | null {
  let renderer: THREE.WebGLRenderer
  try {
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl2') ?? probe.getContext('webgl')
    if (!context) return null
    renderer = new THREE.WebGLRenderer({ canvas: probe, context: context as WebGLRenderingContext, alpha: true, antialias: true, powerPreference: 'high-performance', premultipliedAlpha: true })
  } catch {
    return null
  }

  const random = createRandom(20260911)
  let layout = options.layout
  let quality = QUALITY[layout]
  const reduced = options.reduced
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr))
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false
  renderer.domElement.classList.add('hero-scene-canvas')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40)
  camera.position.set(0, 0, 8)
  const root = new THREE.Group()
  scene.add(root)

  const uDark = { value: options.dark ? 1 : 0 }
  let darkTarget = options.dark ? 1 : 0
  const uHover = { value: 0 }

  // ---------- Atmosfera (passe ortográfico de tela cheia) ----------
  const bgScene = new THREE.Scene()
  const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const bgMaterial = new THREE.ShaderMaterial({
    vertexShader: glsl.atmosphereVertex,
    fragmentShader: glsl.atmosphereFragment,
    defines: { OCTAVES: quality.octaves },
    uniforms: { uTime: { value: 0 }, uAtmos: { value: 0 }, uAccent: { value: options.mood.accent }, uPurple: { value: 0 }, uDark, uTextGlow: { value: 0 }, uTextCenter: { value: new THREE.Vector2(0.5, 0.5) }, uRes: { value: new THREE.Vector2(1, 1) }, uFocus: { value: new THREE.Vector2(0.66, 0.5) } },
    depthTest: false,
    depthWrite: false,
  })
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial)
  bgMesh.frustumCulled = false
  bgScene.add(bgMesh)

  // ---------- Halo suave atrás da composição ----------
  const haloTexture = radialTexture()
  const bgHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, transparent: true, opacity: 0, depthWrite: false, depthTest: false }))
  bgHalo.scale.set(7.2, 5.4, 1)
  bgHalo.position.z = -0.8
  bgHalo.renderOrder = 0
  root.add(bgHalo)

  // ---------- Uniforms compartilhados ----------
  const uTime = { value: 0 }
  const uPixelRatio = { value: renderer.getPixelRatio() }
  const uDir = { value: options.mood.direction as number }
  const uTilt = { value: options.mood.tilt }
  const uAccent = { value: options.mood.accent }
  const uOrbitReveal = { value: 0 }
  const uFade = { value: 0 }
  const uPulse = { value: 0 }
  const uStreakSpeed = { value: options.mood.streakSpeed }

  // ---------- Órbitas elípticas em planos diferentes ----------
  const orbitGroups: THREE.Group[] = []
  const orbitMaterials: THREE.ShaderMaterial[] = []
  const orbitEulerTmp = new THREE.Euler()
  for (let i = 0; i < quality.orbits; i++) {
    const group = new THREE.Group()
    group.rotation.copy(orbitEuler(i, options.mood.tilt, orbitEulerTmp))
    const rx = ORBIT_BASE + i * ORBIT_STEP
    const material = new THREE.ShaderMaterial({
      vertexShader: glsl.orbitVertex,
      fragmentShader: glsl.orbitFragment,
      uniforms: { uTime, uReveal: uOrbitReveal, uDir, uSpeed: uStreakSpeed, uDark, uShift: { value: i * 0.37 }, uColor: { value: new THREE.Color(i % 2 ? '#4fc8ff' : '#5fe0c8') }, uOpacity: { value: i === 1 || i === 3 ? 0.5 : 0.28 }, uPulse },
      transparent: true,
      depthWrite: false,
      premultipliedAlpha: true,
    })
    const line = new THREE.LineLoop(ellipseGeometry(rx, rx * ORBIT_RATIO, 240, true), material)
    line.renderOrder = 1
    group.add(line)
    root.add(group)
    orbitGroups.push(group)
    orbitMaterials.push(material)
  }

  // ---------- Anéis pontilhados ----------
  const dottedGroups: THREE.Group[] = []
  const dottedMaterial = new THREE.ShaderMaterial({
    vertexShader: glsl.dottedVertex,
    fragmentShader: glsl.dottedFragment,
    uniforms: { uTime, uReveal: uOrbitReveal, uDir, uPixelRatio, uDark, uColor: { value: new THREE.Color('#9be8ff') }, uOpacity: { value: 0.8 } },
    transparent: true,
    depthWrite: false,
    premultipliedAlpha: true,
  })
  for (let i = 0; i < quality.dotted; i++) {
    const group = new THREE.Group()
    group.rotation.set(0.42 + i * 0.5, -0.35 + i * 0.9, 0.2, 'YXZ')
    const rx = 1.72 + i * 1.05
    const points = new THREE.Points(ellipseGeometry(rx, rx * 0.7, 72 + i * 30, true), dottedMaterial)
    points.renderOrder = 1
    group.add(points)
    root.add(group)
    dottedGroups.push(group)
  }

  // ---------- Partículas: marca (stippling) + poeira + esferas pontilhistas, um único BufferGeometry ----------
  const formCount = quality.form
  const dustCount = quality.dust
  const sphereCount = quality.spheres
  const spherePointCount = quality.spherePoints
  const count = formCount + dustCount + sphereCount * spherePointCount
  const scatter = new Float32Array(count * 3)
  const targets = new Float32Array(count * 3)
  const orbits = new Float32Array(count * 4)
  const seeds = new Float32Array(count * 2)
  const groups = new Float32Array(count)
  const stars = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // destino de cada ponto quando a marca se desintegra: campo de estrelas cobrindo a tela
    stars[i * 3] = (random() * 2 - 1) * (0.6 + 0.4 * Math.sqrt(random()))
    stars[i * 3 + 1] = random() * 2 - 1
    stars[i * 3 + 2] = (random() - 0.5) * 2.4
  }
  for (let i = 0; i < formCount + dustCount; i++) {
    const dust = i >= formCount
    const radius = dust ? 1.6 + random() * 4.4 : 1.4 + random() * 3
    const angle = random() * Math.PI * 2
    scatter[i * 3] = Math.cos(angle) * radius * 1.15
    scatter[i * 3 + 1] = Math.sin(angle) * radius * 0.78
    scatter[i * 3 + 2] = (random() - 0.5) * 2.2
    targets[i * 3] = scatter[i * 3]
    targets[i * 3 + 1] = scatter[i * 3 + 1]
    targets[i * 3 + 2] = scatter[i * 3 + 2]
    orbits[i * 4] = dust ? 1.9 + random() * 1.8 : 1.7 + random() * 1.7
    orbits[i * 4 + 1] = random() * Math.PI * 2
    orbits[i * 4 + 2] = Math.floor(random() * 6)
    orbits[i * 4 + 3] = 0.02 + random() * 0.05
    seeds[i * 2] = random()
    seeds[i * 2 + 1] = 0.5
    groups[i] = dust ? 3 : 0
  }
  // Esferas: pontos distribuídos uniformemente na superfície unitária (Fibonacci), com jitter
  for (let s = 0; s < sphereCount; s++) {
    for (let j = 0; j < spherePointCount; j++) {
      const i = formCount + dustCount + s * spherePointCount + j
      const y = 1 - ((j + 0.5) / spherePointCount) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const phi = j * 2.399963 + random() * 0.15
      targets[i * 3] = Math.cos(phi) * r
      targets[i * 3 + 1] = y
      targets[i * 3 + 2] = Math.sin(phi) * r
      orbits[i * 4] = s
      seeds[i * 2] = random()
      seeds[i * 2 + 1] = 0.5
      groups[i] = 4
    }
  }
  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(scatter, 3))
  const targetAttribute = new THREE.BufferAttribute(targets, 3)
  const groupAttribute = new THREE.BufferAttribute(groups, 1)
  const seedAttribute = new THREE.BufferAttribute(seeds, 2)
  particleGeometry.setAttribute('aTarget', targetAttribute)
  particleGeometry.setAttribute('aOrbit', new THREE.BufferAttribute(orbits, 4))
  particleGeometry.setAttribute('aSeed', seedAttribute)
  particleGeometry.setAttribute('aGroup', groupAttribute)
  particleGeometry.setAttribute('aStar', new THREE.BufferAttribute(stars, 3))
  particleGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
  const sphereUniform = Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0))
  const sphereRotUniform = new Float32Array(8)
  const sphereTiltUniform = new Float32Array(8)
  const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: glsl.particleVertex,
    fragmentShader: glsl.particleFragment,
    uniforms: {
      uTime, uPixelRatio, uDir, uTilt, uAccent, uFade, uDark,
      uForm: { value: 0 }, uRelease: { value: 0 }, uBurst: { value: 0 },
      uSpread: { value: options.mood.spread }, uSwirl: { value: options.mood.swirl },
      uSizeScale: { value: 1 }, uDot: { value: quality.dot }, uPointer: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2(99, 99) }, uMouseStrength: { value: 0 },
      uSpheres: { value: sphereUniform }, uSphereRot: { value: sphereRotUniform }, uSphereTilt: { value: sphereTiltUniform }, uSphereReveal: { value: 0 },
      uScatter: { value: 0 }, uStarSpread: { value: new THREE.Vector2(6, 4) }, uDepth: { value: 0 },
      uSphereRef: { value: 0.22 * quality.sphereScale },
      uStarDensity: { value: layout === 'mobile' ? 0.55 : layout === 'tablet' ? 0.75 : 1 }, uClearCenter: { value: new THREE.Vector2(0, 0) },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    premultipliedAlpha: true,
  })
  const particles = new THREE.Points(particleGeometry, particleMaterial)
  particles.frustumCulled = false
  particles.renderOrder = 2
  root.add(particles)

  // ---------- Esferas: parâmetros de órbita (a renderização é pontilhista, no buffer acima) ----------
  const sphereParams: { orbit: number; phase: number; speed: number; size: number; lift: number; spin: number }[] = []
  // Cada esfera tem órbita, fase e velocidade próprias: podem se cruzar, mas nunca viajam juntas.
  const orbitOrder = [1, 3, 0, 4, 2, 5, 1, 3]
  for (let i = 0; i < sphereCount; i++) {
    const orbit = orbitOrder[i] % quality.orbits
    const shared = orbitOrder.slice(0, i).filter((o) => o % quality.orbits === orbit).length
    sphereParams.push({
      orbit,
      phase: (i / sphereCount) * Math.PI * 2 + shared * Math.PI * 0.5 + random() * 0.5,
      speed: (0.045 + i * 0.011 + random() * 0.015) * (i % 2 ? 1 : 1.15),
      size: (i === 0 ? 0.105 : 0.16 + random() * 0.12) * quality.sphereScale,
      lift: (random() - 0.5) * 0.25 + (shared ? 0.35 : 0),
      spin: (0.2 + random() * 0.25) * (random() > 0.5 ? 1 : -1),
    })
  }

  // ---------- Brilhos pontuais ----------
  const sparkleCount = quality.sparkles
  const sparklePositions = new Float32Array(sparkleCount * 3)
  const sparkleSeeds = new Float32Array(sparkleCount)
  const sparkleTmp = new THREE.Vector3()
  for (let i = 0; i < sparkleCount; i++) {
    const orbit = i % quality.orbits
    const rx = ORBIT_BASE + orbit * ORBIT_STEP
    const angle = random() * Math.PI * 2
    sparkleTmp.set(Math.cos(angle) * rx, Math.sin(angle) * rx * ORBIT_RATIO, 0).applyEuler(orbitEuler(orbit, 0, orbitEulerTmp))
    sparklePositions[i * 3] = sparkleTmp.x
    sparklePositions[i * 3 + 1] = sparkleTmp.y
    sparklePositions[i * 3 + 2] = sparkleTmp.z
    sparkleSeeds[i] = random()
  }
  const sparkleGeometry = new THREE.BufferGeometry()
  sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3))
  sparkleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(sparkleSeeds, 1))
  const sparkleMaterial = new THREE.ShaderMaterial({ vertexShader: glsl.sparkleVertex, fragmentShader: glsl.sparkleFragment, uniforms: { uTime, uFade, uPixelRatio, uDark }, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true })
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial)
  sparkles.frustumCulled = false
  sparkles.renderOrder = 6
  root.add(sparkles)

  // ---------- Cometas (páginas 3 e 4): fora da composição, cobrindo a tela ----------
  const cometCount = quality.comets
  const TRAIL = 220
  const cometPath = new Float32Array(cometCount * TRAIL * 4)
  const cometTiming = new Float32Array(cometCount * TRAIL * 3)
  const cometTrail = new Float32Array(cometCount * TRAIL)
  const cometPositions = new Float32Array(cometCount * TRAIL * 3)
  for (let k = 0; k < cometCount; k++) {
    // nasce numa borda e cruza em diagonal; cada cometa com período e fase próprios (intervalos irregulares)
    const side = k % 4
    const along = random() * 1.6 - 0.8
    const start = side === 0 ? [-1.25, along] : side === 1 ? [1.25, along] : side === 2 ? [along, 1.2] : [along, -1.2]
    const angle = Math.atan2(-start[1], -start[0]) + (random() - 0.5) * 0.9
    const period = 14 + random() * 16
    const phase = random() * period
    const curve = (random() - 0.5) * 0.5
    for (let i = 0; i < TRAIL; i++) {
      const idx = k * TRAIL + i
      cometPath.set([start[0], start[1], Math.cos(angle), Math.sin(angle)], idx * 4)
      cometTiming.set([period, phase, curve], idx * 3)
      cometTrail[idx] = i / (TRAIL - 1)
    }
  }
  const cometGeometry = new THREE.BufferGeometry()
  cometGeometry.setAttribute('position', new THREE.BufferAttribute(cometPositions, 3))
  cometGeometry.setAttribute('aPath', new THREE.BufferAttribute(cometPath, 4))
  cometGeometry.setAttribute('aTiming', new THREE.BufferAttribute(cometTiming, 3))
  cometGeometry.setAttribute('aTrail', new THREE.BufferAttribute(cometTrail, 1))
  cometGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30)
  const cometMaterial = new THREE.ShaderMaterial({
    vertexShader: glsl.cometVertex,
    fragmentShader: glsl.cometFragment,
    uniforms: { uTime, uPixelRatio, uDark, uVisible: { value: 0 }, uArea: { value: new THREE.Vector2(6, 4) } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    premultipliedAlpha: true,
  })
  const comets = new THREE.Points(cometGeometry, cometMaterial)
  comets.frustumCulled = false
  comets.renderOrder = 1
  scene.add(comets)

  // ---------- Marca oficial: SDF + glow ----------
  const logoGroup = new THREE.Group()
  root.add(logoGroup)
  let glowMaterial: THREE.ShaderMaterial | null = null
  let sdfTexture: THREE.DataTexture | null = null
  let logoGeometry: THREE.PlaneGeometry | null = null
  let markReadyAt = -1
  let disposed = false

  const installMark = (mark: MarkData) => {
    if (disposed) return
    sdfTexture = new THREE.DataTexture(mark.sdf, mark.width, mark.height, THREE.RedFormat, THREE.UnsignedByteType)
    sdfTexture.minFilter = THREE.LinearFilter
    sdfTexture.magFilter = THREE.LinearFilter
    sdfTexture.generateMipmaps = false
    sdfTexture.unpackAlignment = 1
    sdfTexture.needsUpdate = true
    const planeWidth = (MARK_WIDTH * mark.width) / mark.markWidth
    const planeHeight = planeWidth * (mark.height / mark.width)
    logoGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
    // A marca é pontilhista: só o glow usa o SDF; a forma é feita pelas partículas formadas.
    glowMaterial = new THREE.ShaderMaterial({
      vertexShader: glsl.logoVertex,
      fragmentShader: glsl.logoGlowFragment,
      uniforms: { uSdf: { value: sdfTexture }, uRange: { value: mark.range }, uReveal: { value: 0 }, uTime, uAccent, uPulse, uDark, uHover },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      premultipliedAlpha: true,
    })
    const glow = new THREE.Mesh(logoGeometry, glowMaterial)
    glow.renderOrder = 1
    glow.position.set(0.05, -0.07, -0.03)
    logoGroup.add(glow)

    // Alvos de formação amostrados da tinta oficial
    const samples = sampleMark(mark, formCount, random)
    for (let i = 0; i < formCount; i++) {
      const j = i < samples.count ? i : i % Math.max(samples.count, 1)
      targets[i * 3] = samples.positions[j * 2] * (MARK_WIDTH / 2)
      targets[i * 3 + 1] = samples.positions[j * 2 + 1] * (MARK_WIDTH / 2)
      targets[i * 3 + 2] = (random() - 0.5) * 0.16
      groups[i] = samples.groups[j]
      seeds[i * 2 + 1] = samples.tones[j]
    }
    targetAttribute.needsUpdate = true
    groupAttribute.needsUpdate = true
    seedAttribute.needsUpdate = true
    // Com reduced motion ou intro já vista, a marca nasce formada e estável.
    markReadyAt = reduced || options.skipIntro ? 0 : elapsed
    if (reduced) renderFrame(0)
  }
  loadMark().then((mark) => { if (mark) installMark(mark) })

  // ---------- Estado dinâmico ----------
  const mood = { ...options.mood, offset: { ...options.mood.offset } }
  const current = { dir: options.mood.direction as number, tilt: options.mood.tilt, spread: options.mood.spread, swirl: options.mood.swirl, accent: options.mood.accent, ox: options.mood.offset.x, oy: options.mood.offset.y, scale: options.mood.scale, streak: options.mood.streakSpeed }
  const pointerTarget = new THREE.Vector2()
  const pointerCurrent = new THREE.Vector2()
  const mouseTarget = new THREE.Vector2(99, 99)
  const mouseCurrent = new THREE.Vector2(99, 99)
  let mouseStrengthTarget = 0
  let mouseStrength = 0
  let scrollTarget = 0
  let scroll = 0
  let contactTarget = 0
  let contactScroll = 0
  let visibleHalfWidth = 1
  let visibleHalfHeight = 1
  let elapsed = options.skipIntro || reduced ? 99 : 0
  let transition = 2
  let visible = true
  let frame = 0
  let placementScale = PLACEMENT[layout].scale
  const clock = new THREE.Clock(false)
  const dummy = new THREE.Object3D()
  const tmpVector = new THREE.Vector3()
  const tmpVector2 = new THREE.Vector2()
  const tmpCenter = new THREE.Vector3()
  const tmpEuler = new THREE.Euler()

  const resize = () => {
    const width = Math.max(1, host.clientWidth)
    const height = Math.max(1, host.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.getDrawingBufferSize(tmpVector2)
    bgMaterial.uniforms.uRes.value.copy(tmpVector2)
    visibleHalfHeight = camera.position.z * Math.tan((camera.fov * Math.PI) / 360)
    visibleHalfWidth = visibleHalfHeight * camera.aspect
    const visibleWidth = visibleHalfWidth * 2
    placementScale = Math.min(PLACEMENT[layout].scale, (visibleWidth * 0.7) / MARK_WIDTH)
    particleMaterial.uniforms.uStarSpread.value.set(visibleHalfWidth * 1.15, visibleHalfHeight * 1.2)
    cometMaterial.uniforms.uArea.value.set(visibleHalfWidth, visibleHalfHeight)
    // clareira do campo de estrelas: no retrato acompanha o bloco de texto, que fica mais alto
    particleMaterial.uniforms.uClearCenter.value.set(0, layout === 'desktop' ? 0 : visibleHalfHeight * 0.22)
    particleMaterial.uniforms.uStarDensity.value = layout === 'mobile' ? 0.55 : layout === 'tablet' ? 0.75 : 1
    if (reduced) renderFrame(0)
  }

  const renderFrame = (dt: number, rawDt = dt) => {
    if (disposed) return
    elapsed += rawDt
    uTime.value += dt
    transition = Math.min(transition + dt / stateTransitionDuration, 2)

    // Timeline de entrada
    const formStart = markReadyAt < 0 ? Infinity : Math.max(heroTimeline.formation[0], markReadyAt + 0.15)
    const atmos = ramp(elapsed, heroTimeline.atmosphere)
    const fade = ramp(elapsed, heroTimeline.particles)
    const orbitReveal = ramp(elapsed, heroTimeline.orbits)
    const form = Number.isFinite(formStart) ? ramp(elapsed, [formStart, formStart + 1.6]) : 0
    const logoReveal = Number.isFinite(formStart) ? ramp(elapsed, [formStart + 1.3, formStart + 2.3]) : 0

    // Transição de estado: desfaz parcialmente e reorganiza
    const t = Math.min(transition, 1)
    const wave = Math.sin(Math.PI * t)
    const burst = smooth(0, 0.22, t) * (1 - smooth(0.22, 1, t)) * 0.9
    const release = 0.55 * wave
    uPulse.value = wave

    // Interpolação suave dos parâmetros do estado
    const k = 2.4
    current.dir = damp(current.dir, mood.direction, 1.6, dt)
    current.tilt = damp(current.tilt, mood.tilt, k, dt)
    current.spread = damp(current.spread, mood.spread, k, dt)
    current.swirl = damp(current.swirl, mood.swirl, k, dt)
    current.accent = damp(current.accent, mood.accent, 1.8, dt)
    current.ox = damp(current.ox, mood.offset.x, k, dt)
    current.oy = damp(current.oy, mood.offset.y, k, dt)
    current.scale = damp(current.scale, mood.scale, k, dt)
    current.streak = damp(current.streak, mood.streakSpeed, k, dt)
    pointerCurrent.x = damp(pointerCurrent.x, pointerTarget.x, 3, dt)
    pointerCurrent.y = damp(pointerCurrent.y, pointerTarget.y, 3, dt)
    mouseStrength = damp(mouseStrength, mouseStrengthTarget, 4, dt)
    uDark.value = reduced ? darkTarget : damp(uDark.value, darkTarget, 5, dt)
    bgHalo.material.color.setRGB(1 - 0.25 * uDark.value, 1 - 0.1 * uDark.value, 1)
    scroll = reduced ? scrollTarget : damp(scroll, scrollTarget, 5, dt)
    contactScroll = reduced ? contactTarget : damp(contactScroll, contactTarget, 5, dt)
    const tiltBack = smooth(0, 0.85, scroll)   // hero → página 2: marca deita em 3D e desce, esfera vai ao centro
    const scatterRaw = smooth(1, 2, scroll)    // página 2 → 3: tudo se desintegra em estrelas
    const reform = smooth(0.35, 1, contactScroll)  // página de contato: as estrelas voltam a formar a marca no fim da aproximação
    const scatter = scatterRaw * (1 - reform)
    const settle = tiltBack * (1 - scatterRaw) // inclinação some enquanto vira campo de estrelas (e não volta no contato)
    if (mouseStrengthTarget > 0 || mouseStrength > 0.01) {
      mouseCurrent.x = damp(mouseCurrent.x, mouseTarget.x, 9, dt)
      mouseCurrent.y = damp(mouseCurrent.y, mouseTarget.y, 9, dt)
    }

    uDir.value = current.dir
    uTilt.value = current.tilt
    uAccent.value = current.accent
    uFade.value = fade
    uOrbitReveal.value = orbitReveal * (1 - scatter)
    uStreakSpeed.value = current.streak * (1 + 2.2 * wave)
    particleMaterial.uniforms.uForm.value = form
    particleMaterial.uniforms.uRelease.value = release
    particleMaterial.uniforms.uBurst.value = burst
    particleMaterial.uniforms.uSpread.value = current.spread
    particleMaterial.uniforms.uSwirl.value = current.swirl
    particleMaterial.uniforms.uPointer.value.copy(pointerCurrent)
    particleMaterial.uniforms.uMouseStrength.value = mouseStrength
    uHover.value = mouseStrength
    particleMaterial.uniforms.uScatter.value = scatter
    particleMaterial.uniforms.uDepth.value = Math.max(settle, reform * 0.7)
    // cometas só com o campo de estrelas formado (páginas 3 e 4), nunca em reduced motion
    cometMaterial.uniforms.uVisible.value = reduced ? 0 : smooth(1.6, 2.2, scroll) * (1 - smooth(0.2, 0.8, contactScroll))
    bgMaterial.uniforms.uAtmos.value = atmos
    bgMaterial.uniforms.uAccent.value = current.accent
    bgMaterial.uniforms.uPurple.value = Math.min(1, scroll)
    // luz atrás do texto só com o campo de estrelas formado (páginas 3 e 4); centro mais alto no retrato
    bgMaterial.uniforms.uTextGlow.value = scatter * (1 - reform)
    // parallax leve com a rolagem e tom da nebulosa variando por página
    const pageFrac = scroll - Math.floor(scroll)
    bgMaterial.uniforms.uTextCenter.value.set(0.5, (layout === 'desktop' ? 0.52 : 0.6) + (pageFrac - 0.5) * 0.06)
    bgHalo.material.opacity = atmos * (0.08 + 0.06 * wave + 0.12 * settle) * (1 - scatter)
    bgHalo.scale.set(7.2 - 3.6 * settle, 5.4 - 2.6 * settle, 1)
    // a sombra da marca some junto com os primeiros pontos que se dispersam
    if (glowMaterial) glowMaterial.uniforms.uReveal.value = logoReveal * 0.85 * (1 - smooth(0, 0.3, scatter))

    // Composição: posição, escala, parallax
    const placement = PLACEMENT[layout]
    const lift = layout === 'desktop' ? -1.05 : layout === 'tablet' ? -1.7 : -1.9 // na página 2 a galáxia desce
    const scale = placementScale * current.scale * (1 - 0.025 * wave) * (1 - 0.14 * settle)
    // no campo de estrelas a composição volta ao centro da tela; no contato, vai para a coluna da esquerda
    const contact = CONTACT_PLACEMENT[layout]
    const baseX = (placement.x + current.ox) * (1 - scatterRaw)
    const baseY = (placement.y + current.oy) * (1 - scatterRaw) + lift * settle
    // dentro da página de contato a marca rola junto com o conteúdo, como um elemento em fluxo
    const inFlow = Math.max(0, contactScroll - 1) * visibleHalfHeight * 2
    root.position.set(baseX + (contact.x - baseX) * reform, baseY + (contact.y - baseY) * reform + inFlow, 0)
    root.scale.setScalar(scale + (placementScale * contact.scale - scale) * reform)
    // Tamanho do ponto: cheio no layout base (no mobile a composição já é menor e os pontos não podem cair abaixo de 1px),
    // mas encolhe junto quando a marca diminui (página 2, contato), para o pontilhismo não virar traço sólido.
    const shrink = Math.max(0.45, Math.min(1, root.scale.x / placementScale))
    particleMaterial.uniforms.uSizeScale.value = Math.max(placementScale, 0.95) * shrink
    root.rotation.set(-pointerCurrent.y * 0.05 - 1.0 * settle + CONTACT_POSE.x * reform, pointerCurrent.x * 0.07 + 0.38 * settle + CONTACT_POSE.y * reform, 0.12 * settle + CONTACT_POSE.z * reform)
    // Mouse em coordenadas da composição (plano z = 0), para a repulsão dos pontos da marca
    if (mouseStrengthTarget > 0) {
      const worldX = pointerTarget.x * visibleHalfWidth
      const worldY = -pointerTarget.y * visibleHalfHeight
      mouseTarget.set((worldX - root.position.x) / scale, (worldY - root.position.y) / scale)
    }
    particleMaterial.uniforms.uMouse.value.copy(mouseCurrent)
    logoGroup.position.y = Math.sin(uTime.value * 0.45) * 0.03
    logoGroup.rotation.z = Math.sin(uTime.value * 0.3) * 0.006

    // Foco da atmosfera segue a composição na tela
    tmpVector.copy(root.position).project(camera)
    bgMaterial.uniforms.uFocus.value.set((tmpVector.x + 1) / 2, (tmpVector.y + 1) / 2)


    // Órbitas inclinam com o estado
    for (let i = 0; i < orbitGroups.length; i++) orbitGroups[i].rotation.copy(orbitEuler(i, current.tilt, tmpEuler))
    for (let i = 0; i < dottedGroups.length; i++) dottedGroups[i].rotation.z = uTime.value * 0.01 * current.dir

    // Esferas percorrem as órbitas; posição, raio e rotação vão ao shader por uniform
    for (let i = 0; i < sphereCount; i++) {
      const p = sphereParams[i]
      const rx = ORBIT_BASE + p.orbit * ORBIT_STEP
      const angle = p.phase + uTime.value * p.speed * current.dir
      tmpVector.set(Math.cos(angle) * rx, Math.sin(angle) * rx * ORBIT_RATIO + p.lift, 0).applyEuler(orbitGroups[p.orbit].rotation)
      tmpVector.multiplyScalar(1 + burst * 0.35)
      let centerK = 0
      if (i === 0) {
        // a menor esfera desliza da órbita para o meio exato do círculo interno, no plano da marca
        centerK = smooth(0.1, 0.9, tiltBack)
        tmpVector.lerp(tmpCenter.set(0, 0, 0), centerK)
      }
      sphereUniform[i].set(tmpVector.x, tmpVector.y, tmpVector.z, p.size * (1 + 0.05 * Math.sin(uTime.value * 1.1 + i)))
      // no centro, o giro acelera e ganha um segundo eixo (tombo), para a rotação ficar visível
      sphereRotUniform[i] = uTime.value * p.spin * (1 + 2.8 * centerK)
      sphereTiltUniform[i] = centerK * (uTime.value * 0.45 + Math.sin(uTime.value * 0.8) * 0.4)
    }
    particleMaterial.uniforms.uSphereReveal.value = orbitReveal

    renderer.clear()
    renderer.render(bgScene, bgCamera)
    renderer.render(scene, camera)
  }

  const loop = () => {
    frame = requestAnimationFrame(loop)
    if (!visible) return
    const rawDt = Math.min(clock.getDelta(), 0.5)
    renderFrame(Math.min(rawDt, 0.05), rawDt)
  }

  const onContextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame) }
  const onContextRestored = () => { if (!reduced && visible) { clock.start(); loop() } }
  renderer.domElement.addEventListener('webglcontextlost', onContextLost)
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  observer?.observe(host)
  if (!observer) window.addEventListener('resize', resize)
  resize()
  if (reduced) renderFrame(0)
  else { clock.start(); loop() }

  return {
    setMood(next) {
      Object.assign(mood, next, { offset: { ...next.offset } })
      if (reduced) {
        // Sem animação: aplica o estado direto e renderiza um único frame estável.
        Object.assign(current, { dir: next.direction, tilt: next.tilt, spread: next.spread, swirl: next.swirl, accent: next.accent, ox: next.offset.x, oy: next.offset.y, scale: next.scale, streak: next.streakSpeed })
        transition = 2
        renderFrame(0)
        return
      }
      transition = 0
    },
    seek(seconds) {
      elapsed = seconds
      transition = 2
      renderFrame(0)
    },
    elapsed() { return elapsed },
    setLayout(next) {
      layout = next
      resize()
    },
    setTheme(dark) {
      darkTarget = dark ? 1 : 0
      if (reduced) renderFrame(0)
    },
    setScroll(pages, contact) {
      scrollTarget = Math.max(0, pages)
      contactTarget = Math.max(0, contact)
      if (reduced) renderFrame(0)
    },
    setPointer(x, y, active) {
      pointerTarget.set(x, y)
      mouseStrengthTarget = active && !reduced ? 1 : 0
      if (active && mouseStrength < 0.01) {
        mouseCurrent.set((x * visibleHalfWidth - root.position.x) / Math.max(root.scale.x, 0.001), (-y * visibleHalfHeight - root.position.y) / Math.max(root.scale.x, 0.001))
      }
    },
    setVisible(next) {
      visible = next
      if (next) clock.getDelta()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('resize', resize)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const material = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(material)) material.forEach((m) => m.dispose())
        else material?.dispose()
      })
      bgMesh.geometry.dispose()
      bgMaterial.dispose()
      haloTexture.dispose()
      sdfTexture?.dispose()
      logoGeometry?.dispose()
      glowMaterial?.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    },
  }
}
