import { useMemo, useState, type FormEvent } from 'react'
import { CHANNELS, LIMITS, STATUSES, captionForPosting, captionLength, channel, createContent, deleteContent, emptyContent, format, monthGrid, todayKey, updateContent, validateContent, type Content, type ContentInput, type Status } from '../content'
import { IMAGE_TYPES, VIDEO_TYPES, deleteMedia, download, isVideo, uploadMedia } from '../media'
import { MediaThumb } from './MediaThumb'
import { TEMPLATES, renderTemplate, type TemplateId, type Theme } from '../templates'
import { BackButton } from './BackButton'

type View = 'lista' | 'calendario'
type Props = { contents: Content[]; reload: () => Promise<void>; userEmail: string; openId?: string; openNew?: boolean; onBack: () => void; demo?: boolean }

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label])) as Record<Status, string>

/**
 * Publicar: calendário de conteúdo multicanal. Lista com filtros, calendário mensal e editor com legenda por canal,
 * mídia (upload ou molde gerado no navegador) e "baixar tudo" para postar pelo celular. Postagem manual por enquanto.
 */
export function PublicarArea({ contents, reload, userEmail, openId, openNew = false, onBack, demo = false }: Props) {
  const initial = openId ? contents.find((c) => c.id === openId) ?? null : null
  const [editing, setEditing] = useState<Content | 'new' | null>(initial ?? (openNew ? 'new' : null))
  const [form, setForm] = useState<ContentInput>(initial ? toInput(initial) : emptyContent(userEmail))
  const [view, setView] = useState<View>('lista')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [filterChannel, setFilterChannel] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | Status>('')
  const [search, setSearch] = useState('')
  const now = new Date()
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [uploading, setUploading] = useState(false)
  const [tpl, setTpl] = useState<{ template: TemplateId; theme: Theme; kicker: string; title: string; body: string; preview: string }>({ template: 'frase', theme: 'escuro', kicker: '', title: '', body: '', preview: '' })
  const [showTpl, setShowTpl] = useState(false)

  const update = (patch: Partial<ContentInput>) => setForm((current) => ({ ...current, ...patch }))
  const startNew = (date?: string) => { setForm({ ...emptyContent(userEmail), date: date ?? '' }); setEditing('new'); setMessage('') }
  const startEdit = (item: Content) => { setForm(toInput(item)); setEditing(item); setMessage('') }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    const problems = validateContent(form)
    if (problems.length) { setMessage(problems.join(' · ')); return }
    setBusy(true)
    try {
      if (editing === 'new') await createContent(form)
      else if (editing) await updateContent(editing.id, form)
      setMessage('salvo.'); setEditing(null); await reload()
    } catch (error) { setMessage('erro ao salvar: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const setStatus = async (item: Content, status: Status) => {
    const input = { ...toInput(item), status }
    const problems = validateContent(input)
    if (problems.length) { setMessage(problems.join(' · ')); return }
    setBusy(true)
    try { await updateContent(item.id, input); await reload() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const remove = async (item: Content) => {
    if (!window.confirm(`Excluir o post "${item.topic}"? Não dá para desfazer.`)) return
    setBusy(true)
    try { await Promise.all(item.media.map(deleteMedia)); await deleteContent(item.id); setEditing(null); await reload() } catch (error) { setMessage('erro: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true); setMessage('')
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) urls.push(await uploadMedia(file, file.name.replace(/\.[^.]+$/, ''), file.type))
      update({ media: [...form.media, ...urls].slice(0, LIMITS.media) }); setMessage(`${urls.length} arquivo${urls.length === 1 ? '' : 's'} enviado${urls.length === 1 ? '' : 's'}.`)
    } catch (error) { setMessage('não foi possível enviar: ' + (error as Error).message) } finally { setUploading(false) }
  }
  const removeMedia = async (url: string) => { update({ media: form.media.filter((m) => m !== url) }); await deleteMedia(url) }
  const fmt = format(form.channel, form.format)
  const previewTemplate = async () => {
    try { const { dataUrl } = await renderTemplate({ ...tpl, footer: '', w: fmt.w, h: fmt.h }); setTpl((t) => ({ ...t, preview: dataUrl })) } catch (error) { setMessage('não foi possível gerar: ' + (error as Error).message) }
  }
  const addTemplate = async () => {
    setUploading(true); setMessage('')
    try { const { blob } = await renderTemplate({ ...tpl, footer: '', w: fmt.w, h: fmt.h }); const url = await uploadMedia(blob, `${tpl.template}-${form.topic || 'post'}`, 'image/jpeg'); update({ media: [...form.media, url].slice(0, LIMITS.media) }); setMessage('lâmina adicionada à mídia.'); setTpl((t) => ({ ...t, preview: '' })); setShowTpl(false) }
    catch (error) { setMessage('não foi possível gerar: ' + (error as Error).message) } finally { setUploading(false) }
  }
  const downloadAll = async (item: ContentInput & { id?: string }) => {
    const base = `${item.channel}-${item.date || 'sem-data'}-${item.topic.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    await download(new Blob([captionForPosting(item)], { type: 'text/plain;charset=utf-8' }), `${base}-legenda.txt`)
    for (const [i, url] of item.media.entries()) await download(url, `${base}-${String(i + 1).padStart(2, '0')}.${isVideo(url) ? 'mp4' : 'jpg'}`)
  }

  const ch = channel(form.channel)
  const used = captionLength(form)
  const filtered = useMemo(() => contents.filter((c) => (!filterChannel || c.channel === filterChannel) && (!filterStatus || c.status === filterStatus) && (!search || (c.topic + ' ' + c.caption).toLowerCase().includes(search.toLowerCase()))), [contents, filterChannel, filterStatus, search])

  if (editing) return (
    <form className="admin-form" onSubmit={save}>
      <div className="admin-toolbar"><BackButton onClick={() => setEditing(null)} /><h1 className="solution-title">{editing === 'new' ? 'Novo post' : 'Editar post'}</h1>{editing !== 'new' && <button type="button" className="admin-link admin-danger" onClick={() => remove(editing)} disabled={busy}>excluir</button>}</div>
      <div className="admin-grid">
        <div className="admin-fields">
          <div className="adm-row">
            <label className="field"><span>canal</span><select value={form.channel} onChange={(e) => { const c = channel(e.target.value); update({ channel: c.id, format: c.formats[0].id }) }}>{CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
            <label className="field"><span>formato</span><select value={form.format} onChange={(e) => update({ format: e.target.value })}>{ch.formats.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
          </div>
          <label className="field"><span>tema (o que este post é)</span><input value={form.topic} onChange={(e) => update({ topic: e.target.value })} maxLength={LIMITS.topic} required placeholder="ex.: 3 erros de quem posta sem estratégia" /></label>
          <label className="field"><span>legenda · {used}/{ch.caption}{used > ch.caption ? ' · acima do limite' : ''}</span><textarea value={form.caption} onChange={(e) => update({ caption: e.target.value })} rows={9} maxLength={ch.caption} /></label>
          <label className="field"><span>hashtags</span><input value={form.hashtags} onChange={(e) => update({ hashtags: e.target.value })} maxLength={LIMITS.hashtags} placeholder="#marketing #pequenosnegocios" /></label>
          <div className="field adm-media"><span>mídia · {fmt.w}×{fmt.h}{fmt.video ? ' · vídeo' : ''}{fmt.multi ? ' · várias lâminas' : ''}</span>
            {form.media.length > 0 && (
              <ul className="adm-media-list">
                {form.media.map((path, i) => <li key={path}><MediaThumb path={path} demo={demo} /><span>{i + 1}</span><button type="button" className="admin-link admin-danger" onClick={() => removeMedia(path)}>tirar</button></li>)}
              </ul>
            )}
            <div className="adm-media-actions">
              <label className="admin-upload-btn"><input type="file" multiple accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(',')} onChange={(e) => onFiles(e.target.files)} disabled={uploading} />{uploading ? 'enviando…' : 'enviar foto ou vídeo'}</label>
              {!fmt.video && <button type="button" className="admin-upload-btn" onClick={() => setShowTpl((v) => !v)}>{showTpl ? 'fechar molde' : 'gerar lâmina com o molde da marca'}</button>}
            </div>
            {showTpl && (
              <div className="adm-template">
                <div className="adm-row">
                  <label className="field"><span>molde</span><select value={tpl.template} onChange={(e) => setTpl({ ...tpl, template: e.target.value as TemplateId })}>{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
                  <label className="field"><span>tema visual</span><select value={tpl.theme} onChange={(e) => setTpl({ ...tpl, theme: e.target.value as Theme })}><option value="escuro">escuro</option><option value="claro">claro</option></select></label>
                </div>
                <small className="adm-hint">{TEMPLATES.find((t) => t.id === tpl.template)?.hint}</small>
                <label className="field"><span>etiqueta (canto)</span><input value={tpl.kicker} onChange={(e) => setTpl({ ...tpl, kicker: e.target.value })} maxLength={30} placeholder="ex.: estratégia" /></label>
                <label className="field"><span>{tpl.template === 'frase' ? 'frase' : 'título'}</span><textarea value={tpl.title} onChange={(e) => setTpl({ ...tpl, title: e.target.value })} rows={3} maxLength={220} /></label>
                {tpl.template !== 'frase' && <label className="field"><span>{tpl.template === 'lista' ? 'itens (um por linha, até 5)' : 'texto'}</span><textarea value={tpl.body} onChange={(e) => setTpl({ ...tpl, body: e.target.value })} rows={5} maxLength={600} /></label>}
                <div className="contact-actions"><button type="button" className="admin-link" onClick={previewTemplate}>ver prévia</button><button type="button" className="contact-submit" onClick={addTemplate} disabled={uploading || !tpl.title.trim()}>adicionar à mídia</button></div>
                {tpl.preview && <img className="adm-template-preview" src={tpl.preview} alt="Prévia da lâmina" />}
              </div>
            )}
          </div>
          <div className="adm-row">
            <label className="field"><span>data prevista</span><input type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} /></label>
            <label className="field"><span>status</span><select value={form.status} onChange={(e) => update({ status: e.target.value as Status })}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          </div>
          <label className="field"><span>anotações internas (não vão para a rede)</span><textarea value={form.notes} onChange={(e) => update({ notes: e.target.value })} rows={3} maxLength={LIMITS.notes} /></label>
          <div className="contact-actions"><button type="submit" className="contact-submit" disabled={busy}>{busy ? 'salvando…' : 'salvar'}</button><button type="button" className="admin-link" onClick={() => downloadAll(form)} disabled={!form.caption && form.media.length === 0}>baixar tudo</button><span className="contact-feedback">{message}</span></div>
        </div>
        <aside className="admin-preview adm-phone" aria-label="Prévia do post">
          <div className="adm-phone-head"><span className="adm-phone-avatar" /><strong>{ch.handle}</strong><span className="adm-phone-channel">{ch.label} · {fmt.label}</span></div>
          <div className="adm-phone-media" style={{ aspectRatio: `${fmt.w} / ${fmt.h}` }}>{form.media[0] ? <MediaThumb path={form.media[0]} demo={demo} /> : <span>sem mídia</span>}{form.media.length > 1 && <em>1/{form.media.length}</em>}</div>
          <p className="adm-phone-caption"><strong>{ch.handle}</strong> {form.caption || <span className="adm-muted">legenda</span>}{form.hashtags && <><br /><span className="adm-tags">{form.hashtags}</span></>}</p>
        </aside>
      </div>
    </form>
  )

  const cells = monthGrid(month.y, month.m, contents)
  const today = todayKey()
  return (
    <section className="admin-list">
      <div className="admin-toolbar"><BackButton onClick={onBack} /><h1 className="solution-title">Publicar</h1><button type="button" className="contact-submit" onClick={() => startNew()}>novo post</button></div>
      <nav className="adm-tabs" aria-label="Publicar">
        <button type="button" className={`adm-tab${view === 'lista' ? ' is-active' : ''}`} onClick={() => setView('lista')}>lista</button>
        <button type="button" className={`adm-tab${view === 'calendario' ? ' is-active' : ''}`} onClick={() => setView('calendario')}>calendário</button>
      </nav>
      {message && <p className="admin-note">{message}</p>}
      {view === 'calendario' ? (
        <div className="adm-cal">
          <div className="adm-cal-head">
            <button type="button" className="admin-link" onClick={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}>← mês anterior</button>
            <strong>{MONTHS[month.m]} de {month.y}</strong>
            <button type="button" className="admin-link" onClick={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}>mês seguinte →</button>
          </div>
          <div className="adm-cal-grid" role="grid">
            {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d) => <span key={d} className="adm-cal-dow">{d}</span>)}
            {cells.map((cell) => (
              <div key={cell.key} className={`adm-cal-cell${cell.inMonth ? '' : ' is-out'}${cell.key === today ? ' is-today' : ''}`}>
                <button type="button" className="adm-cal-day" onClick={() => startNew(cell.key)} title="novo post neste dia">{cell.day}</button>
                {cell.items.map((item) => <button key={item.id} type="button" className={`adm-cal-item is-${item.status} ch-${item.channel}`} onClick={() => startEdit(item)}>{channel(item.channel).label.slice(0, 2)} · {item.topic}</button>)}
              </div>
            ))}
          </div>
        </div>
      ) : (<>
        <div className="admin-filters">
          <input type="search" placeholder="buscar por tema ou legenda" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
          <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} aria-label="Canal"><option value="">todos os canais</option>{CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as '' | Status)} aria-label="Status"><option value="">todos os status</option>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        </div>
        {filtered.length === 0 ? <p className="admin-note">Nenhum post aqui. Clique em "novo post" ou escolha um dia no calendário.</p> : (
          <ul className="adm-posts" aria-label="Posts">
            {filtered.map((item) => (
              <li key={item.id} className={`ch-${item.channel}`}>
                <div className="adm-post-thumb">{item.media[0] ? <MediaThumb path={item.media[0]} demo={demo} /> : <span />}</div>
                <div className="adm-post-main">
                  <button type="button" className="admin-card-title" onClick={() => startEdit(item)}>{item.topic}</button>
                  <span className="admin-card-meta">{channel(item.channel).label} · {format(item.channel, item.format).label} · <span className={`admin-status is-${item.status}`}>{STATUS_LABEL[item.status]}</span>{item.date && ' · ' + item.date.split('-').reverse().join('/')}</span>
                  <div className="admin-actions">
                    {item.status === 'rascunho' && <button type="button" className="admin-link" onClick={() => setStatus(item, 'aprovado')} disabled={busy}>aprovar</button>}
                    {item.status === 'ideia' && <button type="button" className="admin-link" onClick={() => setStatus(item, 'rascunho')} disabled={busy}>virar rascunho</button>}
                    {item.status === 'aprovado' && <button type="button" className="admin-link" onClick={() => setStatus(item, 'postado')} disabled={busy}>marcar como postado</button>}
                    {(item.media.length > 0 || item.caption) && <button type="button" className="admin-link" onClick={() => downloadAll(item)}>baixar tudo</button>}
                    {item.status !== 'arquivado' && <button type="button" className="admin-link" onClick={() => setStatus(item, 'arquivado')} disabled={busy}>arquivar</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>)}
    </section>
  )
}

function toInput(item: Content): ContentInput {
  return { channel: item.channel, format: item.format, topic: item.topic, caption: item.caption, hashtags: item.hashtags, media: item.media, date: item.date, notes: item.notes, status: item.status, createdBy: item.createdBy }
}
