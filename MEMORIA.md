# Bluezone — memória do projeto

Registro do que foi decidido e construído nas sessões, para retomar o trabalho de onde parou.
Leia junto com `README.md` (arquitetura e como rodar) e `apps-script/README.md` (formulário).

## Estado atual (12/09/2026, fim do dia)

Site de página única em `src/features/home`, com cena WebGL fixa atrás do conteúdo e rolagem controlando a coreografia.

| Página | Âncora | Conteúdo |
| --- | --- | --- |
| Hero | `#top` | marca em stippling azul, 5 estados de headline passando sozinhos a cada 6 s |
| 01 — marca | `#page-two` | marca deita em 3D e desce; a menor esfera vai ao centro; "Transformamos pequenos e médios empreendedores em negócios e marcas preparadas para crescer" |
| 02 — história | `#historia` | "Você já ouviu falar nas 'Zonas Azuis'?" (texto da cliente) + "proposta Blue!" + "e a história continua" (novos braços: IA, tecnologia, produtos digitais; parágrafo redigido a pedido em 12/09/2026). Movida para logo depois da marca a pedido. |
| 03 — quem somos | `#page-three` | marca vira campo de estrelas; texto da cliente (abertura + parágrafo justificado) |
| 04 — direção | `#page-four` | "Não criamos conteúdo apenas para manter sua marca presente." + "Criamos direção para fazê-la crescer e permanecer." + quadro de vídeo (placeholder) |
| 05 — soluções | `#solucoes` | o que fazemos / como fazemos / para quem fazemos (textos da cliente; em 12/09/2026 ela removeu os parágrafos de abertura de "o que fazemos" e "como fazemos" por excesso de texto: cada bloco começa direto na linha de introdução da lista) |
| 06 — clientes | `#clientes` | "O que nossos clientes dizem sobre nós." — carrossel de quadrados com foto, vídeo ou áudio, troca sozinho a cada 7 s (pausa com mouse, toque, mídia tocando); itens em `pages.testimonials.items` |
| 07 — produtos | `#produtos` | grade de 3 colunas (2 no tablet, 1 no mobile), sem "em breve" abaixo do rótulo (só nos cartões; os indisponíveis ficam esmaecidos em cinza, pedido de 12/09/2026): **Blueprint** (curso disponível na Kiwify, cartão com "conheça o Blueprint" → `/blueprint`), e em breve: IA para automação, IA para criação de conteúdo, **BlueCast**, **Plataforma Blue de cursos** (plataforma própria; quem compra entra na comunidade de empreendedores: conversa, networking) (podcast: mercado brasileiro para micro e médio empreendedor, inovação, editais, histórias) |
| 08 — nosso time/parceiros | `#time` | fundadores (Isabela Lima, Alisson Werneck) em destaque + 5 integrantes, fotos em `public/midia/` |
| Blueprint | `/blueprint` | **sempre escura e em laranja** (todo letreiro/brilho que é azul no site vira âmbar aqui: logotipo, títulos, símbolo pontilhista, molduras do notebook/celular, WhatsApp, cartão da oferta pulsando). Boxes sobem em cascata ao entrar e brilham laranja no hover. Jornal entra dobrado e girando, desdobra pela borda de cima, foto e parágrafos em cascata, inclina com o mouse. Notebook/celular refeitos com base nas referências (MacBook prateado, iPhone preto com entalhe; imagens em `media-src/referencias/`). Footer volta a ser Bluezone (→ home). Header próprio: logotipo **Blueprint** + seções (o curso, para quem, conteúdo, resultados, oferta, idealizadores, dúvidas) + botão **comprar agora** (Kiwify), sem sol/lua. Fotos em `public/midia/blueprint/` (hero: selfie com notebook; resultados: foto do palco com LED; idealizadores: foto da cadeira; originais em `media-src/blueprint/`). Página de vendas do curso com os textos da cliente (12/09/2026) em `src/blueprint/blueprintConfig.ts`: hero ("É falta de direção"), faixa "Blueprint" rolando, "é pra você se…", problema + citação, o que é, banner, para quem, 6 módulos, resultados, oferta (5x de R$ 12,62, botão comprar, selos, logo Kiwify em `public/midia/kiwify.png`), idealizadores (fotos + texto), FAQ em sanfona, ajuda (WhatsApp + e-mail de suporte `siteConfig.supportEmail`), footer com redes. Todos os botões de compra abrem `siteConfig.blueprintCourse` = https://pay.kiwify.com.br/B4TG5UJ. Dado "__% das empresas…" (Hootsuite 2024) fica oculto até a cliente informar o número (`problem.statNumber`). |
| BlueNews | `/bluenews` | newsletter por e-mail + portal ("em breve"); header com logotipo **BlueNews** (símbolo oficial + palavra em Plex Mono, Blue negrito/News leve) e as **seções do portal** no lugar do menu do site: tecnologia, marketing, empreendedorismo, criação de conteúdo, finanças (da cliente) + vendas, oportunidades, histórias (sugeridas, 12/09/2026) — cada uma com cartão "em breve" na página (`pages.blog.categories`); menu do site fica no footer com "voltar ao site"; um botão "quero ser avisado" abre inscrição (nome, e-mail, telefone) → mesmo Apps Script com origem `bluenews`; entrada `bluenews.html` + `src/bluenews/` |
| 09 — contato | `#contato` | "Entre em contato" + formulário (nome, e-mail, telefone com máscara, mensagem) + footer |

