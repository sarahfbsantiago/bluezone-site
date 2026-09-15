# Apps Script — códigos atuais para colar

Gerado em 15/09/2026 por `npm run apps-script:bundle` a partir de `apps-script/*.gs`. Não edite aqui: edite os .gs e gere de novo.

No editor do Apps Script (conta contato@abluezone.com.br), para **cada** arquivo abaixo: abra o arquivo de mesmo nome, apague tudo e cole o bloco inteiro. Depois: `TESTE_EMAIL` em Resposta.gs → Executar `testarResposta` → ler o Registro de execução → Implantar > Gerenciar implantações > lápis > Nova versão. Passo a passo completo em `apps-script/README.md`.

Arquivos do projeto: `Config`, `Bluezone`, `Bluenews`, `Blueprint`, `Main`, `Util`, `Resposta`.


## Config.gs

```javascript
// Bluezone - CONFIGURACAO GERAL (Config.gs)
// E-mail que recebe os avisos e limites de seguranca. O que e especifico de cada formulario fica no arquivo dele.

var CONFIG = {
  to: "contato@abluezone.com.br",   // quem recebe os avisos
  // Resposta automatica sai de noreply@abluezone.com.br (modo no-reply do Workspace). Para o endereco existir e a entrega
  // nao ser barrada, crie o alias no Admin do Workspace: Usuarios > contato@ > E-mails alternativos > noreply. false = sai de contato@.
  noReply: true,
  maxLength: 4000,                  // tamanho maximo da mensagem
  maxPerHour: 30,                   // limite global de envios por hora
  perEmailSeconds: 90               // intervalo minimo entre envios do mesmo e-mail
};
```


## Bluezone.gs

```javascript
// Bluezone - FORMULARIO "ENTRE EM CONTATO" DO SITE (Bluezone.gs)
// Origem enviada pelo site: "bluezone-site". Grava na aba "contatos".

var BLUEZONE = {
  sources: ["bluezone-site"],
  sheet: "contatos",
  subject: "Novo contato pelo site Bluezone",
  minMessage: 10,
  body: function (d) {
    var nl = String.fromCharCode(10);
    return "Novo contato pelo formulario do site." + nl + nl +
      "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone + nl + nl +
      "Mensagem:" + nl + d.message;
  },
  // Resposta automatica para quem escreveu (ver Resposta.gs).
  reply: function () {
    return {
      subject: "Recebemos sua mensagem - Bluezone",
      kicker: "Bluezone - contato",
      intro: "Sua mensagem chegou aqui na Bluezone. Vamos ler com aten\u00e7\u00e3o e responder em at\u00e9 1 dia \u00fatil.",
      introHtml: "Sua mensagem chegou aqui na Bluezone. Vamos ler com aten&ccedil;&atilde;o e responder em at&eacute; <strong>1 dia &uacute;til</strong>."
    };
  }
};
```


## Bluenews.gs

```javascript
// Bluezone - BLUENEWS (Bluenews.gs)
// Origens enviadas pelo site: "bluenews" (inscricao na newsletter) e "bluenews-contato" (formulario de contato do portal).
// Grava na aba "bluenews". A inscricao nao exige mensagem; o contato exige.

var BLUENEWS = {
  sources: ["bluenews", "bluenews-contato"],
  sheet: "bluenews",
  minMessage: 0,
  subjectFor: function (source) {
    return source === "bluenews-contato" ? "Contato pela BlueNews" : "Nova inscricao na BlueNews";
  },
  body: function (d) {
    var nl = String.fromCharCode(10);
    if (d.source === "bluenews-contato") {
      return "Contato pelo portal BlueNews." + nl + nl +
        "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone + nl + nl +
        "Mensagem:" + nl + d.message;
    }
    return "Nova inscricao na newsletter BlueNews." + nl + nl +
      "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone;
  },
  // Resposta automatica para quem escreveu (ver Resposta.gs).
  reply: function (source) {
    if (source === "bluenews-contato") {
      return {
        subject: "Recebemos sua mensagem - BlueNews",
        kicker: "BlueNews - contato",
        intro: "Sua mensagem chegou pela BlueNews. Vamos ler com aten\u00e7\u00e3o e responder em at\u00e9 1 dia \u00fatil.",
        introHtml: "Sua mensagem chegou pela BlueNews. Vamos ler com aten&ccedil;&atilde;o e responder em at&eacute; <strong>1 dia &uacute;til</strong>."
      };
    }
    return {
      subject: "Inscri\u00e7\u00e3o confirmada - BlueNews",
      kicker: "BlueNews - newsletter",
      intro: "Voc\u00ea est\u00e1 na lista da BlueNews: not\u00edcias, ideias e oportunidades para quem empreende, direto no seu e-mail.",
      introHtml: "Voc&ecirc; est&aacute; na lista da <strong>BlueNews</strong>: not&iacute;cias, ideias e oportunidades para quem empreende, direto no seu e-mail.",
      ctaTexto: "ler a BlueNews",
      ctaLink: "https://abluezone.com.br/bluenews",
      ctaCor: "#10243a"
    };
  }
};
```


