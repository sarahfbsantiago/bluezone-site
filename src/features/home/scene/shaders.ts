/** GLSL da cena do hero. Todos os movimentos acontecem na GPU a partir de uniforms; nada é alocado por frame. */

const noise = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
    return v;
  }
`

export const atmosphereVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`

export const atmosphereFragment = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform float uAtmos; uniform float uAccent; uniform float uPurple; uniform float uDark; uniform float uTextGlow; uniform float uNebulaRadius; uniform float uNebulaGain; uniform float uNebulaOn; uniform sampler2D uNebulaTex; uniform vec2 uTextCenter; uniform vec2 uRes; uniform vec2 uFocus;
  ${noise}
  // mancha elíptica desfocada (bokeh), rotacionada, com borda orgânica
  float blob(vec2 p, vec2 c, vec2 size, float rot, float wobble) {
    vec2 d = p - c;
    float cr = cos(rot), sr = sin(rot);
    d = vec2(d.x * cr - d.y * sr, d.x * sr + d.y * cr) / size;
    float r = length(d) * (1.0 + wobble);
    return smoothstep(1.0, 0.15, r);
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * aspect, uv.y);
    float t = uTime * 0.03;
    float n1 = fbm(p * 1.2 + vec2(t, -t * 0.55));
    float n2 = fbm(p * 2.0 - vec2(t * 0.65, t * 0.4) + 3.1);
    float n3 = fbm(p * 1.5 + vec2(-t * 0.45, t * 0.75) + 7.7);
    // paleta inspirada em bokeh de folhas: céu azul claro, brilho branco, verde-limão, verde-água
    vec3 sky = vec3(0.68, 0.83, 1.0);
    vec3 skyDeep = vec3(0.50, 0.72, 1.0);
    vec3 white = vec3(0.97, 0.99, 1.0);
    vec3 lime = vec3(0.80, 0.93, 0.72);
    vec3 leaf = vec3(0.68, 0.88, 0.72);
    vec3 aqua = vec3(0.55, 0.85, 0.90);
    vec3 lilac = vec3(0.82, 0.68, 0.95);
    vec3 orchid = vec3(0.93, 0.66, 0.84);
    vec3 col = mix(sky, skyDeep, smoothstep(0.35, 0.85, n1) * 0.7);
    col = mix(col, white, smoothstep(0.45, 0.9, n3) * 0.55);
    // folhas desfocadas: grandes, lentas, nas bordas, deixando o centro mais limpo para a marca
    float w1 = (n2 - 0.5) * 0.35;
    float w2 = (n3 - 0.5) * 0.35;
    float leafA = blob(p, vec2(aspect * 0.92 + sin(t * 2.1) * 0.04, 0.30 + cos(t * 1.7) * 0.04), vec2(0.30, 0.62), 0.55, w1);
    float leafB = blob(p, vec2(aspect * 0.80 + cos(t * 1.4) * 0.05, 0.86 + sin(t * 1.9) * 0.03), vec2(0.34, 0.20), -0.35, w2);
    float leafC = blob(p, vec2(aspect * 0.14 + sin(t * 1.6) * 0.05, 0.12 + cos(t * 2.3) * 0.03), vec2(0.42, 0.24), 0.45, w1);
    float leafD = blob(p, vec2(aspect * 0.55 + cos(t * 1.2) * 0.06, 0.06), vec2(0.30, 0.16), 0.15, w2);
    float aquaA = blob(p, vec2(aspect * 0.12 + cos(t * 1.9) * 0.04, 0.58 + sin(t * 1.3) * 0.04), vec2(0.22, 0.22), 0.0, w2);
    float glowA = blob(p, vec2(aspect * 0.62, 0.92), vec2(0.28, 0.16), 0.2, w1 * 0.5);
    float glowB = blob(p, vec2(aspect * 0.30 + sin(t * 1.1) * 0.05, 0.80), vec2(0.14, 0.12), 0.0, 0.0);
    // verde à esquerda (limão e verde-água), azul e rosa no centro e à direita
    float greenL = blob(p, vec2(aspect * 0.06 + sin(t * 1.4) * 0.05, 0.6 + cos(t * 1.1) * 0.05), vec2(0.58, 0.5), 0.35, w1);
    float greenL2 = blob(p, vec2(aspect * 0.2 + cos(t * 1.7) * 0.05, 0.12 + sin(t * 1.3) * 0.04), vec2(0.36, 0.22), 0.5, w2);
    col = mix(col, vec3(0.70, 0.93, 0.60), greenL * 0.8);
    col = mix(col, vec3(0.52, 0.88, 0.72), greenL2 * 0.7);
    col = mix(col, lime, leafA * 0.2);
    col = mix(col, leaf, leafB * 0.18);
    col = mix(col, aqua, aquaA * 0.42);
    // lilás rosado: manchas desfocadas à esquerda e no topo, mais presentes conforme a página rola (uPurple)
    float lilacA = blob(p, vec2(aspect * 0.10 + sin(t * 1.3) * 0.05, 0.86 + cos(t * 1.1) * 0.04), vec2(0.42, 0.30), 0.35, w2);
    float lilacB = blob(p, vec2(aspect * 0.42 + cos(t * 1.7) * 0.06, 0.97), vec2(0.30, 0.16), -0.2, w1);
    float lilacC = blob(p, vec2(aspect * 0.06 + sin(t * 1.9) * 0.04, 0.30 + cos(t * 1.5) * 0.05), vec2(0.24, 0.30), 0.5, w1);
    float purple = 0.85 + 0.15 * uPurple;
    float lilacD = blob(p, vec2(aspect * 0.62 + sin(t * 1.5) * 0.06, 0.48 + cos(t * 1.2) * 0.05), vec2(0.55, 0.36), 0.25, w2 * 0.6);
    float lilacE = blob(p, vec2(aspect * 0.96 + cos(t * 1.3) * 0.04, 0.55 + sin(t * 1.6) * 0.05), vec2(0.22, 0.40), -0.3, w1);
    col = mix(col, lilac, lilacA * 0.75 * purple);
    col = mix(col, orchid, lilacB * 0.7 * purple);
    col = mix(col, mix(lilac, skyDeep, 0.35), lilacC * 0.7 * purple);
    col = mix(col, mix(lilac, sky, 0.4), lilacD * 0.5 * purple);
    col = mix(col, mix(orchid, lilac, 0.5), lilacE * 0.65 * purple);
    // azul mais presente: campo largo de azul-céu profundo à direita e embaixo
    float blueA = blob(p, vec2(aspect * 0.78 + sin(t * 1.2) * 0.05, 0.28 + cos(t * 1.5) * 0.04), vec2(0.5, 0.36), -0.3, w1);
    col = mix(col, skyDeep, blueA * 0.45);
    col = mix(col, white, (glowA * 0.4 + glowB * 0.35));
    // em volta da composição: claro, mas colorido (azul + lilás), para as órbitas continuarem visíveis
    vec2 fp = vec2(uFocus.x * aspect, uFocus.y);
    float df = distance(p, fp);
    float nebula = exp(-df * df * 1.7);
    col = mix(col, mix(sky, lilac, 0.35), nebula * 0.4);
    // bokeh: pequenos discos claros
    float bokeh = smoothstep(0.7, 0.98, vnoise(p * 4.5 + vec2(t * 0.8, -t * 0.5))) * 0.25;
    col = mix(col, white, bokeh);
    float breath = 0.5 + 0.5 * sin(uTime * 0.35);
    col += vec3(0.01, 0.02, 0.02) * nebula * breath;
    col = mix(col, vec3(1.0), 0.06 * uAccent);
    vec3 lightOut = mix(white, col, uAtmos);
    // modo escuro: preto com névoa cinza-azulada muito discreta e um resquício das cores
    vec3 ink = vec3(0.016, 0.018, 0.026);
    vec3 darkOut = ink + vec3(0.05, 0.06, 0.085) * smoothstep(0.35, 0.9, n1) + vec3(0.03, 0.045, 0.05) * nebula * 0.8 + (col - sky) * 0.045 * uAtmos;
    // luz suave atrás do bloco de texto (páginas de estrelas): dá o contraste sem abrir vazio
    vec2 tp = vec2(uTextCenter.x * aspect, uTextCenter.y);
    vec2 td = (p - tp) / vec2(0.62 * aspect, 0.42);
    float textLight = exp(-dot(td, td) * 1.6) * uTextGlow;
    lightOut = mix(lightOut, white, textLight * 0.55);
    darkOut += vec3(0.04, 0.05, 0.08) * textLight * uTextGlow;
    gl_FragColor = vec4(mix(lightOut, darkOut, uDark), 1.0);
  }