Header de vidro fixo: marca · história · quem somos · soluções · clientes · produtos · nosso time (sem "/parceiros" no header, para caber; a seção continua "07 — nosso time/parceiros") · bluenews · botão **contato** · sol/lua. Clicar no logotipo (Bluezone ou BlueNews) sempre volta ao topo do site (`/#top`); chegando com âncora de outra página, a Home repete a rolagem depois de montar. Logo do header e títulos das páginas (page-title, page-text, page-strong, solution-title, nomes do time) têm brilho de letreiro de LED com leve cintilar: azul no escuro, azul mais claro no claro (pedido em 12/09/2026). Ícone do WhatsApp brilha só no escuro. Links do header são absolutos (`/#id`) para funcionarem também na página do blog.
Footer: mesmos links + WhatsApp + ícones Instagram (instagram.com/abluezone), TikTok (tiktok.com/@bluezon_e), Facebook (facebook.com/people/Bluezone-Marketing-Vendas/61553804584166) e LinkedIn (linkedin.com/company/bluezone-marketing-vendas) ativos; só o ícone de link/site segue vazio em `siteConfig.social` (desativado).
WhatsApp flutuante: ícone em pontilhismo (no escuro: branco puro, sem degradê, com luz azul de LED atrás — pedido final da cliente em 12/09/2026, depois de testar verde; colorido no claro; laranja no Blueprint) com "chame a gente!" digitando em cima. Número: 5531993341543.

## Decisões de design que não devem ser revertidas sem combinar

- **Rolagem**: `--p` (telas) move hero, página 1 e a cena WebGL; `--pc` mede o contato pela posição real; cada seção com `data-scroll-section` recebe `--ps` (0 = uma tela antes do topo, 1 = no topo) e as entradas de quem somos, direção, história e soluções animam por `--ps`, então dá para reordenar seções sem quebrar (feito em 12/09/2026 ao mover história para depois da marca).

- **Logo é inegociável**: geometria vem do PNG oficial (`public/logo-bluezone-white.png`), medido e amostrado em `scene/markSampler.ts`. Nunca redesenhar. O PNG tem bordas em escada e uma linha de artefato no topo (o header usa `clip-path`).
- **Pontilhismo**: pontos do mesmo tamanho, menores e densos (stippling), volume por densidade e tom. Marca só azul; esferas com degradê azul → verde-água (faixa larga) → verde claro; esferas em pontilhismo com rotação própria + translação, todas independentes.
- **Fonte**: só IBM Plex Mono em tudo. Textos longos justificados, última linha à esquerda, hifenização pt-BR; linhas que introduzem listas ficam centralizadas.
- **Tema**: escuro é o padrão ao entrar no site (voltou a ser em 12/09/2026, antes de publicar); claro é escolha do visitante (lembrada). Tudo que for feito precisa funcionar nos dois.
- **Claro**: fundo bokeh azul + lilás/rosa dominante, verde só à esquerda; campo de estrelas cheio. **Escuro**: preto com névoa discreta; campo de estrelas mais limpo perto do texto; não mexer.
- **Nebulosa: testada e removida (12/09/2026).** A cliente experimentou a foto real da Nebulosa da Hélice atrás do texto (quem somos, depois nosso time) e atrás da marca no contato, e concluiu que "ficou muita info". Tudo foi removido; o escuro voltou ao estado aprovado (preto com névoa discreta e estrelas). O original da foto ficou em `media-src/NGC7293_2004_hubble_original.jpg` caso volte a ser útil.
- **Sombra da marca**: silhueta pelo SDF atrás dos pontos (azul-marinho no claro, névoa clara no escuro), mais forte quando os pontos se afastam do mouse, **contornada por um brilho azul de letreiro de LED** (`logoGlowFragment`, cintilar leve; azul mais clarinho no claro, mais profundo no escuro; pedido em 12/09/2026). Sem brilho branco (fazia um retângulo).
- **Nada aditivo no WebGL**: mistura aditiva escurecia o fundo claro. Brilhos, cometas e halos usam mistura normal com cor por tema.
- **Mobile**: textos à esquerda, rótulos numerados, "continuar" na base; menu vira painel de vidro; pontos não encolhem com a composição.
- **Sem frase-manifesto no hero** (foi removida a pedido).

