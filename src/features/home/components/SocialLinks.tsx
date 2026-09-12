import { siteConfig } from '../config/siteConfig'

const icons = {
  instagram: { label: 'Instagram', path: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm5.4-1.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z' },
  tiktok: { label: 'TikTok', path: 'M14 3v10.2a3.2 3.2 0 1 1-2.6-3.1V7.2a6.1 6.1 0 1 0 5.5 6V9.5c1 .7 2.3 1.1 3.6 1.1V7.8a3.8 3.8 0 0 1-3.6-3.8V3H14Z' },
  facebook: { label: 'Facebook', path: 'M14 8.5V6.8c0-.8.5-1.3 1.3-1.3H17V3h-2.4C12 3 10.8 4.6 10.8 6.9v1.6H8.5v2.6h2.3V21h3.2v-9.9h2.4l.4-2.6H14Z' },
  link: { label: 'Link', path: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2' },
  linkedin: { label: 'LinkedIn', path: 'M6.5 9.5V19M6.5 5.2v.1M11 19v-5.2c0-2.2 1.3-3.4 3.1-3.4 1.9 0 2.9 1.2 2.9 3.4V19M11 9.5V19' },
} as const

type Network = keyof typeof icons

/** Ícones das redes no footer. Sem endereço, o ícone aparece desativado até o perfil existir. */
export function SocialLinks() {
  const entries = (Object.keys(icons) as Network[]).map((key) => ({ key, href: siteConfig.social[key], ...icons[key] }))
  return (
    <ul className="social-links" aria-label="Redes sociais">
      {entries.map((item) => (
        <li key={item.key}>
          {item.href ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} title={item.label}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d={item.path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          ) : (
            <span className="is-soon" aria-label={`${item.label} (em breve)`} title={`${item.label} · em breve`}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d={item.path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
