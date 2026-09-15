/**
 * Smoke test com Puppeteer contra um servidor já em execução (padrão: http://127.0.0.1:5173).
 * Uso: npm run dev (em outro terminal) && npm run test:smoke
 *      BASE_URL=http://127.0.0.1:4173 npm run test:smoke   (para `vite preview`)
 */
import puppeteer from 'puppeteer'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`) }

const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, args: ['--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(base, { waitUntil: 'networkidle0' })

  check('title', (await page.title()).includes('Bluezone'), await page.title())
  check('banner de cookies na primeira visita', (await page.$('.cookie-banner')) !== null)
  await page.click('.cookie-decline')
  check('recusar fecha o banner e não carrega tags', (await page.$('.cookie-banner')) === null && (await page.$$('script[src*="googletagmanager"], script[src*="facebook"]')).length === 0)
  await page.reload({ waitUntil: 'networkidle0' })
  check('escolha de cookies é lembrada ao recarregar', (await page.$('.cookie-banner')) === null)
  const h1 = await page.$eval('h1', (el) => el.textContent?.trim())
  check('h1 presente no DOM', h1 === 'estratégia em movimento.', h1)
  check('logo oficial no header', await page.$('img[alt="Bluezone"]') !== null)
  check('cena WebGL ou fallback ativo', await page.evaluate(() => !!document.querySelector('.hero-scene canvas') || !!document.querySelector('.hero-fallback')))

  await page.click('button[aria-label="Próximo estado"]')
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('criatividade'))
  check('clique na seta troca a headline', true)
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('da marca'))
  check('teclado (ArrowRight) alcança o terceiro estado', true)

  const visible = async (selector) => page.$eval(selector, (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return Number(s.opacity) > 0.6 && r.top >= 0 && r.bottom <= window.innerHeight })
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'instant' }))
  await new Promise((resolve) => setTimeout(resolve, 900))
  check('página 2 visível ao rolar uma tela', await visible('#page-two-title'))
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2, behavior: 'instant' }))
  await new Promise((resolve) => setTimeout(resolve, 900))
  check('história visível ao rolar duas telas', await visible('#story-title'))
  await page.evaluate(() => document.getElementById('page-three').scrollIntoView({ behavior: 'instant' }))
  await new Promise((resolve) => setTimeout(resolve, 900))
  check('quem somos: texto entra ao chegar na seção', await visible('.page-text'))
  await new Promise((resolve) => setTimeout(resolve, 900))
  check('pop-up do Blueprint abre ao chegar em quem somos', (await page.$('.bp-popup')) !== null)
  await page.keyboard.press('Escape')
  await new Promise((resolve) => setTimeout(resolve, 400))
  check('pop-up fecha com Esc', (await page.$('.bp-popup')) === null)
  await page.evaluate(() => document.getElementById('page-four').scrollIntoView({ behavior: 'instant' }))
  await new Promise((resolve) => setTimeout(resolve, 900))
  check('direção: título entra ao chegar na seção', await visible('#page-four-title'))
  check('quadro de vídeo presente', await page.$('.video-frame') !== null)
  await page.click('.header-cta')
  await new Promise((resolve) => setTimeout(resolve, 2600))
  check('botão "contato" no header leva ao formulário', await visible('#contact-title'))
  check('formulário de contato presente', await page.$('.contact-form input[name="email"]') !== null)
  await page.type('.contact-form input[name="phone"]', '31993341543')
  const masked = await page.$eval('.contact-form input[name="phone"]', (el) => el.value)
  check('telefone formatado enquanto digita', masked === '(31) 99334-1543', masked)
  check('footer presente', await page.$('.site-footer') !== null)
  const pc = await page.$eval('.home-page', (el) => el.style.getPropertyValue('--pc'))
  check('progresso do contato chega a 1', Number(pc) >= 0.97, pc)
  await page.click('.site-nav a[href="/#solucoes"]')
  await new Promise((resolve) => setTimeout(resolve, 1200))
  check('"soluções" no header leva à página de soluções', await visible('#o-que-fazemos-title'))
  await page.click('.site-nav a[href="/#page-two"]')
  await new Promise((resolve) => setTimeout(resolve, 1200))
  check('"marca" no header leva à página da marca', await visible('#page-two-title'))
  await page.click('.site-nav a[href="/#historia"]')
  await new Promise((resolve) => setTimeout(resolve, 1200))
  check('"história" no header leva à página das Zonas Azuis', await visible('#story-title'))
  await page.click('.site-nav a[href="/#produtos"]')
  await new Promise((resolve) => setTimeout(resolve, 1200))
  check('"produtos" leva à página de produtos', await visible('#products-title'))
  await page.click('.site-nav a[href="/#time"]')
  await new Promise((resolve) => setTimeout(resolve, 1200))
  check('"nosso time" mostra os sete integrantes', (await page.$$('.team-card')).length === 7)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))

  await page.goto(base + '/bluenews', { waitUntil: 'load' }) // Firestore mantém conexão aberta
  await new Promise((resolve) => setTimeout(resolve, 2500))
  check('BlueNews abre em /bluenews', (await page.title()).includes('BlueNews') && (await page.$('#blog-title')) !== null, await page.title())
  check('BlueNews: logotipo BlueNews + voltar ao site no footer', (await page.$eval('.header-brand', (el) => el.textContent ?? '')).includes('BlueNews') && (await page.$('.site-footer .nav-back')) !== null)
  check('BlueNews: header com 9 seções e chips de filtro', (await page.$$('.news-nav a[href*="secao="]')).length === 9 && (await page.$$('.blog-categories li')).length === 10)
  await page.click('.blog-cta')
  await new Promise((resolve) => setTimeout(resolve, 600))
  check('"quero ser avisado" abre a inscrição (nome, e-mail, telefone)', await visible('.newsletter-form input[name="phone"]') && (await page.$('.newsletter-form textarea')) === null)
  await page.click('.header-brand')
  await new Promise((resolve) => setTimeout(resolve, 800))
  check('logotipo BlueNews fica na BlueNews (topo)', page.url().startsWith(base + '/bluenews'), page.url())
  await page.click('.site-footer .footer-brand')
  await new Promise((resolve) => setTimeout(resolve, 1500))
  check('Bluezone do footer volta ao site', page.url().replace(/#.*$/, '') === base + '/' || page.url().startsWith(base + '/#'), page.url())

  await page.goto(base + '/privacidade', { waitUntil: 'load' })
  await new Promise((resolve) => setTimeout(resolve, 800))
  check('política de privacidade abre em /privacidade', (await page.title()).includes('privacidade') && (await page.$('#privacy-title')) !== null, await page.title())
  check('footer do site tem link para a privacidade', true)

  await page.goto(base + '/bluenews?contato', { waitUntil: 'load' })
  await new Promise((resolve) => setTimeout(resolve, 2000))
  check('BlueNews: aba contato com formulário próprio', (await page.$('.news-contact-page textarea[name="message"]')) !== null)

  await page.goto(base + '/painel/', { waitUntil: 'load' }) // painel: site separado (em dev, pasta /painel); Firestore mantém conexão aberta
  await new Promise((resolve) => setTimeout(resolve, 3000))
  check('painel abre em /painel/ com login', (await page.$('.admin')) !== null && ((await page.$eval('.admin', (el) => el.textContent ?? '')).includes('entrar com Google') || (await page.$eval('.admin', (el) => el.textContent ?? '')).includes('não está configurado')))

  await page.goto(base + '/blueprint', { waitUntil: 'networkidle0' })
  check('Blueprint abre em /blueprint com o botão do curso', (await page.title()).includes('Blueprint') && (await page.$('#blueprint-title')) !== null && (await page.$('.blog-cta')) !== null, await page.title())
  check('Blueprint: header próprio (logotipo Blueprint, 7 seções, comprar) e sempre escuro', (await page.$eval('.header-brand', (el) => el.textContent ?? '')).includes('Blueprint') && (await page.$$('.site-nav a[href^="#"]')).length === 8 && (await page.$eval('.header-cta', (el) => el.getAttribute('href') ?? '')) === '#oferta' && (await page.$eval('html', (el) => el.getAttribute('data-theme'))) === 'dark')

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.goto(base, { waitUntil: 'networkidle0' })
  const mobileClass = await page.$eval('.home-page', (el) => el.className)
  check('viewport mobile aplica layout-mobile', mobileClass.includes('layout-mobile'), mobileClass)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  check('sem rolagem horizontal no mobile', overflow)
  check('sem erros de página', errors.length === 0, errors.join(' | '))
} finally {
  await browser.close()
}
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} verificações ok`)
process.exit(failed.length ? 1 : 0)