## Blueprint.gs

```javascript
// Bluezone - BLUEPRINT (Blueprint.gs)
// Origens enviadas pelo site: "popup-blueprint" (pop-up da home) e "blueprint" (formulario na pagina do curso, quando existir).
// Grava na aba "blueprint". Nao exige mensagem.

var BLUEPRINT = {
  sources: ["popup-blueprint", "blueprint"],
  sheet: "blueprint",
  minMessage: 0,
  subjectFor: function (source) {
    return source === "popup-blueprint" ? "Novo lead do pop-up Blueprint" : "Novo contato pela pagina do Blueprint";
  },
  body: function (d) {
    var nl = String.fromCharCode(10);
    return "Interesse no Blueprint (" + (d.source === "popup-blueprint" ? "pop-up do site" : "pagina do curso") + ")." + nl + nl +
      "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone + (d.message ? nl + nl + d.message : "");
  },
  // Resposta automatica para quem escreveu (ver Resposta.gs).
  reply: function () {
    return {
      subject: "Recebemos seu contato - Blueprint",
      kicker: "Blueprint - curso da Bluezone",
      intro: "Recebemos seu interesse no Blueprint, o guia pr\u00e1tico da Bluezone para parar de postar no escuro. Em breve entramos em contato com novidades e condi\u00e7\u00f5es. Se quiser garantir o acesso agora, a p\u00e1gina do curso est\u00e1 aberta.",
      introHtml: "Recebemos seu interesse no <strong>Blueprint</strong>, o guia pr&aacute;tico da Bluezone para parar de postar no escuro. Em breve entramos em contato com novidades e condi&ccedil;&otilde;es. Se quiser garantir o acesso agora, a p&aacute;gina do curso est&aacute; aberta.",
      ctaTexto: "conhecer o Blueprint",
      ctaLink: "https://abluezone.com.br/blueprint",
      ctaCor: "#ff8a2a"
    };
  }
};
```


## Main.gs

```javascript
// Bluezone - RECEPTOR (Main.gs)
// Recebe o envio do site (POST em JSON), descobre o formulario pela origem, grava na aba dele, envia o aviso por e-mail
// e manda a resposta automatica para a pessoa (Resposta.gs).
// Para criar um formulario novo: crie um arquivo como Bluezone.gs/Bluenews.gs/Blueprint.gs e inclua o objeto dele em formularios().

function formularios() {
  return [BLUEZONE, BLUENEWS, BLUEPRINT];
}

function formularioPara(source) {
  var lista = formularios();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].sources.indexOf(source) !== -1) return lista[i];
  }
  return BLUEZONE; // origem desconhecida cai no contato do site
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    if (raw.length > 12000) return respond({ ok: false, error: "invalid" });
    var body = JSON.parse(raw);

    var source = clean(body.source, 60);
    var form = formularioPara(source);

    var d = {
      source: source,
      name: clean(body.name, 120),
      email: clean(body.email, 200).toLowerCase(),
      phone: formatPhone(body.phone),
      message: clean(body.message, CONFIG.maxLength),
      consent: clean(body.consent, 200),   // versao da politica + o que a pessoa marcou (LGPD)
      campaign: clean(body.campaign, 300)  // utm/gclid/fbclid do link que trouxe a pessoa
    };
    var minMessage = source === "bluenews-contato" ? 10 : form.minMessage;
    if (!d.name || !isEmail(d.email) || !d.phone || d.message.length < minMessage) {
      return respond({ ok: false, error: "invalid" });
    }
    if (!allow(d.email)) return respond({ ok: false, error: "rate_limited" });

    getSheet(form.sheet).appendRow([new Date(), safeCell(d.name), safeCell(d.email), safeCell(d.phone), safeCell(d.message), safeCell(source), safeCell(d.consent), safeCell(d.campaign)]);

    var subject = form.subjectFor ? form.subjectFor(source) : form.subject;
    MailApp.sendEmail({ to: CONFIG.to, replyTo: d.email, subject: subject + " - " + d.name, body: form.body(d) });
    // A resposta automatica nunca derruba o registro: se falhar, fica anotada na aba "log" da planilha.
    try { enviarConfirmacao(d, form); } catch (error) { logErro("resposta " + source + " -> " + d.email, error); }
    return respond({ ok: true });
  } catch (error) {
    logErro("doPost", error);
    return respond({ ok: false, error: "server" });
  }
}

function doGet() {
  return respond({ ok: true, service: "bluezone-contact" });
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
```


