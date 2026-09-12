import * as THREE from 'three'
import { loadMark, sampleMark } from '../features/home/scene/markSampler'

const vertex = /* glsl */ `
  attribute vec2 aTarget; attribute vec2 aSeed;
  uniform float uTime; uniform float uForm; uniform float uAngle; uniform float uPixelRatio; uniform float uDot; uniform float uMouseStrength; uniform vec2 uMouse;
  varying float vAlpha; varying float vTone;
  float ease(float t) { t = clamp(t, 0.0, 1.0); return 1.0 - pow(1.0 - t, 3.0); }
  void main() {
    float seed = aSeed.x; float tone = aSeed.y;
    vec3 target = vec3(aTarget, (tone - 0.5) * 0.06 + (fract(seed * 9.1) - 0.5) * 0.04);
    float ang0 = fract(seed * 13.7) * 6.2832; float rad0 = 1.25 + fract(seed * 7.3) * 0.7;
    vec3 from = vec3(cos(ang0) * rad0, sin(ang0) * rad0, (fract(seed * 3.1) - 0.5) * 1.2);
    float f = ease(clamp(uForm * 1.35 - fract(seed * 5.0) * 0.35, 0.0, 1.0));
    vec3 p = mix(from, target, f);
    // repulsão elástica do mouse (no espaço da marca)
    vec2 d = p.xy - uMouse; float dist = length(d);
    float push = exp(-dist * dist * 5.0) * uMouseStrength * 0.32;
    p.xy += (d / max(dist, 0.0001)) * push;
    // giro (entrada) + balanço leve + levitação
    float a = uAngle + 0.10 * sin(uTime * 0.6);
    float c = cos(a), s = sin(a);
    p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
    float tx = 0.09 * sin(uTime * 0.8 + 1.3); c = cos(tx); s = sin(tx);
    p = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
    p.y += 0.05 * sin(uTime * 1.1);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uDot * uPixelRatio * (0.9 + 0.2 * tone);
    vAlpha = f * (0.5 + 0.5 * tone) * 0.92;
    vTone = tone;
  }
`
const fragment = /* glsl */ `
  precision highp float;
  uniform vec3 uAccent;
  varying float vAlpha; varying float vTone;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.55, d) * vAlpha;
    if (a < 0.01) discard;
    vec3 col = mix(uAccent, vec3(1.0), vTone);
    gl_FragColor = vec4(col * a, a);
  }
`

export type MarkSceneHandle = { setPointer(x: number, y: number, active: boolean): void; dispose(): void }

/**
 * Símbolo da marca em pontilhismo, sozinho: ~6k pontos amostrados do PNG oficial. Entra formando-se e girando (2,8 s),
 * depois levita e balança de leve; o mouse afasta os pontos. Com reduced motion, já aparece formado e parado.
 */
export function createMarkScene(host: HTMLElement, options: { reduced: boolean; points?: number; accent?: string }): MarkSceneHandle | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
  } catch {
    return null
  }
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const EXTENT = 2.3 // unidades da marca visíveis até a borda do canvas (caixa da marca = ±1,15)
  const camera = new THREE.OrthographicCamera(-EXTENT, EXTENT, EXTENT, -EXTENT, -5, 5)
  const uniforms = {
    uTime: { value: 0 }, uForm: { value: options.reduced ? 1 : 0 }, uAngle: { value: 0 }, uPixelRatio: { value: 1 }, uDot: { value: 2.1 },
    uMouseStrength: { value: 0 }, uMouse: { value: new THREE.Vector2(9, 9) }, uAccent: { value: new THREE.Color(options.accent ?? '#8cb8ff') },
  }
  const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending, premultipliedAlpha: true })
  let points: THREE.Points | null = null
  let disposed = false
  const pointerTarget = new THREE.Vector2(9, 9)
  let strengthTarget = 0

  const resize = () => {
    const box = Math.max(1, host.clientWidth)
    const size = box * 2
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    renderer.setPixelRatio(dpr)
    renderer.setSize(size, size, false)
    uniforms.uPixelRatio.value = dpr
    uniforms.uDot.value = Math.max(1.05, box / 118)
  }
  resize()
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  observer?.observe(host)

  loadMark().then((mark) => {
    if (!mark || disposed) return
    const samples = sampleMark(mark, options.points ?? 9500)
    const geometry = new THREE.BufferGeometry()
    const seeds = new Float32Array(samples.count * 2)
    for (let i = 0; i < samples.count; i++) { seeds[i * 2] = Math.random(); seeds[i * 2 + 1] = samples.tones[i] }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(samples.count * 3), 3))
    geometry.setAttribute('aTarget', new THREE.BufferAttribute(samples.positions.slice(0, samples.count * 2), 2))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 2))
    points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    scene.add(points)
  })

  const start = performance.now()
  let frame = 0
  const SPIN = 2.8
  const render = () => {
    frame = requestAnimationFrame(render)
    const t = (performance.now() - start) / 1000
    uniforms.uTime.value = t
    if (!options.reduced) {
      const k = Math.min(1, t / SPIN)
      const eased = 1 - Math.pow(1 - k, 3)
      uniforms.uForm.value = Math.min(1, t / 1.9)
      uniforms.uAngle.value = eased * Math.PI * 4
    }
    uniforms.uMouse.value.lerp(pointerTarget, 0.18)
    uniforms.uMouseStrength.value += (strengthTarget - uniforms.uMouseStrength.value) * 0.12
    renderer.render(scene, camera)
  }
  render()

  return {
    setPointer(x, y, active) {
      pointerTarget.set(x * 1.15, y * 1.15)
      strengthTarget = active ? 1 : 0
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer?.disconnect()
      points?.geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
