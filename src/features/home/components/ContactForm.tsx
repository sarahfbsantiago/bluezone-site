import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { pages } from '../config/pagesConfig'
import { siteConfig } from '../config/siteConfig'
import { formatPhone, sanitizeEmail, sendContact, validateContact, type ContactPayload } from '../lib/contact'
import { campaignSummary } from '../../../lib/campaign'
import { POLICY_VERSION } from '../../../lib/consent'
import { withBase } from '../../../lib/paths'
import { track } from '../../../lib/tracking'

type Status = 'idle' | 'sending' | 'success' | 'error' | 'unconfigured'

const MIN_FILL_MS = 2500
const MIN_INTERVAL_MS = 8000

type Variant = 'contact' | 'newsletter' | 'popup' | 'bluenews-contact'
type ContactFormProps = { endpoint?: string; variant?: Variant }

/** Variantes curtas (sem campo de mensagem): texto fixo enviado como mensagem, origem para a planilha e rótulos. */
const SHORT: Record<Exclude<Variant, 'contact' | 'bluenews-contact'>, { source: 'bluenews' | 'popup-blueprint'; message: string; submit: string; success: string; label: string }> = {
  newsletter: { source: 'bluenews', message: pages.blog.form.message, submit: pages.blog.form.submit, success: pages.blog.form.success, label: 'Inscrição na BlueNews' },
  popup: { source: 'popup-blueprint', message: 'Quero receber promoções e conteúdo exclusivo do Blueprint por e-mail (pop-up do site).', submit: 'quero receber', success: 'pronto! você vai receber as novidades do Blueprint por e-mail.', label: 'Receber novidades do Blueprint' },
}

/**
 * Formulário em vidro: nome, e-mail, telefone (com máscara) e mensagem. Envia para o Apps Script configurado.
 * `variant="newsletter"` (BlueNews): sem campo de mensagem, texto fixo e origem "bluenews" para a planilha e o e-mail.
 */
export function ContactForm({ endpoint = siteConfig.contactEndpoint, variant = 'contact' }: ContactFormProps) {
  const short = variant === 'contact' || variant === 'bluenews-contact' ? null : SHORT[variant]
  const newsletter = short !== null
  const source = short ? short.source : variant === 'bluenews-contact' ? 'bluenews-contato' : 'bluezone-site'
  const [status, setStatus] = useState<Status>('idle')
  const [invalid, setInvalid] = useState<Array<keyof ContactPayload>>([])
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const openedAt = useRef<number>(0)
  const lastSentAt = useRef<number>(0)

  const onFocus = () => { if (!openedAt.current) openedAt.current = Date.now() }
  const onPhone = (event: ChangeEvent<HTMLInputElement>) => setPhone(formatPhone(event.target.value))
  const onEmail = (event: ChangeEvent<HTMLInputElement>) => setEmail(sanitizeEmail(event.target.value))

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    // Registro do consentimento (LGPD): versão da política + o que a pessoa marcou. Vai para a coluna "consentimento" da planilha.
    const consent = ['política ' + POLICY_VERSION, ...(newsletter ? ['novidades'] : []), ...(data.get('ads') ? ['anúncios'] : [])].join('; ')
    const payload: ContactPayload = { name: String(data.get('name') ?? ''), email, phone, message: short ? short.message : String(data.get('message') ?? ''), website: String(data.get('website') ?? ''), source, consent, campaign: campaignSummary() }
    const problems = validateContact(payload)
    setInvalid(problems)
    if (problems.length) return
    const now = Date.now()
    if (now - lastSentAt.current < MIN_INTERVAL_MS || (openedAt.current && now - openedAt.current < MIN_FILL_MS)) return
    if (!endpoint) { setStatus('unconfigured'); return }
    setStatus('sending')
    const result = await sendContact(endpoint, payload)
    if (result.ok) { setStatus('success'); lastSentAt.current = Date.now(); form.reset(); setPhone(''); setEmail(''); track(variant === 'newsletter' ? 'sign_up' : 'lead', { source }) }
    else setStatus(result.reason === 'unconfigured' ? 'unconfigured' : 'error')
  }

  const feedback: Record<Status, string> = {
    idle: '',
    sending: 'enviando…',
    success: short ? short.success : 'mensagem enviada. em breve a gente responde.',
    error: 'não foi possível enviar agora. tente de novo ou fale pelo WhatsApp.',
    unconfigured: 'envio ainda não configurado. use o WhatsApp por enquanto.',
  }

  return (
    <form className={`contact-form${newsletter ? ' newsletter-form' : ''}`} onSubmit={onSubmit} noValidate aria-describedby="contact-feedback" aria-label={short ? short.label : variant === 'bluenews-contact' ? 'Contato pela BlueNews' : undefined}>
      <label className="field">
        <span>nome</span>
        <input name="name" type="text" autoComplete="name" onFocus={onFocus} aria-invalid={invalid.includes('name') || undefined} required />
        {invalid.includes('name') && <em className="field-error">como podemos te chamar?</em>}
      </label>
      <label className="field">
        <span>e-mail</span>
        <input name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={onEmail} onFocus={onFocus} placeholder="nome@empresa.com.br" aria-invalid={invalid.includes('email') || undefined} required />
        {invalid.includes('email') && <em className="field-error">confira o e-mail (ex.: nome@empresa.com.br).</em>}
      </label>
      <label className="field">
        <span>telefone</span>
        <input name="phone" type="tel" autoComplete="tel-national" inputMode="numeric" value={phone} onChange={onPhone} onFocus={onFocus} placeholder="(31) 99999-9999" maxLength={15} aria-invalid={invalid.includes('phone') || undefined} required />
        {invalid.includes('phone') && <em className="field-error">confira o telefone com DDD.</em>}
      </label>
      {!newsletter && <label className="field">
        <span>mensagem</span>
        <textarea name="message" rows={5} onFocus={onFocus} aria-invalid={invalid.includes('message') || undefined} required />
        {invalid.includes('message') && <em className="field-error">conte um pouco mais (mínimo de 10 caracteres).</em>}
      </label>}
      <div className="field-honeypot" aria-hidden="true">
        <label>site<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {newsletter && <label className="contact-check">
        <input name="ads" type="checkbox" value="sim" />
        <span>autorizo o uso do meu e-mail para anúncios personalizados da Bluezone (opcional)</span>
      </label>}
      <div className="contact-actions">
        <button type="submit" className="contact-submit" disabled={status === 'sending'}>{status === 'sending' ? 'enviando' : short ? short.submit : 'enviar'}</button>
        <p id="contact-feedback" className={`contact-feedback is-${status}`} role="status" aria-live="polite">{feedback[status]}</p>
        <p className="contact-consent">{newsletter ? 'Ao enviar, você aceita receber novidades e promoções por e-mail ou WhatsApp e concorda com a ' : 'Ao enviar, você concorda com a '}<a href={withBase('/privacidade')} target="_blank" rel="noopener noreferrer">política de privacidade</a>.{newsletter ? ' Pode sair da lista quando quiser.' : ''}</p>
      </div>
    </form>
  )
}