## Util.gs

```javascript
// Bluezone - APOIO E SEGURANCA (Util.gs)
// Limpeza de campos, protecao contra formulas no Sheets, limite de envios e acesso as abas.

// Limite de envios no servidor: global por hora e por e-mail. Usa cache e lock para evitar corrida.
function allow(email) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return false;
  try {
    var cache = CacheService.getScriptCache();
    var hourKey = "rl:hour";
    var count = Number(cache.get(hourKey) || 0);
    if (count >= CONFIG.maxPerHour) return false;
    var emailKey = "rl:email:" + Utilities.base64EncodeWebSafe(email).slice(0, 80);
    if (cache.get(emailKey)) return false;
    cache.put(hourKey, String(count + 1), 3600);
    cache.put(emailKey, "1", CONFIG.perEmailSeconds);
    return true;
  } finally {
    lock.releaseLock();
  }
}

// Uma aba por caminho; cria a aba com cabecalho na primeira vez e completa colunas novas em abas antigas.
var CABECALHO = ["data", "nome", "e-mail", "telefone", "mensagem", "origem", "consentimento", "campanha"];
function getSheet(name) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(CABECALHO);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var atual = sheet.getRange(1, 1, 1, CABECALHO.length).getValues()[0];
  for (var i = 0; i < CABECALHO.length; i++) {
    if (!atual[i]) sheet.getRange(1, i + 1).setValue(CABECALHO[i]);
  }
  return sheet;
}

// Anota um erro na aba "log" (data, onde, erro). Nunca lanca: e chamada de dentro de catch.
function logErro(onde, error) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("log");
    if (!sheet) {
      sheet = spreadsheet.insertSheet("log");
      sheet.appendRow(["data", "onde", "erro"]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date(), safeCell(onde), safeCell(String(error && error.message ? error.message : error))]);
  } catch (ignored) { /* sem planilha nao ha onde anotar */ }
}

// Remove quebras de linha, tabulacoes e caracteres de controle; limita o tamanho.
function clean(value, max) {
  var s = String(value || "");
  var out = "";
  for (var i = 0; i < s.length; i++) {
    var code = s.charCodeAt(i);
    out += (code < 32 || code === 127) ? " " : s.charAt(i);
  }
  return out.replace(/\s+/g, " ").trim().slice(0, max);
}

// Impede que o Sheets interprete o valor como formula (=, +, -, @ no inicio).
function safeCell(value) {
  var s = String(value || "");
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isEmail(value) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value);
}

function formatPhone(value) {
  var d = String(value || "").replace(/\D/g, "");
  if (d.length !== 10 && d.length !== 11) return "";
  if (d.charAt(0) === "0" || d.charAt(1) === "0") return "";
  var ddd = d.slice(0, 2);
  var rest = d.slice(2);
  var split = rest.length === 9 ? 5 : 4;
  return "(" + ddd + ") " + rest.slice(0, split) + "-" + rest.slice(split);
}
```


## Resposta.gs

