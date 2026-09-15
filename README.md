# Bluezone

Primeira página pública da Bluezone: uma experiência de marca em WebGL com revelação progressiva, marca em pontilhismo azul no centro da página, headline dividida nos dois lados e três estados de mensagem. A logo oficial é a fonte da verdade da geometria.

Memória das sessões, decisões e pendências: `MEMORIA.md`.

## Desenvolvimento

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # tsc -b + vite build → dist/
npm test             # vitest (jsdom)
npm run test:smoke   # Puppeteer contra um servidor em execução (BASE_URL, padrão 5173)
npm run deploy       # build com o domínio oficial + Firebase Hosting (conta contato@abluezone.com.br)
```

## Arquitetura

Vite, React 19, TypeScript e Three.js direto (sem wrappers). A experiência da home vive em `src/features/home`:

- `HomePage` coordena estado, layout, intro e composição.
- `components/HeroScene` monta e descarta a cena WebGL; sem WebGL, mostra a marca oficial estável via máscara CSS.
- `scene/createHeroScene` é a cena imperativa: atmosfera, partículas, órbitas, esferas, marca em SDF e a timeline.
- `scene/markSampler` lê o PNG oficial, mede a marca, gera o SDF e amostra pontos para a formação.
- `scene/shaders` concentra o GLSL.
- `config/heroConfig` define os três estados (headline, microcopy, "mood" da cena) e a timeline da entrada.
- `hooks/` isolam reduced motion, layout (desktop, tablet, mobile) e parallax do ponteiro (por ref, sem re-render).

Textos, controles e a logo do header ficam em HTML semântico. O canvas é decorativo (`aria-hidden`).

## Marca

`public/logo-bluezone-white.png` e `public/logo-bluezone.png` são a fonte da verdade. A geometria nunca é redesenhada:

1. O canal alpha do PNG é medido (primeiro bloco de colunas com tinta, ignorando a linha de artefato no topo do arquivo).
2. Dessa máscara nasce um campo de distância assinado (SDF), suavizado com um gaussiano de ~3 px para reconstruir as curvas contínuas que o PNG perdeu.
3. Os pixels da tinta alimentam a amostragem de ~15 000 pontos (desktop) do mesmo tamanho que formam a marca em **stippling azul**: o volume vem da densidade e do tom, tratando cada traço como um tubo (borda e sombra em royal denso, centro iluminado em ciano mais ralo). A amostragem rejeita pontos na luz e adensa na sombra, como no pontilhismo desenhado. Os pontos ficam na marca permanentemente.
4. O SDF vira uma `DataTexture` usada só para o glow ao redor da marca (fora da tinta).
5. **Mouse**: sobre o hero, os pontos da marca sofrem uma repulsão elástica com leve redemoinho e clareiam perto do cursor, e voltam ao lugar com amortecimento. Toque não ativa o efeito.
6. **Esferas**: as bolas que orbitam também são pontilhistas: ~620 pontos na superfície de cada uma (Fibonacci), com rotação própria, degradê royal → ciano → menta e sombra por densidade e tom. Vivem no mesmo `BufferGeometry` da marca; posição, raio e rotação chegam por uniform.

**Limitação do asset:** o PNG oficial tem alpha binário e bordas em escada (upscale de ~3,5x sem antialiasing). O SDF suavizado remove a escada sem deslocar o contorno, mas a marca vetorial original continua sendo o ideal para uma fidelidade absoluta. A logo do header usa o PNG direto (com `clip-path` para esconder a linha de artefato no topo do arquivo).

## Timeline da entrada

| Tempo | O que acontece |
| --- | --- |
| 0–0,8 s | atmosfera surge (campos de ruído animado em ice blue, cyan, aqua, menta e branco) |
| 0,6–1,8 s | partículas aparecem; órbitas se desenham (`aPhase` < revelação) |
| 1,2–2,8 s | partículas convergem: anel externo, depois círculo interno, depois traço, com atrasos e trajetórias curvas por partícula |
| 2,5–3,5 s | glow ao redor da marca surge; a marca pontilhada se estabiliza |
| 3,3 s + | headline, setas, indicador, "explorar" e microcopy entram em cascata (CSS `intro-ready`) |

Os tempos vivem em `heroTimeline` e são espelhados em `--t-interface` no CSS.

## Estados

`heroStates` traz três estados. Cada um altera headline, microcopy e um `mood` da cena: sentido e inclinação das órbitas, espalhamento e curvatura das partículas, acento de cor, deslocamento e escala da composição e velocidade dos rastros. A troca é uma transição de ~1,8 s: os parâmetros são interpolados com amortecimento exponencial, parte dos pontos da marca visita as órbitas e volta, e a poeira recebe um impulso para fora antes de se reorganizar. A headline anterior sai enquanto a nova entra, cada palavra de um lado da marca no desktop e empilhada abaixo dela no tablet e no mobile. Setas, indicador e teclado (← →) mudam o estado.

## Rolagem: páginas 2 e 3

A cena WebGL é fixa atrás do conteúdo. As seções (hero, página 2, página 3) têm altura de tela e a rolagem alimenta um único progresso (0 → 2), guardado em `useScrollProgress` e espelhado na variável CSS `--p` para os textos.

- **0 → 1**: a marca deita em 3D (os pontos têm profundidade real), sobe e encolhe um pouco; a maior esfera desliza da órbita para o centro do círculo interno e passa a girar no próprio eixo; o glow se concentra no centro; a interface do hero esmaece e o título "Transformamos pequenos e médios empreendedores em negócios e marcas preparadas para crescer" entra por baixo.
- **1 → 2**: cada ponto (marca, esferas e poeira) sai em arco para uma posição do campo de estrelas que cobre a tela, com atraso por ponto; as órbitas se retraem; a maioria vira poeira discreta e algumas estrelas maiores piscam devagar. A frase "A Blue estrutura marcas, comunicação e presença digital…" entra em fade.
- **2 → 3 (página 4)**: o campo de estrelas continua; entra o título "Não criamos conteúdo apenas para manter sua marca presente. Criamos direção para fazê-la crescer." e um quadro de vídeo 16:9 em vidro. Sem URL configurada em `pages.four.video` (`config/pagesConfig.ts`), o quadro mostra um placeholder com play em pontilhismo; com URL de embed (YouTube/Vimeo) ele renderiza o iframe.
- **Cometas**: nas páginas 3 e 4, com o campo de estrelas formado, cometas discretos (cabeça + rastro em `Points`, fora da composição) cruzam o fundo em diagonal em intervalos irregulares; somem fora desse trecho e em reduced motion.
- **3 → 4 (contato)**: as estrelas voltam a formar a marca, que se posiciona na coluna da esquerda (desktop) ou no topo (mobile) com as esferas orbitando; dentro da página ela rola junto com o conteúdo. À direita, o formulário (nome, e-mail, mensagem) em vidro; abaixo, o footer. "contato" e "começar" no header levam a `#contato`.
- Rolar para cima refaz tudo ao contrário. O progresso é amortecido na cena, então o movimento fica contínuo mesmo com rolagem brusca.

