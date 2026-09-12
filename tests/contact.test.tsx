import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlueprintPopup } from '../src/features/home/components/BlueprintPopup'
import { ContactForm } from '../src/features/home/components/ContactForm'
import { formatPhone, isValidPhone, sanitizeEmail, sendContact, validateContact } from '../src/features/home/lib/contact'

const fill = () => {
  fireEvent.change(screen.getByLabelText('nome'), { target: { value: 'Sarah' } })
  fireEvent.change(screen.getByLabelText('e-mail'), { target: { value: 'sarah@exemplo.com' } })
  fireEvent.change(screen.getByLabelText('telefone'), { target: { value: '31993341543' } })
  fireEvent.change(screen.getByLabelText('mensagem'), { target: { value: 'Quero estruturar a comunicação da minha marca.' } })
}
const valid = { name: 'Sarah', email: 'sarah@exemplo.com', phone: '(31) 99334-1543', message: 'mensagem longa o bastante' }

describe('contato', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('valida nome, e-mail, telefone e mensagem', () => {
    expect(validateContact({ name: '', email: 'x', phone: '319', message: 'oi' })).toEqual(['name', 'email', 'phone', 'message'])
    expect(validateContact(valid)).toEqual([])
  })

  it('formata o telefone enquanto digita e exige DDD com 10 ou 11 dígitos', () => {
    expect(formatPhone('3')).toBe('(3')
    expect(formatPhone('3199')).toBe('(31) 99')
    expect(formatPhone('3133341543')).toBe('(31) 3334-1543')
    expect(formatPhone('31993341543')).toBe('(31) 99334-1543')
    expect(formatPhone('(31) 99334-1543999')).toBe('(31) 99334-1543')
    expect(isValidPhone('(31) 99334-1543')).toBe(true)
    expect(isValidPhone('(31) 9933-154')).toBe(false)
    expect(isValidPhone('(01) 99334-1543')).toBe(false)
  })

  it('limpa o e-mail enquanto digita: minúsculas, sem espaços nem acentos', () => {
    expect(sanitizeEmail('Sárah Santiago@Exemplo.COM ')).toBe('sarahsantiago@exemplo.com')
    expect(validateContact({ ...valid, email: 'sarah@exemplo' })).toEqual(['email'])
  })

  it('envia como text/plain e lê a resposta do Apps Script', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const result = await sendContact('https://script.google.com/macros/s/x/exec', { ...valid, phone: '31993341543' }, fetchMock as unknown as typeof fetch)
    expect(result).toEqual({ ok: true })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Content-Type']).toContain('text/plain')
    expect(JSON.parse(String(init.body))).toMatchObject({ name: 'Sarah', phone: '(31) 99334-1543', source: 'bluezone-site' })
  })

  it('newsletter da BlueNews: sem campo de mensagem, envia com origem "bluenews"', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
    render(<ContactForm endpoint="https://script.google.com/macros/s/x/exec" variant="newsletter" />)
    expect(screen.queryByLabelText('mensagem')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('nome'), { target: { value: 'Sarah' } })
    fireEvent.change(screen.getByLabelText('e-mail'), { target: { value: 'sarah@exemplo.com' } })
    fireEvent.change(screen.getByLabelText('telefone'), { target: { value: '31993341543' } })
    fireEvent.submit(screen.getByRole('button', { name: 'quero ser avisado' }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('inscrição feita'))
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toMatchObject({ source: 'bluenews', phone: '(31) 99334-1543' })
    expect(JSON.parse(String(init.body)).message).toContain('BlueNews')
  })

  it('pop-up do Blueprint: envia nome, e-mail e telefone com origem "popup-blueprint"', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
    render(<BlueprintPopup open />)
    expect(screen.getByRole('dialog', { name: /Postar não é o problema/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'conhecer o Blueprint' })).toHaveAttribute('href', '/blueprint')
    fireEvent.click(screen.getByRole('button', { name: /quero receber promoções/ }))
    fireEvent.change(screen.getByLabelText('nome'), { target: { value: 'Sarah' } })
    fireEvent.change(screen.getByLabelText('e-mail'), { target: { value: 'sarah@exemplo.com' } })
    fireEvent.change(screen.getByLabelText('telefone'), { target: { value: '31993341543' } })
    fireEvent.submit(screen.getByRole('button', { name: 'quero receber' }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('pronto!'))
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toMatchObject({ source: 'popup-blueprint' })
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sem endpoint, avisa que o envio não está configurado', async () => {
    expect(await sendContact('', valid)).toEqual({ ok: false, reason: 'unconfigured' })
    render(<ContactForm endpoint="" />)
    fill()
    fireEvent.submit(screen.getByRole('button', { name: 'enviar' }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('envio ainda não configurado'))
  })

  it('mostra erros de campo e não envia com dados inválidos', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<ContactForm endpoint="https://script.google.com/macros/s/x/exec" />)
    fireEvent.submit(screen.getByRole('button', { name: 'enviar' }).closest('form')!)
    expect(screen.getByText(/confira o e-mail/)).toBeInTheDocument()
    expect(screen.getByText('confira o telefone com DDD.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('aplica a máscara no campo de telefone do formulário', () => {
    render(<ContactForm endpoint="" />)
    const input = screen.getByLabelText('telefone') as HTMLInputElement
    fireEvent.change(input, { target: { value: '31993341543' } })
    expect(input.value).toBe('(31) 99334-1543')
  })

  it('envia e confirma quando o Apps Script responde ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })))
    render(<ContactForm endpoint="https://script.google.com/macros/s/x/exec" />)
    fill()
    fireEvent.submit(screen.getByRole('button', { name: 'enviar' }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('mensagem enviada'))
  })
})
