import { useEffect, useState, type FormEvent } from 'react'
import { BRAND_FIELDS, BRAND_LIMIT, BRAND_MAX_FILES, EMPTY_BRAND, VISUAL_FIELDS, getBrand, saveBrand, type Brand } from '../brand'
import { IMAGE_TYPES, deleteMedia, uploadMedia } from '../media'
import type { Role } from '../site'
import { BackButton } from './BackButton'
import { MediaThumb } from './MediaThumb'

type Props = { role: Role; email: string; demo: boolean; onBack: () => void }

/**
 * Marca: a base que alimenta quem escreve e, depois, a geração por IA. Identidade visual (paleta, tipografia, logotipos),
 * referências aprovadas com nota, e o guia de texto (tom, público, palavras, exemplos, fontes). Editores leem; administradores editam.
 * Os arquivos ficam na pasta `marca/` do Storage, lidos só pela equipe.
 */
export function MarcaPage({ role, email, demo, onBack }: Props) {
  const [brand, setBrand] = useState<Brand>(EMPTY_BRAND)
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    if (demo) { setBrand({ ...EMPTY_BRAND, tom: 'Direta, próxima e sem jargão. Fala com quem empreende como quem senta do lado, não de cima.', paleta: 'azul #1f6dff (destaque) · carbono #0b0f14 (fundo) · laranja #ff8a2a (só Blueprint)' }); setLoaded(true); return }
    getBrand().then((b) => { setBrand(b); setLoaded(true) }).catch((error) => { setMessage('não foi possível carregar: ' + (error as Error).message); setLoaded(true) })
  }, [demo])
  const canEdit = role === 'admin'
  const patch = (p: Partial<Brand>) => { setBrand((b) => ({ ...b, ...p })); setDirty(true) }
  const persist = async (next: Brand) => {
    setBusy(true)
    try { await saveBrand(next, email); setBrand(next); setDirty(false); setMessage('guia salvo.') } catch (error) { setMessage('erro ao salvar: ' + (error as Error).message) } finally { setBusy(false) }
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if ([...BRAND_FIELDS, ...VISUAL_FIELDS].some((f) => brand[f.id].length > BRAND_LIMIT)) { setMessage(`cada campo aceita até ${BRAND_LIMIT} caracteres.`); return }
    await persist(brand)
  }
  const addFiles = async (files: FileList | null, kind: 'logos' | 'referencias') => {
    if (!files?.length) return
    if (brand.logos.length + brand.referencias.length + files.length > BRAND_MAX_FILES) { setMessage(`no máximo ${BRAND_MAX_FILES} arquivos na marca.`); return }
    setUploading(true); setMessage('')
    try {
      const paths: string[] = []
      for (const file of Array.from(files)) paths.push(await uploadMedia(file, file.name.replace(/\.[^.]+$/, ''), file.type, 'marca'))
      const next = kind === 'logos' ? { ...brand, logos: [...brand.logos, ...paths] } : { ...brand, referencias: [...brand.referencias, ...paths.map((path) => ({ path, nota: '' }))] }
      await persist(next)
    } catch (error) { setMessage('não foi possível enviar: ' + (error as Error).message) } finally { setUploading(false) }
  }
  const removeFile = async (path: string) => {
    if (!window.confirm('Tirar este arquivo da marca?')) return
    await persist({ ...brand, logos: brand.logos.filter((p) => p !== path), referencias: brand.referencias.filter((r) => r.path !== path) })
    await deleteMedia(path)
  }
  const setNota = (path: string, nota: string) => patch({ referencias: brand.referencias.map((r) => (r.path === path ? { ...r, nota: nota.slice(0, 300) } : r)) })

  return (
    <form className="admin-list" onSubmit={save}>
      <div className="admin-toolbar"><BackButton onClick={onBack} /><h1 className="solution-title">Marca</h1>{canEdit && <button type="submit" className="contact-submit" disabled={busy || !loaded}>{busy ? 'salvando…' : dirty ? 'salvar guia' : 'salvo'}</button>}</div>
      <p className="admin-note">A base que orienta quem escreve e que a geração de conteúdo vai seguir. {canEdit ? 'Toda correção feita num post vale a pena virar uma linha aqui.' : 'Só a administração edita; se algo estiver desatualizado, avise.'}</p>
      {message && <p className="admin-note">{message}</p>}
      {!loaded ? <p className="admin-note">carregando…</p> : (<>
        <h2 className="admin-subtitle">identidade visual</h2>
        <div className="adm-brand-fields">
          {VISUAL_FIELDS.map((f) => (
            <label key={f.id} className="field"><span>{f.label}</span><small className="adm-hint">{f.hint}</small><textarea value={brand[f.id]} onChange={(e) => patch({ [f.id]: e.target.value })} rows={f.rows} maxLength={BRAND_LIMIT} readOnly={!canEdit} /></label>
          ))}
        </div>
        <div className="field adm-media"><span>logotipos e símbolos (PNG, JPG ou WebP)</span>
          <small className="adm-hint">Versões oficiais: completa, símbolo, claro e escuro. É daqui que os moldes e a geração puxam a marca.</small>
          {brand.logos.length > 0 && <ul className="adm-media-list adm-logos">{brand.logos.map((path) => <li key={path}><MediaThumb path={path} demo={demo} />{canEdit && <button type="button" className="admin-link admin-danger" onClick={() => removeFile(path)}>tirar</button>}</li>)}</ul>}
          {canEdit && <div className="adm-media-actions"><label className="admin-upload-btn"><input type="file" multiple accept={IMAGE_TYPES.join(',')} onChange={(e) => addFiles(e.target.files, 'logos')} disabled={uploading} />{uploading ? 'enviando…' : 'enviar logotipo'}</label></div>}
        </div>
        <div className="field adm-media"><span>referências aprovadas</span>
          <small className="adm-hint">Posts, artes e prints que são a cara da marca. Escreva em cada um por que ele funciona: é o que a geração vai imitar.</small>
          {brand.referencias.length > 0 && (
            <ul className="adm-refs">
              {brand.referencias.map((r) => (
                <li key={r.path}>
                  <MediaThumb path={r.path} demo={demo} />
                  <textarea value={r.nota} onChange={(e) => setNota(r.path, e.target.value)} rows={3} maxLength={300} placeholder="por que esta referência funciona" readOnly={!canEdit} aria-label="Nota da referência" />
                  {canEdit && <button type="button" className="admin-link admin-danger" onClick={() => removeFile(r.path)}>tirar</button>}
                </li>
              ))}
            </ul>
          )}
          {canEdit && <div className="adm-media-actions"><label className="admin-upload-btn"><input type="file" multiple accept={IMAGE_TYPES.join(',')} onChange={(e) => addFiles(e.target.files, 'referencias')} disabled={uploading} />{uploading ? 'enviando…' : 'enviar referência'}</label></div>}
        </div>
        <h2 className="admin-subtitle">como a Bluezone fala</h2>
        <div className="adm-brand-fields">
          {BRAND_FIELDS.map((f) => (
            <label key={f.id} className="field"><span>{f.label}</span><small className="adm-hint">{f.hint}</small><textarea value={brand[f.id]} onChange={(e) => patch({ [f.id]: e.target.value })} rows={f.rows} maxLength={BRAND_LIMIT} readOnly={!canEdit} /></label>
          ))}
        </div>
        {canEdit && <div className="contact-actions"><button type="submit" className="contact-submit" disabled={busy}>{busy ? 'salvando…' : 'salvar guia'}</button><span className="contact-feedback">{dirty ? 'há alterações não salvas' : ''}</span></div>}
      </>)}
    </form>
  )
}
