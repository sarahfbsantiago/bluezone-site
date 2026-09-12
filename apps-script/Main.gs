// Bluezone - RECEPTOR (Main.gs)
// Recebe o envio do site (POST em JSON), descobre o formulario pela origem, grava na aba dele e envia o aviso por e-mail.
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
      message: clean(body.message, CONFIG.maxLength)
    };
    if (!d.name || !isEmail(d.email) || !d.phone || d.message.length < form.minMessage) {
      return respond({ ok: false, error: "invalid" });
    }
    if (!allow(d.email)) return respond({ ok: false, error: "rate_limited" });

    getSheet(form.sheet).appendRow([new Date(), safeCell(d.name), safeCell(d.email), safeCell(d.phone), safeCell(d.message), safeCell(source)]);

    var subject = form.subjectFor ? form.subjectFor(source) : form.subject;
    MailApp.sendEmail({ to: CONFIG.to, replyTo: d.email, subject: subject + " - " + d.name, body: form.body(d) });
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: "server" });
  }
}

function doGet() {
  return respond({ ok: true, service: "bluezone-contact" });
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
