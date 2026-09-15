import { siteConfig } from '../config/siteConfig'
import { resetConsent } from '../../../lib/consent'
import { withBase } from '../../../lib/paths'
import { BrandLogo } from './BrandLogo'
import { contactItem, navItems } from './SiteHeader'
import { SocialLinks } from './SocialLinks'

/** Footer. Fora da home (`bluenews`, `blueprint`), o primeiro link do menu é "voltar ao site". */
export function SiteFooter({ site = 'home' }: { site?: 'home' | 'bluenews' | 'blueprint' }) {
  return (
    <footer className="site-footer">
      <a href={withBase('/#top')} className="footer-brand" aria-label="Bluezone, voltar à página inicial do site"><BrandLogo /></a>
      <nav aria-label="Navegação do rodapé">
        {site !== 'home' && <a className="nav-back" href={withBase('/#top')}>voltar ao site</a>}
        {navItems.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
        <a href={contactItem.href}>{contactItem.label}</a>
        <a href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">whatsapp</a>
      </nav>
      <SocialLinks />
      <p className="footer-legal">© {siteConfig.year} Bluezone. Todos os direitos reservados. <a href={withBase('/privacidade')}>privacidade</a> · <button type="button" className="footer-link" onClick={resetConsent}>cookies</button></p>
    </footer>
  )
}