`

export const particleVertex = /* glsl */ `
  attribute vec3 aTarget;   // marca: posição na marca; esfera: ponto na superfície unitária
  attribute vec4 aOrbit;    // poeira: radius, phase, tilt, speed · esfera: índice da esfera em x
  attribute vec2 aSeed;     // seed, tom (0 sombra .. 1 luz)
  attribute float aGroup;   // 0 anel externo, 1 círculo interno, 2 traço, 3 poeira, 4 esfera
  attribute vec3 aStar;     // destino no campo de estrelas (x,y em -1..1, z em unidades)
  uniform float uTime; uniform float uForm; uniform float uRelease; uniform float uFade; uniform float uBurst;
  uniform float uDir; uniform float uSpread; uniform float uSwirl; uniform float uAccent; uniform float uTilt;
  uniform float uPixelRatio; uniform float uSizeScale; uniform float uDot; uniform vec2 uPointer; uniform vec2 uMouse; uniform float uMouseStrength;
  uniform float uThin; // fração dos pontos da marca escondida no hero (trama mais aberta: pontilhismo visível no mobile e no claro)
  uniform vec4 uSpheres[8]; uniform float uSphereRot[8]; uniform float uSphereTilt[8]; uniform float uSphereReveal;
  uniform float uScatter; uniform vec2 uStarSpread; uniform float uDepth; uniform float uSphereRef; uniform float uDark; uniform float uStarDensity; uniform vec2 uClearCenter;
  varying float vAlpha; varying vec3 vColor;
  float ease(float t) { t = clamp(t, 0.0, 1.0); return 1.0 - pow(1.0 - t, 3.0); }
  mat3 tilt(float k) {
    float ax = (k - 2.5) * 0.14 + uTilt; float ay = (k - 2.5) * 0.16; float az = (k - 2.5) * 0.21;
    float cx = cos(ax), sx = sin(ax), cy = cos(ay), sy = sin(ay), cz = cos(az), sz = sin(az);
    mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
    mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
    mat3 rz = mat3(cz, sz, 0.0, -sz, cz, 0.0, 0.0, 0.0, 1.0);
    return ry * rx * rz;
  }
  void main() {
    float seed = aSeed.x;
    float tone = aSeed.y;
    vec3 royal = vec3(0.07, 0.30, 0.86); vec3 blue = vec3(0.14, 0.52, 1.0); vec3 cyan = vec3(0.40, 0.88, 1.0); vec3 mint = vec3(0.36, 0.93, 0.72); vec3 iceLight = vec3(0.80, 0.96, 1.0);
    vec3 p; float alpha = 1.0; float sizeMul = 1.0;
    if (aGroup > 3.5) {
      // esfera em pontilhismo: pontos na superfície, rotação própria, degradê de cor e sombra por tom
      int index = int(aOrbit.x + 0.5);
      vec4 sphere = uSpheres[index];
      float rot = uSphereRot[index];
      float c = cos(rot), s = sin(rot);
      vec3 n = vec3(aTarget.x * c + aTarget.z * s, aTarget.y, -aTarget.x * s + aTarget.z * c);
      // segundo eixo (tombo) para a esfera do centro na página 2
      float tl = uSphereTilt[index];
      float ct = cos(tl), st = sin(tl);
      n = vec3(n.x, n.y * ct - n.z * st, n.y * st + n.z * ct);
      // frente/costas e luz decididos no espaço da câmera: a esfera segue inteira em qualquer giro da composição
      vec3 nView = normalize(normalMatrix * n);
      vec3 l = normalize(vec3(-0.5, 0.75, 0.6));
      float lit = dot(nView, l) * 0.5 + 0.5;
      float facing = smoothstep(-0.15, 0.2, nView.z);
      p = sphere.xyz + n * sphere.w;
      // mesma densidade de pontos por área em todas as esferas: as menores usam só uma fração dos pontos
      float keep = clamp((sphere.w * sphere.w) / (uSphereRef * uSphereRef), 0.0, 1.0);
      float dropped = step(keep, fract(seed * 7.7));
      // degradê: azul royal no topo → ciano → menta na base, girando com a esfera
      float band = smoothstep(-0.9, 0.9, -n.y);
      float shift = 0.08 * (fract(aOrbit.x * 0.37 + 0.21) - 0.5); // cada esfera com o degradê levemente deslocado
      vec3 aqua = vec3(0.10, 0.84, 0.70);
      vec3 lightGreen = vec3(0.45, 0.94, 0.55);
      // topo azul → meio verde-água → base verde claro
      // faixa de verde-água mais larga no meio da esfera
      vec3 grad = mix(mix(royal, blue, 0.55), aqua, smoothstep(0.06 + shift, 0.34 + shift, band));
      grad = mix(grad, lightGreen, smoothstep(0.7 + shift, 0.96 + shift, band));
      vec3 shadowTint = mix(royal, vec3(0.03, 0.40, 0.34), smoothstep(0.25, 0.7, band));
      vec3 shadow = mix(shadowTint, grad, 0.4) * 0.72;
      vec3 light = mix(grad, iceLight, 0.04);
      vColor = mix(shadow, light, smoothstep(0.15, 0.95, lit));
      vColor = mix(vColor, mix(vec3(0.42), vec3(1.0), smoothstep(0.05, 0.95, lit)), uDark);
      alpha = facing * uSphereReveal * (1.0 - 0.15 * smoothstep(0.35, 1.0, lit)) * (1.0 - dropped);
      alpha *= 1.0 - uDark * (0.2 + 0.4 * smoothstep(0.3, 1.0, lit));
      sizeMul = 0.95 + 0.15 * (1.0 - lit);
    } else {
      vec3 drift = vec3(sin(uTime * 0.31 + seed * 6.2831), cos(uTime * 0.27 + seed * 4.1), sin(uTime * 0.19 + seed * 9.3)) * 0.14;
      vec3 scatter = position * uSpread + drift;
      float ang = aOrbit.y + uTime * aOrbit.w * uDir;
      vec3 orbit = tilt(aOrbit.z) * vec3(cos(ang) * aOrbit.x, sin(ang) * aOrbit.x * 0.62, 0.0);
      if (aGroup > 2.5) {
        float t = ease((uForm - seed * 0.35) / 0.65);
        p = mix(scatter, orbit, t);
        alpha = uFade * (0.16 + 0.3 * fract(seed * 3.7));
        vColor = mix(mix(blue, cyan, fract(seed * 2.3)), mint, uAccent * fract(seed * 7.1));
        vColor = mix(vColor, vec3(0.85, 0.9, 1.0), uDark);
        sizeMul = 0.8;
      } else {
        float delay = aGroup * 0.2 + seed * 0.16;
        float t = ease((uForm - delay) / 0.5);
        vec3 dirTo = aTarget - scatter;
        vec3 perp = normalize(vec3(-dirTo.y, dirTo.x, 0.35) + 1e-4) * (seed - 0.5) * 1.8 * uSwirl;
        vec3 home = vec3(aTarget.xy, aTarget.z * (0.25 + 0.75 * uDepth)) + vec3(sin(uTime * 1.3 + seed * 41.0), cos(uTime * 1.1 + seed * 27.0), 0.0) * 0.004;
        p = mix(scatter, home, t) + perp * sin(t * 3.14159);
        float r = ease((uRelease - seed * 0.5) / 0.5);
        p = mix(p, orbit, r);
        vec2 dm = p.xy - uMouse;
        float dist = length(dm);
        float influence = exp(-dist * dist / 0.34) * uMouseStrength * t * (1.0 - r);
        vec2 away = dm / max(dist, 0.02);
        p.xy += away * influence * (0.2 + 0.2 * fract(seed * 5.7));
        p.xy += vec2(-away.y, away.x) * influence * 0.16 * (seed - 0.5);
        alpha = uFade * mix(0.4 + 0.6 * t, 0.3, r);
        alpha *= 1.0 - uDark * (0.25 + 0.35 * smoothstep(0.3, 1.0, tone));
        // stippling: sombra em royal denso, luz em ciano claro; o cursor acende os pontos próximos
        vColor = mix(royal, mix(blue, cyan, 0.7), smoothstep(0.15, 0.95, tone));
        vColor = mix(vColor, mix(vec3(0.5), vec3(1.0), smoothstep(0.1, 0.95, tone)), uDark);
        vColor = mix(vColor, iceLight, influence * 0.6);
        sizeMul = 1.0 + influence * 0.5;
      }
      vec3 outward = normalize(p + vec3(0.001, 0.002, 0.0));
      p += outward * uBurst * (0.35 + fract(seed * 11.0) * 0.6);
    }
    // Página 3: cada ponto sai em arco para o seu lugar no campo de estrelas e passa a piscar devagar
    float sc = ease((uScatter - seed * 0.45) / 0.55);
    if (sc > 0.0) {
      vec3 star = vec3(aStar.xy * uStarSpread, aStar.z);
      vec3 arc = vec3(-(star.y - p.y), star.x - p.x, 0.0) * 0.22 * (seed - 0.5);
      p = mix(p, star, sc) + arc * sin(sc * 3.14159);
      // céu: a maioria vira poeira fina e discreta; poucas estrelas maiores piscam devagar
      // clareira no centro da tela (onde ficam as frases): menos estrelas, menores e mais fracas
      // perto do texto as estrelas continuam, mas pequenas, com brilho fixo e sem as maiores; longe, o campo completo
      float ring = length((star.xy - uClearCenter) / (uStarSpread * vec2(0.6, 0.55)));
      float near = 1.0 - smoothstep(0.35, 1.3, ring);
      // claro: campo cheio de pontinhos em toda a tela; escuro: menos pontos e mais calmos perto do texto
      float keepStar = step(fract(seed * 23.7), mix(1.0, uStarDensity, uDark));
      float bright = step(0.95, fract(seed * 17.0)) * (1.0 - step(0.5, near));
      float slow = mix(0.5 + 0.5 * sin(uTime * (0.5 + seed * 0.8) + seed * 80.0), 0.6, near * uDark);
      float starAlpha = mix(0.10 + 0.2 * fract(seed * 9.1), 0.5 + 0.4 * slow, bright) * uFade * keepStar * mix(1.0, mix(1.0, 0.75, near), uDark);
      alpha = mix(alpha, starAlpha, sc);
      sizeMul = mix(sizeMul, (0.5 + bright * (0.9 + 0.4 * slow)) * mix(1.0, mix(1.0, 0.7, near), uDark), sc);
      vec3 starCol = mix(mix(vec3(0.16, 0.5, 1.0), vec3(0.55, 0.9, 1.0), fract(seed * 3.3)), vec3(0.9, 0.98, 1.0), bright * 0.6);
      starCol = mix(starCol, mix(vec3(0.75, 0.8, 0.9), vec3(1.0), bright), uDark);
      vColor = mix(vColor, starCol, sc * 0.8);
    }
    p.xy += uPointer * 0.05 * (0.4 + seed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float darkShrink = 1.0 - uDark * 0.3 * step(aGroup, 2.5) - uDark * 0.18 * step(3.5, aGroup);
    gl_PointSize = uDot * sizeMul * darkShrink * uPixelRatio * uSizeScale * (18.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    // hero: esconde uma fração fixa dos pontos da marca (mesma seleção sempre) para abrir a trama; some quando vira estrelas
    alpha *= 1.0 - step(fract(seed * 5.3), uThin) * step(aGroup, 2.5) * (1.0 - uScatter);
    vAlpha = alpha;
  }
`

export const particleFragment = /* glsl */ `
  precision highp float;
  uniform float uDark;
  varying float vAlpha; varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    // no claro a borda do ponto é mais nítida, para cada ponto se destacar; no escuro segue mais suave
    float a = smoothstep(1.0, mix(0.74, 0.55, uDark), d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`

export const orbitVertex = /* glsl */ `
  attribute float aPhase;
  uniform float uTime; uniform float uReveal; uniform float uDir; uniform float uSpeed; uniform float uShift;
  varying float vA; varying float vStreak;
  void main() {
    float reveal = smoothstep(aPhase - 0.08, aPhase + 0.01, mix(-0.1, 1.02, uReveal));
    float f = fract(aPhase - uTime * uSpeed * uDir + uShift);
    float streak = pow(1.0 - f, 16.0);
    float streak2 = pow(1.0 - fract(f + 0.5), 22.0) * 0.5;
    vStreak = streak + streak2;
    vA = reveal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const orbitFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor; uniform float uOpacity; uniform float uPulse; uniform float uDark;
  varying float vA; varying float vStreak;
  void main() {
    float a = vA * (uOpacity * 1.35 + vStreak * (1.9 + uPulse));
    vec3 col = mix(mix(uColor, vec3(0.85, 0.88, 0.95), uDark), vec3(1.0), clamp(vStreak * 1.8, 0.0, 1.0));
    gl_FragColor = vec4(col * a, a);
  }
`

export const dottedVertex = /* glsl */ `
  attribute float aPhase;
  uniform float uTime; uniform float uReveal; uniform float uDir; uniform float uPixelRatio;
  varying float vA;
  void main() {
    float reveal = smoothstep(aPhase - 0.1, aPhase, mix(-0.12, 1.02, uReveal));
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.3 + aPhase * 40.0);
    vA = reveal * twinkle;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 2.6 * uPixelRatio * (8.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

export const dottedFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor; uniform float uOpacity; uniform float uDark;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.3, d) * vA * uOpacity;
    gl_FragColor = vec4(mix(mix(uColor, vec3(1.0), 0.5), vec3(1.0), uDark) * a, a);
  }
`

export const sparkleVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime; uniform float uFade; uniform float uPixelRatio;
  varying float vA;
  void main() {
    float tw = pow(0.5 + 0.5 * sin(uTime * (0.9 + aSeed * 1.4) + aSeed * 40.0), 3.0);
    vA = tw * uFade;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (8.0 + 16.0 * tw) * uPixelRatio * (8.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

export const sparkleFragment = /* glsl */ `
  precision highp float;
  uniform float uDark;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = smoothstep(0.42, 0.08, d);
    // claro: ponto azul piscando com halo branco (nunca escurece o fundo); escuro: núcleo branco com halo suave
    float halo = exp(-d * d * 3.2) * 0.45;
    float a = clamp(core * 1.2 + halo, 0.0, 1.0) * vA;
    vec3 light = mix(vec3(1.0), vec3(0.22, 0.52, 1.0), core);
    vec3 dark = mix(vec3(0.75, 0.92, 1.0), vec3(1.0), core);
    gl_FragColor = vec4(mix(light, dark, uDark) * a, a);
  }
`

export const logoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

/** Camada estrutural da marca: SDF renderizado sólido, com revelação por partes (externo → interno → traço). */
export const logoFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uSdf; uniform float uRange; uniform float uReveal; uniform float uTime; uniform float uAccent;
  uniform vec2 uCenter; uniform vec2 uNormScale; uniform float uOuterRadius; uniform float uStrokeHalf; uniform float uStrokeTop;
  varying vec2 vUv;
  void main() {
    float d = (texture2D(uSdf, vUv).r - 0.5) * 2.0 * uRange; // px, negativo dentro da tinta
    float aa = max(fwidth(d), 0.35);
    float shape = 1.0 - smoothstep(-aa, aa, d);
    if (shape < 0.002) discard;
    vec2 q = (vUv - uCenter) * uNormScale;
    float r = length(q);
    float ang = atan(q.y, q.x);
    float isStroke = step(abs(q.x), uStrokeHalf) * step(uStrokeTop, q.y);
    float isOuter = (1.0 - isStroke) * step(uOuterRadius, r);
    float isInner = (1.0 - isStroke) * (1.0 - isOuter);
    // anel externo: nasce na junção com o traço (topo) e percorre o anel até a ponta da abertura
    float sweepOuter = fract((ang - 1.5708) / 6.2832);
    float pOuter = mix(-0.14, 1.04, clamp(uReveal / 0.55, 0.0, 1.0));
    float revealOuter = smoothstep(sweepOuter - 0.12, sweepOuter + 0.02, pOuter);
    // círculo interno: cresce simetricamente do topo para a abertura inferior
    float sweepInner = abs(mod(ang - 1.5708 + 3.14159, 6.2832) - 3.14159) / 3.14159;
    float pInner = mix(-0.16, 1.04, clamp((uReveal - 0.3) / 0.5, 0.0, 1.0));
    float revealInner = smoothstep(sweepInner - 0.14, sweepInner + 0.02, pInner);
    float strokeT = clamp((1.05 - q.y) / 0.8, 0.0, 1.0);
    float pStroke = mix(-0.22, 1.06, clamp((uReveal - 0.55) / 0.45, 0.0, 1.0));
    float revealStroke = smoothstep(strokeT - 0.2, strokeT + 0.04, pStroke);
    float reveal = isOuter * revealOuter + isInner * revealInner + isStroke * revealStroke;
    vec3 blue = vec3(0.10, 0.42, 1.0); vec3 cyan = vec3(0.12, 0.80, 0.96); vec3 mint = vec3(0.22, 0.86, 0.62);
    float diag = clamp((vUv.x - vUv.y) * 0.9 + 0.55, 0.0, 1.0);
    vec3 col = mix(blue, cyan, smoothstep(0.15, 0.6, diag));
    col = mix(col, mint, smoothstep(0.55, 0.95, diag) * (0.85 + 0.15 * uAccent));
    float edge = smoothstep(-9.0, 0.0, d);
    col = mix(col, col * 1.18 + vec3(0.10, 0.12, 0.12), edge * 0.45);
    float sheen = 0.5 + 0.5 * sin((vUv.x + vUv.y) * 9.0 - uTime * 0.6);
    col += vec3(0.05) * sheen * (1.0 - edge);
    float a = shape * reveal;
    gl_FragColor = vec4(col * a, a);
  }
`

/** Sombra suave da marca (silhueta pelo SDF), atrás dos pontos: mostra a forma quando os pontos se deslocam. Contornada por um brilho azul de letreiro de LED (cintilar leve), mais claro no tema claro e mais profundo no escuro. */
export const logoGlowFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uSdf; uniform float uRange; uniform float uReveal; uniform float uTime; uniform float uPulse; uniform float uAccent; uniform float uDark; uniform float uHover;
  varying vec2 vUv;
  void main() {
    float d = (texture2D(uSdf, vUv).r - 0.5) * 2.0 * uRange;
    float inside = 1.0 - smoothstep(-2.0, 2.0, d);
    float edge = 1.0 - smoothstep(0.0, 16.0, max(d, 0.0));
    float shape = inside * 0.85 + edge * (1.0 - inside) * 0.55;
    float strength = (0.42 + 0.58 * uHover) * (1.0 + 0.25 * uPulse);
    // claro: sombra azul-marinho translúcida; escuro: névoa clara discreta (uma "sombra de luz")
    float aLight = shape * 0.30 * strength;
    float aDark = shape * 0.16 * strength;
    float a = mix(aLight, aDark, uDark) * uReveal;
    vec3 col = mix(vec3(0.07, 0.12, 0.24), vec3(0.78, 0.84, 0.95), uDark);
    // letreiro: linha de luz na borda do SDF + halo curto para fora, com cintilar de LED
    float rimCore = exp(-(d * d) / 18.0);
    float rimHalo = exp(-(max(d, 0.0) * max(d, 0.0)) / 260.0) * (1.0 - inside);
    float led = 0.93 + 0.05 * sin(uTime * 6.1) * sin(uTime * 1.9) + 0.02 * sin(uTime * 13.7);
    float rimA = (rimCore * 0.55 + rimHalo * 0.30) * (0.75 + 0.25 * uHover) * led * uReveal;
    vec3 rimLight = mix(vec3(0.42, 0.66, 1.0), vec3(0.72, 0.86, 1.0), rimCore);
    vec3 rimDark = mix(vec3(0.10, 0.40, 1.0), vec3(0.55, 0.74, 1.0), rimCore);
    vec3 rimCol = mix(rimLight, rimDark, uDark);
    float outA = min(1.0, a + rimA);
    gl_FragColor = vec4(col * a + rimCol * rimA, outA);
  }
`

export const sphereVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vC; varying vec3 vView; varying float vH;
  void main() {
    mat4 m = modelMatrix * instanceMatrix;
    vec4 wp = m * vec4(position, 1.0);
    vN = normalize(mat3(m) * normal);
    vC = instanceColor;
    vH = position.y;
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

export const sphereFragment = /* glsl */ `
  precision highp float;
  varying vec3 vN; varying vec3 vC; varying vec3 vView; varying float vH;
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vView);
    vec3 l = normalize(vec3(-0.5, 0.9, 0.7));
    vec3 l2 = normalize(vec3(0.7, -0.6, 0.4));
    float diff = max(dot(n, l), 0.0);
    float diff2 = max(dot(n, l2), 0.0);
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 64.0);
    float spec2 = pow(max(dot(reflect(-l2, n), v), 0.0), 24.0);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.2);
    vec3 top = vec3(0.16, 0.50, 1.0);
    vec3 bottom = vec3(0.32, 0.92, 0.72);
    vec3 base = mix(mix(top, bottom, smoothstep(0.6, -0.6, vH)), vC, 0.35);
    vec3 col = base * (0.42 + 0.68 * diff) + base * diff2 * 0.35;
    col += vec3(1.0) * spec * 0.9 + vec3(0.75, 1.0, 0.95) * spec2 * 0.3;
    col += vec3(0.65, 0.95, 1.0) * fres * 0.85;
    gl_FragColor = vec4(col, 1.0);
  }