Depois da página 4 entram **Soluções** (`#solucoes`: o que fazemos, como fazemos, para quem fazemos) e **Nosso time** (`#time`: seis integrantes em `pages.team.members`, com foto em `public/`). Essas páginas são mais altas que uma tela, por isso a reformação da marca no contato é medida pela posição real da seção (`--pc`, `ScrollProgress.contact`), não por um índice de tela.

Header de vidro e botão do WhatsApp são fixos em todas as páginas.

## Formulários (Google Apps Script)

Os quatro formulários (contato do site, inscrição e contato da BlueNews, pop-up do Blueprint) usam o mesmo componente `ContactForm` e enviam um único POST, com a origem no campo `source`, para um Web App do Apps Script que grava em uma planilha (uma aba por origem), avisa contato@ e manda uma resposta automática à pessoa de noreply@abluezone.com.br. Código, tabela de origens e passo a passo de atualização em `apps-script/README.md`; `npm run apps-script:bundle` gera o arquivo para colar no editor. A URL entra em `VITE_CONTACT_ENDPOINT` (`.env`, ver `.env.example`) e na variável de mesmo nome no GitHub. Sem URL, o formulário avisa que o envio não está configurado. O cliente valida os campos, usa honeypot e bloqueia envios em sequência; nenhum segredo fica no frontend.

## Privacidade, cookies e medição (LGPD)

- **Política** em `/privacidade` (`privacidade.html` → `src/privacidade/`, dados do controlador em `privacyConfig.ts`, versão em `POLICY_VERSION` de `src/lib/consent.ts`). Links no © de todos os footers.
- **Banner de cookies** (`src/components/CookieBanner.tsx`, montado pelo `SiteBoot` em cada página): aceitar ou recusar, guardado em `bluezone-consent-v1`; "cookies" no footer reabre a escolha.
- **Tags** (`src/lib/tracking.ts`): GA4, Google Ads, Meta Pixel e GTM só carregam com aceite **e** com o ID em `VITE_GA4_ID`, `VITE_GADS_ID`, `VITE_META_PIXEL_ID`, `VITE_GTM_ID` (`.env` local e variáveis do GitHub). Consent Mode v2 nasce negado. Eventos: `lead` (formulários, com `source`), `sign_up` (newsletter), `begin_checkout` (comprar no Blueprint), `view_promotion` (pop-up). O CSP do Hosting já libera os domínios do Google e do Meta.
- **Origem da visita** (`src/lib/campaign.ts`): utm_*, gclid e fbclid da URL vão para a coluna "campanha" da planilha junto com o lead, sem cookie.
- **Consentimento registrado**: cada envio leva a versão da política e o que a pessoa marcou (novidades, anúncios) para a coluna "consentimento".

