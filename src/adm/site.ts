/** Site público (para os links "ver" e o logotipo); o painel vive em outro endereço (painel.abluezone.com.br). */
export const SITE = (import.meta.env.VITE_SITE_URL || 'https://abluezone.com.br').replace(/\/$/, '')

export type Role = 'admin' | 'editor'

/** Áreas do Bluezone.adm, na ordem da barra lateral. `roles` diz quem enxerga. */
export const AREAS = [
  { id: 'hoje', label: 'hoje', roles: ['admin', 'editor'] },
  { id: 'publicar', label: 'publicar', roles: ['admin', 'editor'] },
  { id: 'bluenews', label: 'BlueNews', roles: ['admin', 'editor'] },
  { id: 'campanhas', label: 'campanhas', roles: ['admin'], soon: true },
  { id: 'clientes', label: 'clientes', roles: ['admin'], soon: true },
  { id: 'marca', label: 'marca', roles: ['admin', 'editor'] },
  { id: 'equipe', label: 'equipe', roles: ['admin'] },
] as const

export type AreaId = (typeof AREAS)[number]['id']

export function canSee(area: AreaId, role: Role): boolean {
  const found = AREAS.find((a) => a.id === area)
  return !!found && (found.roles as readonly string[]).includes(role)
}
