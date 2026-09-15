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
