# Formulários do site → Google Apps Script

Os quatro formulários do site (contato, inscrição e contato da BlueNews, pop-up do Blueprint) enviam um POST em JSON para um único Web App do Apps Script, que roda na conta **contato@abluezone.com.br** e está ligado à planilha **Bluezone - contatos**. Para cada envio o script:

1. valida e limpa os campos, aplica o limite de envios;
2. grava uma linha na aba da origem;
3. manda um **aviso** para contato@ com assunto por origem;
4. manda a **resposta automática** para a pessoa, de `noreply@abluezone.com.br`, com texto por origem, botão do WhatsApp e assinatura.

| Formulário | `source` enviado pelo site | Aba | Assunto do aviso | Resposta automática |
| --- | --- | --- | --- | --- |
| Site, seção contato | `bluezone-site` | contatos | Novo contato pelo site Bluezone | Recebemos sua mensagem - Bluezone |
| BlueNews, quero ser avisado | `bluenews` | bluenews | Nova inscricao na BlueNews | Inscrição confirmada - BlueNews |
| BlueNews, contato do portal | `bluenews-contato` | bluenews | Contato pela BlueNews | Recebemos sua mensagem - BlueNews |
| Pop-up do Blueprint (home) | `popup-blueprint` | blueprint | Novo lead do pop-up Blueprint | Recebemos seu contato - Blueprint |

Origem desconhecida cai no formulário do site. Cada linha tem também **consentimento** (versão da política de privacidade + o que a pessoa marcou: novidades, anúncios) e **campanha** (utm, gclid, fbclid do link que trouxe a pessoa; vazio = visita direta). Abas antigas ganham os cabeçalhos novos sozinhas. Erros da resposta automática ficam na aba **log** da planilha (data, onde, erro).

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `Config.gs` | e-mail que recebe os avisos, modo no-reply, limites |
| `Bluezone.gs`, `Bluenews.gs`, `Blueprint.gs` | um por formulário: origens, aba, assunto, corpo do aviso e `reply()` com o texto da resposta |
| `Main.gs` | `doPost` (recebe, valida, grava, avisa, responde) e `doGet` (ping) |
| `Util.gs` | limite de envios, abas, limpeza, anti-fórmula, `logErro` |
| `Resposta.gs` | monta e envia a resposta automática; `testarResposta` para diagnóstico |
| `CODIGOS-ATUAIS.md` | os sete arquivos acima em blocos prontos para colar; gerado por `npm run apps-script:bundle` |

Para um formulário novo: crie um arquivo no molde de `Bluezone.gs` e inclua o objeto em `formularios()` no `Main.gs`.

## Atualizar o script (sempre que um .gs mudar)

1. Rode `npm run apps-script:bundle` e abra `CODIGOS-ATUAIS.md`.
2. No editor do Apps Script (Extensões → Apps Script na planilha, logada em contato@), para **cada** arquivo: apague tudo e cole o bloco de mesmo nome. Cole os sete; misturar versões foi o que deixou a resposta automática muda em setembro de 2026.
3. Em `Resposta.gs`, ponha o seu e-mail pessoal em `TESTE_EMAIL`, salve e rode **Executar → testarResposta**. Autorize com contato@ se o Google pedir. O Registro de execução mostra a conta que executou, se a cota diminuiu (prova de que o envio saiu) e acusa se algum arquivo ficou na versão antiga.
4. **Implantar → Gerenciar implantações → lápis → Versão: Nova versão → Implantar.** A URL não muda; o site não precisa de deploy. Nunca crie "Nova implantação" para atualizar (isso gera outra URL).
5. Teste de ponta a ponta com o seu e-mail, um envio por formulário, com 90 s de intervalo entre envios do mesmo e-mail (limite do script). Deve chegar 1 linha, 1 aviso e 1 confirmação por envio.

## Instalar do zero (só se a planilha ou o script forem recriados)

1. Logada em contato@abluezone.com.br, crie a planilha **Bluezone - contatos** (as abas são criadas pelo script).
2. Extensões → Apps Script. Crie os sete arquivos com os nomes da tabela acima e cole os blocos de `CODIGOS-ATUAIS.md`. Nomeie o projeto "Bluezone formularios".
3. Implantar → Nova implantação → App da Web: executar como **Eu**, acesso **Qualquer pessoa**. Autorize com contato@. Copie a URL que termina em `/exec`.
4. Coloque a URL em `VITE_CONTACT_ENDPOINT` no `.env` local e na variável de mesmo nome do repositório no GitHub, e faça o deploy do site.
5. No Admin do Workspace, o usuário contato@ precisa ter o e-mail alternativo **noreply** (Diretório → Usuários → contato@ → E-mails alternativos). Sem ele, o remetente no-reply não existe e a entrega é recusada.

## Teste rápido pelo terminal

```
curl -sL -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"source":"bluezone-site","name":"Teste","email":"voce@exemplo.com","phone":"31993341543","message":"Mensagem de teste com mais de dez caracteres."}' \
  "$(grep VITE_CONTACT_ENDPOINT .env | cut -d= -f2-)"
```

Respostas: `{"ok":true}`; `{"ok":false,"error":"invalid"}` para campos inválidos; `rate_limited` se repetir o mesmo e-mail em menos de 90 s. `curl -sL <url>` sem corpo responde `{"ok":true,"service":"bluezone-contact"}`.

## Entrega da resposta automática

- MX, SPF e DKIM do domínio apontam para o Google. Falta o **DMARC**: criar no Registro.br o TXT `_dmarc.abluezone.com.br` com `v=DMARC1; p=none; rua=mailto:contato@abluezone.com.br`.
- O domínio é novo (setembro de 2026). Nos primeiros dias o Gmail pode recusar com "message blocked" por reputação baixa do domínio; isso melhora com envios normais e DMARC no ar. Se persistir, enxugar a resposta (menos links, sem GIF).
- E-mails do MailApp não aparecem em "Enviados" do contato@; é o comportamento normal.

## Segurança no script

- `clean` remove caracteres de controle e limita tamanho; `isEmail` e `formatPhone` validam; corpo acima de 12 KB é rejeitado.
- `safeCell` prefixa com apóstrofo valores que começam com `=`, `+`, `-` ou `@`, evitando injeção de fórmula na planilha.
- `allow` limita a 30 envios por hora no total e 1 a cada 90 s por e-mail (ajuste em `CONFIG`).
- A mensagem que a pessoa escreveu não é repetida na resposta automática, para o formulário não virar meio de mandar spam em nosso nome.
- Cota de e-mail do Apps Script no Workspace: cerca de 1.500 por dia (2 por envio).
