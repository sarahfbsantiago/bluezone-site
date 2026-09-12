> Versão atual: três arquivos (`Config.gs`, `Main.gs`, `Util.gs`). Passo a passo completo em `PASSO-A-PASSO.txt`. Para ajustar caminhos, e-mail e assuntos, edite só `Config.gs`.

# Formulário de contato → Google Apps Script

1. Logada em dmarketingevendas@gmail.com, crie uma planilha no Google Sheets chamada **Bluezone — contatos** (o nome é livre; o script cria a aba `contatos` sozinho).
2. Na planilha: **Extensões → Apps Script**. Apague o conteúdo e cole `Code.gs`.
3. `CONFIG.to` (em `Config.gs`) está com `contato@abluezone.com.br` (o e-mail que recebe os avisos). O script pode continuar na conta dmarketingevendas@gmail.com (dona da planilha); ele só envia o aviso para o contato@.
4. **Implantar → Nova implantação → App da Web**: executar como *Eu*, acesso *Qualquer pessoa*. Autorize e copie a **URL do Web App**.
5. No site, crie um arquivo `.env` na raiz do projeto com:

   ```
   VITE_CONTACT_ENDPOINT=https://script.google.com/macros/s/SEU_ID/exec
   ```

   (ou cole a URL em `src/features/home/config/siteConfig.ts`). Rode `npm run build` de novo.

Enquanto a URL não estiver configurada, o formulário avisa "envio ainda não configurado" e aponta para o WhatsApp.

Teste rápido no terminal:

```
curl -L -H 'Content-Type: text/plain' -d '{"name":"Teste","email":"teste@exemplo.com","phone":"31993341543","message":"Mensagem de teste com mais de dez caracteres."}' URL_DO_WEB_APP
```

## Segurança no script

- `safeCell` prefixa com apóstrofo valores que começam com `=`, `+`, `-` ou `@`, evitando injeção de fórmula ao abrir a planilha.
- `allow` limita a 30 envios por hora no total e 1 envio a cada 90 s por e-mail (ajuste em `CONFIG`). Quando bloqueia, responde `{"ok":false,"error":"rate_limited"}` e o site mostra a mensagem de erro com o WhatsApp.
- Cota do Gmail no Apps Script: cerca de 100 e-mails/dia em contas pessoais.

## Origem `bluenews` (inscrição na newsletter)

O formulário "quero ser avisado" da página `/bluenews` envia para o mesmo Web App, com `source: "bluenews"` e uma mensagem fixa. A linha cai na mesma aba `contatos`, coluna **origem** = `bluenews`. O script atual já grava isso sem mudança. A versão nova de `Code.gs` só troca o assunto do e-mail para "Nova inscricao na BlueNews" quando a origem for `bluenews`; para usar, cole o arquivo inteiro no editor, salve e faça **Implantar → Gerenciar implantações → editar → Nova versão**.