## Pop-up do Blueprint (home)

- `BlueprintPopup` abre uma vez quando "quem somos" entra na tela (não abre na BlueNews nem no Blueprint). Saídas: "conhecer o Blueprint" (/blueprint), "quero receber promoções e conteúdo" (nome, e-mail, telefone → mesma planilha, origem `popup-blueprint`; assunto próprio se colar o `Code.gs` novo) ou fechar (X, Esc, clique fora). **Aparece em toda visita/atualização da página** (a cliente pediu para tirar a pausa de 7 dias em 12/09/2026); fechado, só volta ao recarregar. Visual escuro/laranja do Blueprint, independente do tema.

## Prévia de compartilhamento e GitHub Pages

- Imagens de prévia (WhatsApp/Instagram/redes) em `public/og-bluezone.png` (site e BlueNews) e `public/og-blueprint.png` (Blueprint), 1200×630, geradas com Puppeteer (marca com letreiro sobre fundo escuro). As tags `og:*`/`twitter:*` usam `%VITE_SITE_URL%` (Vite troca no build): `.env` local = http://127.0.0.1:5173; GitHub Pages = https://sarahfbsantiago.github.io/bluezone-site; Firebase = https://bluezone.com.br.
- **GitHub**: conta correta da cliente é **sarahfbsantiago** (a conta SarahSantiago1009910 também está logada no `gh`, mas não é a do projeto; ficou um repositório `bluezone-site` vazio lá para apagar). Repositório `sarahfbsantiago/bluezone-site` (público, exigido pelo Pages gratuito). Workflow `.github/workflows/pages.yml` publica a cada push na main com `VITE_BASE=/bluezone-site/`; caminhos absolutos no código passam por `withBase()` (`src/lib/paths.ts`). Link: https://sarahfbsantiago.github.io/bluezone-site/. O deploy oficial continua sendo o Firebase (base `/`).

## Integrações

- **Formulário → Google Apps Script** (conta dmarketingevendas@gmail.com). URL do Web App no `.env` (`VITE_CONTACT_ENDPOINT`). Grava na aba `contatos` da planilha `1ntXclF4D8wef7CypEVmRjVXs8ZDUg-EUlSyRhSz2GEE` e envia e-mail. Script com proteção contra fórmulas, injeção no e-mail e limite de envios (30/h, 1 a cada 90 s por e-mail). Validado de ponta a ponta em 11/09/2026.
- **Origens na planilha** (coluna `origem`): `bluezone-site` (formulário de contato), `bluenews` (newsletter), `popup-blueprint` (pop-up da home). O `apps-script/Code.gs` do repositório dá assunto próprio a cada uma; o script implantado hoje só tem o assunto padrão até a cliente colar a versão nova.
- **Ao colar código no Apps Script**, usar a versão só com aspas duplas/ASCII (`apps-script/Code.gs`): aspas do chat viram tipográficas e quebram o editor.
- **Deploy**: `firebase.json` pronto com cabeçalhos de segurança (CSP, HSTS etc.). Projeto Firebase ainda **não** existe: a conta dmarketingevendas@gmail.com precisa ativar verificação em duas etapas e aceitar os termos no console; depois criar `bluezone-site` e vincular. CLI já tem a conta adicionada (`firebase login:use dmarketingevendas@gmail.com`). Dois projetos GCP vazios ficaram criados na tentativa (`bluezone-br`, `bluezone-oficial`) — apagar depois.
- **Domínio**: registrado pela cliente; DNS entra quando o Hosting existir.
- **Banco de dados**: não é necessário agora. Quando precisar: Firestore (nunca Supabase, decisão da cliente).