## Segurança

- **Site**: estático, sem segredos no bundle além da URL pública do Web App; React sem HTML injetado; links externos com `rel="noopener noreferrer"`; `npm audit` limpo em produção.
- **Formulário**: validação no cliente e no Apps Script, honeypot, tempo mínimo de preenchimento e intervalo entre envios no navegador; no servidor, limite global por hora e por e-mail (cache + lock), tamanho máximo do corpo, remoção de caracteres de controle e neutralização de fórmulas do Sheets (`safeCell`).
- **Hospedagem**: `firebase.json` traz os cabeçalhos para o Firebase Hosting (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP) e cache imutável dos assets. Em outra hospedagem, os mesmos cabeçalhos valem (Vercel/Netlify aceitam configuração equivalente).
- **Ao inserir o vídeo**, use `https://www.youtube-nocookie.com/embed/...` (já liberado na CSP).
- Sem cookies nem analytics por enquanto; ao adicionar, revisar CSP e aviso de LGPD.

## Diagramação mobile das páginas

Até 600px, as páginas 2, 3 e 4 alinham o texto à esquerda com margem de 8% e largura máxima de leitura, começam em altura consistente (16 a 28% da tela), trazem um rótulo numerado acima do bloco ("01 — marca", "02 — sobre a Blue", "03 — direção", "04 — contato") e um "continuar" na base que leva à próxima página. O campo de estrelas tem menos pontos no mobile e a clareira acompanha o bloco de texto, mais alto no retrato. No desktop o alinhamento centralizado é mantido.

## Modo escuro

O escuro é o tema padrão (`DEFAULT_THEME` em `useTheme.ts`; `index.html` nasce com `data-theme="dark"`). Interruptor sol/lua no header (`ThemeToggle`, hook `useTheme`), lembrado em `localStorage` e aplicado em `data-theme` no `<html>`. No escuro, o fundo vira preto com névoa discreta, a marca, as esferas, órbitas, cometas e estrelas ficam em branco e cinza (uniform `uDark`, interpolado na cena), e header, formulário e quadro de vídeo viram vidro escuro. Textos em branco.

## Troca automática dos estados do hero

`useAutoAdvance` passa os cinco estados em ciclo a cada 6 s, começando só depois da entrada. Pausa por 12 s após qualquer interação (setas, indicador, teclado), enquanto o mouse está sobre a headline ou os controles, com a aba oculta e quando o hero sai da tela (IntersectionObserver). O ponto ativo do indicador mostra um anel de progresso (`--progress`, `conic-gradient`) nos dois temas. Com reduced motion não há troca automática.

## Reduced motion

Com `prefers-reduced-motion: reduce` a cena renderiza um único frame com a marca formada e estável (sem loop), a interface aparece sem animações de entrada, a troca de estado aplica o novo mood direto e a rolagem troca entre os três quadros sem amortecimento (um frame por evento de scroll).

## Performance

- Pixel ratio limitado (1,75 desktop, 1,6 tablet, 1,5 mobile).
- Quantidade adaptativa: ~19 000 pontos no desktop, ~12 700 no tablet, ~7 500 no mobile (marca + poeira + esferas); menos órbitas, esferas e oitavas de ruído no mobile.
- Um único `BufferGeometry` para todas as partículas; movimento, formação e liberação calculados no vertex shader a partir de uniforms.
- Órbitas em `LineLoop` com atributo de fase, brilhos em `Points`; nenhuma malha sólida na composição.
- Nenhuma alocação por frame; vetores, eulers e matrizes são reutilizados.
- Loop pausado com `document.hidden`; contexto perdido é tratado.
- Sem WebGL: fallback CSS com a marca oficial.

## Direção futura

Novos recursos devem entrar por APIs separadas por domínio: `identity`, `organizations`, `leads`, `content`, `courses`, `billing`, `payments`, `integrations`, `automation`, `ai`, `usage`, `analytics` e `audit`. A UI pública não deve conhecer regras de autenticação ou billing. Pagamentos futuros precisam de uma camada interna com `PaymentProvider`, idempotência, deduplicação persistente, assinatura de webhooks, retry seguro e auditoria, sem acoplar o domínio a um PSP. IA deverá ser acessada por um AI Gateway centralizado, registrando organização, usuário, feature, provider, modelo, tokens, latência, custo estimado, status e request id.

## Limites atuais

Não há backend, captura de leads, autenticação, pagamentos ou chamadas reais de IA nesta entrega. O CTA de contato aponta para a seção de continuidade até que o chat da Bluezone tenha configuração própria.