```javascript
// Bluezone - RESPOSTA AUTOMATICA (Resposta.gs)
// Depois de gravar na planilha, envia para a pessoa um e-mail "recebemos sua mensagem" a partir de contato@ (nome "Bluezone"),
// com botao do WhatsApp e a assinatura animada da Bluezone. O texto de cada formulario fica em reply() no arquivo dele.
// Remetente: com CONFIG.noReply = true sai de noreply@abluezone.com.br (modo no-reply do Workspace; o alias precisa existir no
// Admin, senao o endereco e "inexistente" e a entrega e barrada/filtrada). Com false sai de contato@ com reply-to em contato@.
// A mensagem que a pessoa escreveu NAO e repetida no e-mail (evita uso do formulario para mandar spam em nosso nome).
//
// Envio pelo MailApp (o mesmo servico que manda o aviso para contato@ e que comprovadamente entrega), e nao pelo GmailApp:
// o GmailApp exige uma permissao extra (Gmail) que a implantacao do app da Web so ganha se for reautorizada; sem isso o envio
// falhava em silencio dentro do doPost. O MailApp usa a permissao que a implantacao ja tem. Diferenca visivel: e-mails do MailApp
// NAO aparecem em "Enviados" do contato@ (e normal); a copia fica na aba "log" da planilha quando algo da errado.

var RESPOSTA = {
  nome: "Bluezone",
  site: "https://abluezone.com.br",
  whatsapp: "https://wa.me/5531993341543",
  whatsappTexto: "(31) 99334-1543",
  instagram: "https://www.instagram.com/abluezone/",
  gif: "https://abluezone.com.br/midia/assinatura-bluezone.gif"
};

function enviarConfirmacao(d, form) {
  var r = form.reply ? form.reply(d.source) : null;
  if (!r) return;
  var primeiro = (d.name || "").split(" ")[0];
  var texto = montarTexto(primeiro, r);
  var html = montarHtml(primeiro, r);
  var msg = { to: d.email, subject: r.subject, body: texto, htmlBody: html, name: RESPOSTA.nome };
  if (CONFIG.noReply) msg.noReply = true; else msg.replyTo = CONFIG.to;
  MailApp.sendEmail(msg);
}

// Rodape: no modo no-reply pede para nao responder; caso contrario convida a responder.
function avisoAutomatico(html) {
  if (CONFIG.noReply) {
    return html
      ? "Este e-mail &eacute; autom&aacute;tico e n&atilde;o recebe respostas. Para falar com a gente, use o WhatsApp ou " + CONFIG.to + "."
      : "Este e-mail \u00e9 autom\u00e1tico e n\u00e3o recebe respostas. Para falar com a gente, use o WhatsApp ou " + CONFIG.to + ".";
  }
  return html
    ? "Este e-mail &eacute; autom&aacute;tico. Se quiser, responda por aqui mesmo ou chame no WhatsApp."
    : "Este e-mail \u00e9 autom\u00e1tico. Se quiser, responda por aqui mesmo ou chame no WhatsApp.";
}

function montarTexto(primeiro, r) {
  var nl = String.fromCharCode(10);
  var linhas = ["Oi" + (primeiro ? ", " + primeiro : "") + "!", "", r.intro, ""];
  if (r.ctaTexto && r.ctaLink) linhas.push(r.ctaTexto + ": " + r.ctaLink, "");
  linhas.push("Se preferir falar agora, chame a gente no WhatsApp: " + RESPOSTA.whatsapp, "");
  linhas.push("At\u00e9 j\u00e1,", "Time Bluezone", RESPOSTA.site + " - @abluezone", "", avisoAutomatico(false));
  return linhas.join(nl);
}

function montarHtml(primeiro, r) {
  var azul = "#1f6dff";
  var botao = function (texto, link, cor) {
    return '<a href="' + link + '" target="_blank" style="display:inline-block;padding:12px 22px;border-radius:999px;background:' + cor + ';color:#ffffff;font-weight:700;font-size:13px;letter-spacing:.04em;text-decoration:none;">' + texto + '</a>';
  };
  var cta = (r.ctaTexto && r.ctaLink) ? '<p style="margin:0 0 14px;">' + botao(r.ctaTexto, r.ctaLink, r.ctaCor || azul) + '</p>' : '';
  return '' +
    '<div style="margin:0;padding:28px 16px;background:#f4f7fb;font-family:\'IBM Plex Mono\',Menlo,Consolas,monospace;color:#10243a;">' +
    '<table cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:560px;width:100%;border-collapse:collapse;background:#ffffff;border-radius:18px;">' +
    '<tr><td style="padding:32px 32px 8px;">' +
    '<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#5b6b80;margin-bottom:18px;">' + r.kicker + '</div>' +
    '<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:#10243a;">Oi' + (primeiro ? ', ' + escapeHtml(primeiro) : '') + '!</h1>' +
    '<p style="margin:0 0 18px;font-size:14px;line-height:1.75;">' + r.introHtml + '</p>' +
    cta +
    '<p style="margin:0 0 6px;font-size:13px;line-height:1.7;color:#5b6b80;">Se preferir falar agora:</p>' +
    '<p style="margin:0 0 26px;">' + botao('falar no WhatsApp &rarr; ' + RESPOSTA.whatsappTexto, RESPOSTA.whatsapp, '#25d366') + '</p>' +
    '<p style="margin:0 0 24px;font-size:14px;line-height:1.7;">At&eacute; j&aacute;,<br /><strong>Time Bluezone</strong></p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 32px 30px;">' +
    '<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #e3e9f2;width:100%;"><tr>' +
    '<td style="padding:22px 18px 0 0;vertical-align:middle;width:220px;"><a href="' + RESPOSTA.site + '" target="_blank" style="text-decoration:none;"><img src="' + RESPOSTA.gif + '" width="220" height="75" alt="Bluezone - estrat&eacute;gia em movimento" style="display:block;border:0;width:220px;height:75px;border-radius:14px;" /></a></td>' +
    '<td style="padding:22px 0 0 18px;border-left:1px solid #c9d3e2;vertical-align:middle;">' +
    '<div style="font-size:13px;font-weight:700;letter-spacing:.04em;">Equipe Bluezone</div>' +
    '<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5b6b80;margin:3px 0 10px;">estrat&eacute;gia em movimento</div>' +
    '<div style="font-size:12px;line-height:1.9;">' +
    '<a href="' + RESPOSTA.whatsapp + '" target="_blank" style="color:' + azul + ';text-decoration:none;">WhatsApp: ' + RESPOSTA.whatsappTexto + '</a><br />' +
    '<a href="mailto:' + CONFIG.to + '" style="color:' + azul + ';text-decoration:none;">' + CONFIG.to + '</a><br />' +
    '<a href="' + RESPOSTA.site + '" target="_blank" style="color:' + azul + ';text-decoration:none;">abluezone.com.br</a>' +
    '<span style="color:#9aa8bb;">&nbsp;&middot;&nbsp;</span>' +
    '<a href="' + RESPOSTA.instagram + '" target="_blank" style="color:' + azul + ';text-decoration:none;">@abluezone</a>' +
    '</div></td></tr></table>' +
    '<p style="margin:18px 0 0;font-size:10.5px;line-height:1.6;color:#9aa8bb;">' + avisoAutomatico(true) + '</p>' +
    '</td></tr></table></div>';
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// TESTE: rode esta funcao no editor (Executar) e leia o "Registro de execucao".
// Envia uma confirmacao de exemplo para TESTE_EMAIL (troque abaixo pelo seu e-mail pessoal; vazio = contato@).
// O registro mostra a cota diaria de e-mails antes e depois: se a cota nao diminuir, nada foi enviado.
var TESTE_EMAIL = "";

function testarResposta() {
  var destino = TESTE_EMAIL || CONFIG.to;
  var antes = MailApp.getRemainingDailyQuota();
  Logger.log("Conta que executa: " + Session.getEffectiveUser().getEmail() + " | cota restante hoje: " + antes);
  if (antes < 1) throw new Error("Sem cota de e-mail hoje nesta conta (" + Session.getEffectiveUser().getEmail() + ").");
  var d = { source: "bluezone-site", name: "Teste Bluezone", email: destino };
  var form = formularioPara(d.source);
  if (!form.reply) throw new Error("Bluezone.gs/Bluenews.gs/Blueprint.gs estao na versao antiga (sem reply): cole os arquivos novos da pasta apps-script.");
  enviarConfirmacao(d, form);
  var depois = MailApp.getRemainingDailyQuota();
  Logger.log("Confirmacao enviada para " + destino + " | cota restante agora: " + depois + (depois < antes ? " (ok, o envio contou)" : " (ATENCAO: a cota nao mudou; o envio nao saiu)"));
}
```
