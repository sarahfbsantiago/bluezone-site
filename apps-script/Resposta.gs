// Bluezone - RESPOSTA AUTOMATICA (Resposta.gs)
// Depois de gravar na planilha, envia para a pessoa um e-mail "recebemos sua mensagem" como noreply@abluezone.com.br,
// com botao do WhatsApp e a assinatura animada da Bluezone. O texto de cada formulario fica em reply() no arquivo dele.
// A mensagem que a pessoa escreveu NAO e repetida no e-mail (evita uso do formulario para mandar spam em nosso nome).

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
  var opcoes = { name: RESPOSTA.nome, htmlBody: html, noReply: true };
  try {
    GmailApp.sendEmail(d.email, r.subject, texto, opcoes);
  } catch (error) {
    // Se a conta nao permitir noReply, envia do proprio contato@ pedindo para nao responder.
    delete opcoes.noReply;
    opcoes.replyTo = CONFIG.to;
    GmailApp.sendEmail(d.email, r.subject, texto, opcoes);
  }
}

function montarTexto(primeiro, r) {
  var nl = String.fromCharCode(10);
  var linhas = ["Oi" + (primeiro ? ", " + primeiro : "") + "!", "", r.intro, ""];
  if (r.ctaTexto && r.ctaLink) linhas.push(r.ctaTexto + ": " + r.ctaLink, "");
  linhas.push("Se preferir falar agora, chame a gente no WhatsApp: " + RESPOSTA.whatsapp, "");
  linhas.push("At\u00e9 j\u00e1,", "Time Bluezone", RESPOSTA.site + " - @abluezone", "", "Este e-mail \u00e9 autom\u00e1tico. Para falar com a gente, use o WhatsApp ou " + CONFIG.to + ".");
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
    '<p style="margin:18px 0 0;font-size:10.5px;line-height:1.6;color:#9aa8bb;">Este e-mail &eacute; autom&aacute;tico e n&atilde;o recebe respostas. Para falar com a gente, use o WhatsApp ou ' + CONFIG.to + '.</p>' +
    '</td></tr></table></div>';
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
