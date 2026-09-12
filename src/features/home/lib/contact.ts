export type ContactSource = 'bluezone-site' | 'bluenews' | 'popup-blueprint'
export type ContactPayload = { name: string; email: string; phone: string; message: string; website?: string; source?: ContactSource }
export type ContactResult = { ok: true } | { ok: false; reason: 'unconfigured' | 'invalid' | 'network' | 'server' }

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

/** Mantém só dígitos do telefone (máximo 11: DDD + número). */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

/** Formata enquanto digita: (31) 3334-1543 para fixo, (31) 99334-1543 para celular. */
export function formatPhone(value: string): string {
  const d = phoneDigits(value)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Limpa o e-mail enquanto digita: minúsculas, sem espaços nem acentos. */
export function sanitizeEmail(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@._%+-]/g, '')
}

export function isValidPhone(value: string): boolean {
  const d = phoneDigits(value)
  return (d.length === 10 || d.length === 11) && d[0] !== '0' && d[1] !== '0'
}

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim())
}

/** Valida os campos no cliente. Retorna a lista de campos inválidos (vazia = ok). */
export function validateContact(payload: ContactPayload): Array<keyof ContactPayload> {
  const invalid: Array<keyof ContactPayload> = []
  if (payload.name.trim().length < 2) invalid.push('name')
  if (!isValidEmail(payload.email)) invalid.push('email')
  if (!isValidPhone(payload.phone)) invalid.push('phone')
  if (payload.message.trim().length < 10) invalid.push('message')
  return invalid
}

/**
 * Envia o contato para o Web App do Google Apps Script.
 * O corpo vai como text/plain para evitar preflight de CORS; o script responde JSON.
 */
export async function sendContact(endpoint: string, payload: ContactPayload, fetchImpl: typeof fetch = fetch): Promise<ContactResult> {
  if (!endpoint) return { ok: false, reason: 'unconfigured' }
  if (validateContact(payload).length) return { ok: false, reason: 'invalid' }
  if (payload.website) return { ok: true } // honeypot preenchido: finge sucesso e descarta
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ name: payload.name.trim(), email: payload.email.trim(), phone: formatPhone(payload.phone), message: payload.message.trim(), source: payload.source ?? 'bluezone-site' }),
      redirect: 'follow',
    })
    if (!response.ok) return { ok: false, reason: 'server' }
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean }
    return data.ok === false ? { ok: false, reason: 'server' } : { ok: true }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