`

export const haloVertex = /* glsl */ `
  attribute float aSize;
  uniform float uPixelRatio; uniform float uFade;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (8.0 / -mv.z);
    vA = uFade;
    gl_Position = projectionMatrix * mv;
  }
`

export const haloFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-d * d * 4.5) * 0.55 * vA;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.4) * a, a);
  }
`

/** Cometas: raio de luz contínuo (cabeça brilhante + cauda fina e longa que esmaece), cruzando rápido em diagonal. */
export const cometVertex = /* glsl */ `
  attribute vec4 aPath;     // início x, início y (em frações da tela, -1..1), direção x, direção y
  attribute vec3 aTiming;   // período (s), deslocamento de fase (s), curvatura
  attribute float aTrail;   // 0 = cabeça … 1 = fim da cauda
  uniform float uTime; uniform float uVisible; uniform float uPixelRatio; uniform vec2 uArea;
  varying float vA; varying float vHead;
  void main() {
    float cycle = fract((uTime + aTiming.y) / aTiming.x);
    float travel = 0.22;                                  // cruza a tela em ~22% do ciclo (rápido, como um meteoro)
    float t = cycle / travel - aTrail * 0.26;             // cauda longa e contínua (muitos pontos colados)
    float visible = step(0.0, t) * step(t, 1.0) * step(cycle, travel);
    vec2 dir = normalize(aPath.zw);
    vec2 perp = vec2(-dir.y, dir.x);
    vec2 pos = aPath.xy + dir * t * 2.4 + perp * aTiming.z * sin(t * 3.14159);
    vec3 world = vec3(pos * uArea, -0.6);
    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float fade = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.8, 1.0, t));
    float tail = pow(1.0 - aTrail, 1.6);
    vA = visible * fade * tail * uVisible;
    vHead = 1.0 - smoothstep(0.0, 0.08, aTrail);
    gl_PointSize = (1.4 + 1.6 * tail + 5.0 * vHead) * uPixelRatio * (8.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

export const cometFragment = /* glsl */ `
  precision highp float;
  uniform float uDark;
  varying float vA; varying float vHead;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = smoothstep(1.0, 0.2, d);
    float glow = exp(-d * d * 2.0) * 0.6 * vHead;
    float a = clamp(core + glow, 0.0, 1.0) * vA * 0.9;
    // claro: raio claro (branco-azulado), nunca mais escuro que o fundo; escuro: raio branco
    vec3 light = mix(vec3(0.72, 0.88, 1.0), vec3(1.0), vHead * 0.9);
    vec3 dark = mix(vec3(0.72, 0.9, 1.0), vec3(1.0), vHead * 0.8 + 0.2);
    gl_FragColor = vec4(mix(light, dark, uDark) * a, a);
  }
`
