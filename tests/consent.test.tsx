import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CookieBanner } from '../src/components/CookieBanner'
import { ContactForm } from '../src/features/home/components/ContactForm'
import { campaignSummary, captureCampaign } from '../src/lib/campaign'
import { CONSENT_KEY, getConsent, resetConsent, setConsent } from '../src/lib/consent'
import { _resetTracking, loadTags, track } from '../src/lib/tracking'

type W = Window & { dataLayer?: unknown[] }

describe('consentimento e medição (LGPD)', () => {
  beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); _resetTracking(); delete (window as W).dataLayer })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('banner aparece sem escolha, some ao aceitar e volta ao reabrir', () => {
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'aceitar' }))
    expect(screen.queryByTestId('cookie-banner')).not.toBeInTheDocument()
    expect(getConsent()).toBe('granted')
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('granted')
    act(() => resetConsent())
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'recusar' }))
    expect(getConsent()).toBe('denied')
  })

  it('sem consentimento nenhuma tag carrega e os eventos ficam só no dataLayer', () => {
    expect(loadTags()).toBe(false)
    track('lead', { source: 'bluezone-site' })
    expect(document.querySelectorAll('script[src*="googletagmanager"], script[src*="facebook"]')).toHaveLength(0)
    expect((window as W).dataLayer).toEqual([{ event: 'lead', source: 'bluezone-site' }])
  })

  it('com consentimento mas sem IDs no .env continua sem carregar nada', () => {
    setConsent('granted')
    expect(loadTags()).toBe(false)
    expect(document.querySelectorAll('script[src*="googletagmanager"], script[src*="facebook"]')).toHaveLength(0)
  })

  it('guarda utm/gclid da URL e resume para a planilha; visita direta fica vazia', () => {
    expect(campaignSummary()).toBe('')
    captureCampaign('?utm_source=instagram&utm_campaign=blueprint&gclid=abc123&foo=bar', 1000)
    expect(campaignSummary(1000)).toBe('source=instagram; campaign=blueprint; gclid=abc123')
    window.sessionStorage.clear()
    expect(campaignSummary(1000)).toBe('source=instagram; campaign=blueprint; gclid=abc123; primeiro-toque')
    expect(campaignSummary(1000 + 31 * 24 * 60 * 60 * 1000)).toBe('')
  })

  it('formulário manda a versão da política e a origem da campanha; newsletter registra a caixa de anúncios', async () => {
    captureCampaign('?utm_source=newsletter-teste', 1000)
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Date, 'now').mockReturnValue(100000)
    render(<ContactForm endpoint="https://script.google.com/macros/s/x/exec" variant="newsletter" />)
    expect(screen.getByText('política de privacidade')).toHaveAttribute('href', '/privacidade')
    fireEvent.change(screen.getByLabelText('nome'), { target: { value: 'Sarah' } })
    fireEvent.change(screen.getByLabelText('e-mail'), { target: { value: 'sarah@exemplo.com' } })
    fireEvent.change(screen.getByLabelText('telefone'), { target: { value: '31993341543' } })
    fireEvent.click(screen.getByLabelText(/anúncios personalizados/))
    fireEvent.submit(screen.getByRole('button', { name: /avisad|quero|inscrever|receber/i }).closest('form')!)
    await screen.findByText(/inscrição feita/)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const body = JSON.parse(String(init.body))
    expect(body.consent).toMatch(/^política v1 .*; novidades; anúncios$/)
    expect(body.campaign).toContain('source=newsletter-teste')
    expect((window as W).dataLayer).toEqual([{ event: 'sign_up', source: 'bluenews' }])
  })

  it('formulário de contato não tem caixa de anúncios e registra só a política', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Date, 'now').mockReturnValue(100000)
    render(<ContactForm endpoint="https://script.google.com/macros/s/x/exec" />)
    expect(screen.queryByLabelText(/anúncios personalizados/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('nome'), { target: { value: 'Sarah' } })
    fireEvent.change(screen.getByLabelText('e-mail'), { target: { value: 'sarah@exemplo.com' } })
    fireEvent.change(screen.getByLabelText('telefone'), { target: { value: '31993341543' } })
    fireEvent.change(screen.getByLabelText('mensagem'), { target: { value: 'Quero estruturar a comunicação da minha marca.' } })
    fireEvent.submit(screen.getByRole('button', { name: 'enviar' }).closest('form')!)
    await screen.findByText(/mensagem enviada/)
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(body.consent).toMatch(/^política v1 [^;]*$/)
    expect(body.campaign).toBe('')
  })
})