## Como rodar e testar

```bash
npm run dev            # http://127.0.0.1:5173
npm test               # vitest, 26 testes
npm run build          # produção em dist/
npm run test:smoke     # Puppeteer contra um servidor rodando (BASE_URL=... para o preview)
```

Puppeteer: o Chrome 148 baixado pelo puppeteer 24.43 chega corrompido nesta máquina; usar o Chrome 146 do cache:

```bash
PUPPETEER_EXECUTABLE_PATH="$HOME/.cache/puppeteer/chrome/mac_arm-146.0.7680.76/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" npm run test:smoke
```

Capturas headless com GPU: `--ignore-gpu-blocklist --use-angle=metal`. Em dev, `window.__bluezoneHero.seek(segundos)` posiciona a timeline de entrada.

## Onde ficam as coisas

- Textos das páginas: `src/features/home/config/pagesConfig.ts` (trechos entre `**` viram negrito).
- Estados do hero e timeline: `src/features/home/config/heroConfig.ts`.
- Links, WhatsApp, redes: `src/features/home/config/siteConfig.ts`.
- Fotos do time: `public/midia/*.png` (800x800, fundo cinza). Originais e recortes transparentes em `media-src/` (fora do site). Montagem: `tools/compose-team-photos.mjs`.
- Vídeo da página 4: `pages.four.video` em `pagesConfig.ts` (usar `youtube-nocookie.com/embed/...`).
- Materiais antigos da proposta comercial: `~/Desktop/Bluezone - proposta e materiais/`.

## Pendências

### Para a próxima sessão (combinado em 12/09/2026, madrugada)
- [ ] Blueprint: número do dado da Hootsuite 2024 ("__% das empresas usam as redes sociais como parte da estratégia de marketing") em `src/blueprint/blueprintConfig.ts` → `problem.statNumber`. O bloco fica oculto até preencher.
- [ ] Confirmar o e-mail de suporte da página do Blueprint (hoje `siteConfig.supportEmail` = dmarketingevendas@gmail.com).
- [ ] Colar o `apps-script/Code.gs` novo no Apps Script e publicar nova versão (Implantar → Gerenciar implantações → editar → Nova versão) para os e-mails chegarem com assunto por origem: contato, "Nova inscricao na BlueNews", "Novo lead do pop-up Blueprint". Sem isso tudo funciona, só com o assunto padrão.
- [ ] Revisar com a cliente: textos do pop-up (escritos por mim), estilo do jornal, notebook e celular, laranja do Blueprint.


- [ ] Ativar 2FA em dmarketingevendas@gmail.com → criar projeto Firebase → primeiro deploy → DNS do domínio.
- [ ] Endereço do ícone de link/site no footer, se for usar (as quatro redes já entraram em 12/09/2026).
- [ ] Vídeo da página "direção".
- [ ] Blueprint: número do dado da Hootsuite 2024 ("__% das empresas usam as redes sociais…") em `blueprintConfig.problem.statNumber`; confirmar e-mail de suporte (hoje dmarketingevendas@gmail.com).
- [ ] Fotos/prints dos depoimentos para o carrossel de clientes (`public/midia/clientes/`).
- [ ] Fotos em resolução maior de Raphael, Sarah, Ana, Luiz e Hebert (as atuais vieram de prints).
- [ ] Possíveis cartões extras em produtos (assinatura de conteúdo, comunidade) e páginas de cases/conteúdo.

## O que ainda vamos fazer (visão)

- **Produtos de recorrência**: assessoria contínua (plano mensal), comunidade/mentoria em grupo, biblioteca de aulas por assinatura, planner de conteúdo com IA (SaaS mensal), atendimento automatizado no WhatsApp. Hoje só existem os cartões "em breve" em Produtos.
- **BlueNews (blog)**: hoje é uma página "em breve" em `/bluenews`. Depois: lista de artigos, página de artigo, categorias, busca e newsletter. Conteúdo pode vir de arquivos Markdown no repositório (simples, sem banco) ou de um CMS quando o volume crescer.
- **Depoimentos reais** no carrossel (fotos, vídeos, áudios) e cases.
- **Deploy** no Firebase Hosting com domínio próprio, e analytics com aviso de privacidade.

