# Plano: geração automática de posts no Bluezone.adm (etapa 3)

Escrito em 16/09/2026 para executar em 17/09/2026. Parte do que já existe: painel com Publicar (calendário multicanal, moldes de imagem), Marca (base da marca) e regras estritas de banco e Storage.

## Objetivo

A cliente escreve um pedido em linguagem normal dentro do painel e recebe posts prontos, já no calendário, como **rascunho**, com data e hora sugeridas por canal. Ela revisa, aprova e posta pelo celular. Nada é publicado sem aprovação. Sem API das redes nesta etapa.

Exemplos de pedido:
- "faz um carrossel sobre os 3 erros de quem posta sem estratégia"
- "monta a semana que vem com 5 posts sobre o Blueprint, um por canal"
- "transforma a notícia do GPT-6 Astra num post de LinkedIn e num reels"

## Decisão de arquitetura

**Cloud Function + API da Claude**, não agente local no Mac. Motivo: responde em segundos, a qualquer hora, sem ninguém no meio; o local só funciona com o Mac da Sarah ligado. O teste continua seguro porque tudo entra como rascunho e a chave tem limite mensal de gasto.

- Modelo: `claude-opus-5` (Opus 5), pensamento adaptativo, esforço `medium` (bom para escrita; subir para `high` se a qualidade pedir).
- Chave da API no **Secret Manager** (`ANTHROPIC_API_KEY`), nunca no código nem no navegador.
- Function chamável (`onCall`) que exige usuário logado e presente em `admins` ou `editors`. Região `southamerica-east1`, memória mínima, timeout 120 s, `maxInstances` 3.
- Resposta da Claude em **JSON validado** (structured outputs, `output_config.format`) com o mesmo formato do painel. Nada de texto solto para "parsear".
- Custo estimado: R$ 0,30 a R$ 1,00 por pedido. Limite de gasto de R$ 100/mês na chave.

## O que a Function recebe e devolve

Entrada (do painel, usuário logado):
- `pedido` (texto, até 1.000 caracteres)
- `canais` opcionais (para forçar), `de`/`ate` (janela de datas), `quantidade` opcional

A Function junta, no servidor:
- documento `marca/guia` inteiro (tom, público, palavras, exemplos bons e ruins, paleta, tipografia; notas das referências)
- regras dos canais (formatos, tamanhos, limites de legenda) e **tabela de melhores horários** por canal e dia da semana
- calendário dos próximos 30 dias (temas, canais, datas, status) para não repetir tema, não lotar dia e espaçar posts do mesmo canal
- notícias publicadas da BlueNews nos últimos 30 dias (título, resumo, link) como matéria-prima

Saída (JSON):
```
{ "posts": [ {
  "channel": "instagram", "format": "carrossel",
  "topic": "...", "caption": "...", "hashtags": "#... #...",
  "slides": [ { "template": "capa", "kicker": "...", "title": "...", "body": "" }, ... ],
  "date": "2026-09-18", "time": "18:30",
  "why": "terça 18h30 é a melhor janela do Instagram para o público; não há outro post de Instagram nesta semana"
} ], "notes": "observações do agente para a cliente" }
```

O painel valida cada post com `validateContent`, gera as lâminas com os moldes (`templates.ts`) no navegador, sobe para `conteudo/`, grava em `conteudos` com `status: 'rascunho'`, `createdBy` = e-mail de quem pediu, e abre a lista filtrada em rascunho.

Para vídeo (reels, TikTok, YouTube): o agente entrega roteiro (nas anotações), legenda e capa. Vídeo a cliente grava.

## Tabela de horários (padrão inicial, a cliente ajusta na Marca)

| Canal | Melhores janelas (horário de Brasília) |
| --- | --- |
| Instagram | ter a qui 11h–13h e 18h–20h; sáb 10h–12h |
| TikTok | seg a sex 12h–14h e 19h–22h; dom 17h–20h |
| LinkedIn | ter a qui 8h–10h e 12h; nunca fim de semana |
| Facebook | qua a sex 13h–16h |
| YouTube | qui a sáb 15h–18h; shorts como TikTok |

Fica em `marca/guia` no campo novo `horarios` (texto livre por canal) para a cliente editar. Depois, com métricas conectadas, o agente aprende dos números reais.

## Checklist de amanhã, na ordem

1. [ ] **Chave da API**: cliente cria em console.anthropic.com com contato@abluezone.com.br, cartão, limite mensal (R$ 100). Sarah recebe a chave e roda `firebase functions:secrets:set ANTHROPIC_API_KEY` (a chave não passa pelo Claude nem pelo repositório).
2. [ ] `firebase login` válido no Mac (a sessão expira em ~1 dia) e `firebase init functions` (TypeScript, Node 22) em `functions/`.
3. [ ] **Marca**: campo `horarios` na tela e nas regras (`validBrand`), com o padrão acima pré-preenchido no primeiro salvamento.
4. [ ] **Function `gerarPosts`** (`functions/src/gerarPosts.ts`): auth + papel, montagem do contexto, chamada à Claude com SDK `@anthropic-ai/sdk`, structured output, limite de 10 posts por pedido, registro de uso (`usage`) num documento `uso/gerarPosts` para acompanhar custo. Erros claros para o painel (sem chave, sem cota, pedido vazio).
5. [ ] **Regras**: coleção `uso` (só admin lê); nada muda em `conteudos` (o painel grava como hoje).
6. [ ] **Painel**: campo "pedir posts" no topo de Publicar (`PedirPosts.tsx`): pedido, canais, janela de datas, botão gerar, estado "gerando…", lista do que foi criado com o motivo de cada data. Lâminas geradas no navegador a partir de `slides`. Tudo em rascunho.
7. [ ] **Hoje**: pendência "posts gerados esperando aprovação" já cai no item existente de rascunhos.
8. [ ] **Testes**: unitário do montador de contexto e do validador da resposta; teste manual com 3 pedidos (um carrossel, uma semana, uma notícia virando posts) conferindo tom, horários e distribuição.
9. [ ] **Segurança**: revisar que a Function só aceita usuário logado da equipe, que o pedido é limitado e higienizado, que a chave só existe no Secret Manager, que o CSP do painel libera `cloudfunctions.net`/`run.app` da região. Log sem dados pessoais.
10. [ ] Deploy: `firebase deploy --only functions,firestore:rules` e `npm run deploy:painel`. README, MEMORIA e ARQUITETURA atualizados.

## Fora do escopo desta etapa

Publicação automática nas redes, agendamento por horário (o horário é sugestão no calendário), geração de vídeo ou de foto, Meta Ads e Google Ads, fila com agente local.

## Depois desta etapa (para lembrar)

- Botão "gerar de novo" num post existente com instrução de ajuste ("mais curto", "sem emoji").
- Notícia da BlueNews gerada pelo mesmo caminho (pedido + fontes da Marca), entrando como rascunho na BlueNews.
- Campanhas e Clientes (etapa 4), Meta Ads e Google Ads (etapa 5).
