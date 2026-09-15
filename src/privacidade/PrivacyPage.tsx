import { siteConfig } from '../features/home/config/siteConfig'
import { POLICY_VERSION, resetConsent } from '../lib/consent'
import { withBase } from '../lib/paths'
import { privacy } from './privacyConfig'

/** Política de privacidade e cookies (LGPD). Texto de referência para revisão jurídica; dados do controlador em `privacyConfig.ts`. */
export function PrivacyPage() {
  return (
    <div className="news legal-page">
      <header className="legal-header">
        <a href={withBase('/#top')} className="legal-brand" aria-label="Bluezone, voltar ao site">Bluezone</a>
        <a className="nav-back" href={withBase('/#top')}>voltar ao site</a>
      </header>
      <main className="legal" aria-labelledby="privacy-title">
        <span className="news-kicker">política de privacidade e cookies</span>
        <h1 id="privacy-title" className="legal-title">Como a Bluezone cuida dos seus dados</h1>
        <p className="legal-meta">Versão {POLICY_VERSION}. Atualizada em {privacy.updated}.</p>

        <h2>Quem somos</h2>
        <p>O controlador dos dados é a {privacy.controller}, em {privacy.city}. Para qualquer assunto sobre seus dados, escreva para <a href={`mailto:${privacy.email}`}>{privacy.email}</a>.</p>

        <h2>Quais dados coletamos e por quê</h2>
        <ul>
          <li><strong>Formulários</strong> (contato, inscrição e contato da BlueNews, pop-up do Blueprint): nome, e-mail, telefone e a mensagem que você escreveu. Usamos para responder ao seu contato. Base legal: execução de providências a seu pedido e interesse legítimo em atender quem nos procura.</li>
          <li><strong>Novidades e promoções</strong> por e-mail ou WhatsApp: só se você marcar essa opção. Base legal: consentimento, que pode ser retirado a qualquer momento pelo link de descadastro ou pelo nosso e-mail.</li>
          <li><strong>Anúncios personalizados</strong>: só se você marcar essa opção, o seu e-mail pode ser usado, de forma protegida (hash), para criar públicos de anúncio em plataformas como Meta e Google. Base legal: consentimento.</li>
          <li><strong>Origem da visita</strong>: parâmetros de campanha do link que trouxe você ao site (utm, gclid, fbclid), guardados no seu navegador e enviados junto com o formulário. Servem para saber qual canal trouxe cada contato.</li>
          <li><strong>Registro do consentimento</strong>: data, origem e versão desta política no momento do envio, como prova das suas escolhas.</li>
        </ul>

        <h2>Cookies e medição</h2>
        <p>Usamos armazenamento local do navegador para lembrar o tema (claro ou escuro), a sua escolha sobre cookies e a origem da visita. Isso não identifica você e não é compartilhado.</p>
        <p>Cookies de <strong>análise</strong> (Google Analytics) e de <strong>anúncio</strong> (Google Ads e Meta) só entram depois que você aceita no banner. Eles medem visitas e permitem mostrar anúncios relevantes para quem já visitou o site. Recusar não muda nada na navegação. Para mudar de ideia, <button type="button" className="legal-link" onClick={() => { resetConsent(); window.scrollTo({ top: 0 }) }}>reabra a escolha de cookies</button>.</p>

        <h2>Com quem os dados são compartilhados</h2>
        <ul>
          <li><strong>Google</strong>: os formulários são gravados em uma planilha do Google e o e-mail de confirmação é enviado pelo Google Workspace; análise e anúncios pelo Google Analytics e Google Ads, quando aceitos.</li>
          <li><strong>Meta</strong> (Instagram e Facebook): anúncios e públicos, quando aceitos.</li>
          <li><strong>Kiwify</strong>: se você comprar o Blueprint, o pagamento e a entrega do curso acontecem na plataforma, com a política de privacidade dela.</li>
          <li><strong>Firebase (Google)</strong>: hospedagem do site e banco de dados da BlueNews.</li>
        </ul>
        <p>Não vendemos dados pessoais. Fornecedores tratam os dados só para prestar o serviço à Bluezone.</p>

        <h2>Por quanto tempo guardamos</h2>
        <p>Contatos e leads ficam guardados enquanto houver relação comercial ou interesse demonstrado, e por até cinco anos depois, para registro. Inscrições em novidades ficam até você se descadastrar. Dados de medição seguem os prazos das plataformas, no máximo 14 meses no Google Analytics.</p>

        <h2>Seus direitos</h2>
        <p>Você pode pedir a qualquer momento: confirmação de que tratamos seus dados, acesso, correção, exclusão, portabilidade, informação sobre compartilhamentos e a retirada de um consentimento. É só escrever para <a href={`mailto:${privacy.email}`}>{privacy.email}</a>. Respondemos em até 15 dias. Se não ficar satisfeito, pode recorrer à Autoridade Nacional de Proteção de Dados (ANPD).</p>

        <h2>Segurança</h2>
        <p>O site usa HTTPS, cabeçalhos de segurança e limites de envio nos formulários. Os dados ficam em serviços do Google com acesso restrito à equipe da Bluezone.</p>

        <h2>Mudanças nesta política</h2>
        <p>Quando mudar algo relevante, atualizamos a versão e a data no topo desta página. Consentimentos guardam a versão vigente na hora do envio.</p>
      </main>
      <footer className="legal-footer">
        <nav aria-label="Rodapé"><a href={withBase('/#contato')}>contato</a><a href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">whatsapp</a><a href={`mailto:${privacy.email}`}>{privacy.email}</a></nav>
        <p className="news-legal">© {siteConfig.year} Bluezone. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
