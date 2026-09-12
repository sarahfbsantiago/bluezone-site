export type Accent = 'aqua' | 'mint' | 'mist'

/** Parâmetros da cena por estado. Todos são interpolados suavemente na GPU/CPU, nunca trocados de forma instantânea. */
export type SceneMood = {
  /** sentido das órbitas (+1 anti-horário, -1 horário) */
  direction: 1 | -1
  /** inclinação adicional dos planos orbitais, em radianos */
  tilt: number
  /** espalhamento da poeira e das partículas em repouso */
  spread: number
  /** curvatura das trajetórias de convergência */
  swirl: number
  /** 0 = acento azul/ciano, 1 = acento menta */
  accent: number
  /** deslocamento sutil da composição em unidades de cena (desktop) */
  offset: { x: number; y: number }
  /** escala sutil da composição */
  scale: number
  /** velocidade dos rastros luminosos nas órbitas */
  streakSpeed: number
}

export type HeroState = { id: string; headline: [string, string]; left: string; right: string; accent: Accent; mood: SceneMood }

export const heroStates: HeroState[] = [
  {
    id: 'strategy',
    headline: ['estratégia', 'em movimento.'],
    left: 'TECNOLOGIA\nPARA O AMANHÃ',
    right: 'IDEIAS\nEM MOVIMENTO',
    accent: 'aqua',
    mood: { direction: 1, tilt: 0, spread: 1, swirl: 1, accent: 0.25, offset: { x: 0, y: 0 }, scale: 1, streakSpeed: 0.06 },
  },
  {
    id: 'creative',
    headline: ['criatividade', 'com direção.'],
    left: 'PENSAMENTO\nQUE AVANÇA',
    right: 'FORMA\nCOM PROPÓSITO',
    accent: 'mint',
    mood: { direction: -1, tilt: 0.28, spread: 1.35, swirl: 1.6, accent: 0.8, offset: { x: 0.12, y: 0.08 }, scale: 1.04, streakSpeed: 0.09 },
  },
  {
    id: 'growth',
    headline: ['da marca', 'ao crescimento.'],
    left: 'SISTEMAS\nQUE CONECTAM',
    right: 'RESULTADOS\nEM FLUXO',
    accent: 'mist',
    mood: { direction: 1, tilt: -0.22, spread: 0.8, swirl: 0.7, accent: 0.5, offset: { x: -0.08, y: -0.06 }, scale: 0.97, streakSpeed: 0.045 },
  },
  {
    id: 'digital',
    headline: ['do analógico', 'ao digital.'],
    left: 'PROCESSOS\nQUE EVOLUEM',
    right: 'PRESENÇA\nQUE CONVERSA',
    accent: 'aqua',
    mood: { direction: -1, tilt: 0.12, spread: 1.15, swirl: 1.3, accent: 0.35, offset: { x: 0.06, y: 0.04 }, scale: 1.02, streakSpeed: 0.075 },
  },
  {
    id: 'human',
    headline: ['IA com', 'direção humana.'],
    left: 'INTELIGÊNCIA\nARTIFICIAL',
    right: 'CRIATIVIDADE\nHUMANA',
    accent: 'mint',
    mood: { direction: 1, tilt: -0.1, spread: 0.9, swirl: 1.0, accent: 0.7, offset: { x: -0.04, y: 0.02 }, scale: 1, streakSpeed: 0.055 },
  },
]

/** Timeline da entrada, em segundos. Compartilhada entre a cena WebGL e as animações CSS da interface. */
export const heroTimeline = {
  atmosphere: [0, 0.8],
  particles: [0.6, 1.8],
  orbits: [0.9, 2.6],
  formation: [1.2, 2.8],
  logo: [2.5, 3.5],
  release: [2.9, 4.8],
  interface: 3.3,
} as const

/** Duração (s) da reorganização ao trocar de estado. */
export const stateTransitionDuration = 1.8
