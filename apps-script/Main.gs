// Bluezone - RECEPTOR (Main.gs)
// Recebe o envio do site (POST em JSON), escolhe o caminho pela origem, grava na aba certa e envia o aviso por e-mail.

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    if (raw.length > 12000) return respond({ ok: false, error: "invalid" });
    var body = JSON.parse(raw);

    var source = clean(body.source, 60);
    var origem = ORIGENS[source] || ORIGEM_PADRAO;

    var name = clean(body.name, 120);
    var email = clean(body.email, 200).toLowerCase();
    var phone = formatPhone(body.phone);
    var message = clean(body.message, CONFIG.maxLength);
    if (!name || !isEmail(email) || !phone || message.length < origem.minMessage) {
      return respond({ ok: false, error: "invalid" });
    }
    if (!allow(email)) return respond({ ok: false, error: "rate_limited" });

    getSheet(origem.sheet).appendRow([new Date(), safeCell(name), safeCell(email), safeCell(phone), safeCell(message), safeCell(source)]);
    sendNotice(origem, name, email, phone, message);
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: "server" });
  }
}

function doGet() {
  return respond({ ok: true, service: "bluezone-contact" });
}

function sendNotice(origem, name, email, phone, message) {
  var nl = String.fromCharCode(10);
  MailApp.sendEmail({
    to: CONFIG.to,
    replyTo: email,
    subject: origem.subject + " - " + name,
    body: "Nome: " + name + nl + "E-mail: " + email + nl + "Telefone: " + phone + nl + "Origem: " + origem.sheet + nl + nl + message
  });
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