## Histórico resumido

- **12/09/2026 (3ª parte, madrugada)** — Blueprint em laranja (âmbar) em tudo que é azul no site; jornal que entra dobrado, desdobra e inclina com o mouse; boxes em cascata com brilho no hover; notebook (MacBook prateado) e celular (iPhone preto com entalhe) refeitos com base nas referências da cliente (`media-src/referencias/`); marca "Blueprint" digitando em loop + símbolo pontilhista laranja; footers sempre Bluezone → home; pop-up do Blueprint na home ao chegar em "quem somos" (origem `popup-blueprint`), em toda visita. Pendências: número do dado Hootsuite 2024 (`blueprintConfig.problem.statNumber`), confirmar e-mail de suporte, colar `Code.gs` novo para assuntos por origem.

- **11/09/2026** — Hero refeito do zero (formação por partículas, SDF da marca, órbitas, esferas, atmosfera). Depois: composição centrada estilo Astra, headline dividida, marca em pontilhismo, stippling, esferas pontilhistas, fundo bokeh, header de vidro, WhatsApp, páginas 2–4 por scroll, contato com Apps Script, segurança, modo escuro.
- **12/09/2026 (2ª parte)** — Claro voltou a ser o padrão. BlueNews: item "bluenews" no header, logotipo próprio, seções do portal no header (tecnologia, marketing, empreendedorismo, criação de conteúdo, finanças, vendas, oportunidades, histórias) com cartões "em breve", inscrição na newsletter (origem `bluenews`), "voltar ao site" no footer. Página "história" (Zonas Azuis) logo depois da marca; header na ordem marca · história · quem somos · soluções · clientes · produtos · nosso time · bluenews · contato; animações de entrada por seção (`--ps`). Soluções sem os parágrafos de abertura. Contato com letra menor. Redes no footer (Instagram, TikTok, Facebook, LinkedIn). Letreiro de LED nos títulos (azul no escuro, azul-claro no claro) e contorno de LED na silhueta da marca grande. Produtos: Blueprint (curso disponível), IA automação, IA conteúdo, BlueCast, Plataforma Blue de cursos (grade 3 col.). Página de vendas `/blueprint` com os textos da cliente, Kiwify, fotos, header/footer próprios, sempre escura. Nebulosa testada e removida.
- **Feito em 12/09/2026 (plano aprovado)** para o `/blueprint` — peças em `src/blueprint/BlueprintPieces.tsx` (+ `createMarkScene.ts`, hook `useTyping` compartilhado com o WhatsApp): (5) "Quem criou o Blueprint" em formato de jornal (folha clara, manchete, foto P&B com legenda, duas colunas com capitular); (3) foto do hero dentro de um tablet em CSS 3D (a cliente achou o notebook feio; trocado em 12/09/2026) que entra girando e para em leve ângulo; (4) foto do estúdio dentro de um smartphone em CSS 3D (232 px, moldura metálica fina, brilho de vidro) que entra girando ao rolar; (2) marca do topo com "Blueprint" digitando em loop (igual ao WhatsApp) + símbolo em pontilhismo WebGL (canvas com o dobro da caixa para não cortar os pontos no giro; aparece girando, depois levita, reage ao mouse/toque); footer do Blueprint com logotipo Blueprint. Animações rodam uma vez (notebook ao carregar; celular ao entrar na tela); com "reduzir movimento" mostram o estado final. Sem WebGL, o símbolo cai para a máscara CSS.
- **12/09/2026** — Escuro como padrão; sombra da marca; cometas como raios; textos justificados; páginas soluções, produtos e time; fotos do time com fundo cinza; WhatsApp digitando; ícones sociais; 5 estados no hero com troca automática; carrossel de clientes (foto/vídeo/áudio, automático); página BlueNews e item "blog" no header; brilho LED no header/WhatsApp; BlueNews com logotipo próprio, "voltar ao site" e inscrição na newsletter (origem `bluenews`); cartão BlueCast em produtos; favicon; nebulosa com foto do Helix testada em quem somos, nosso time e contato e removida a pedido.
