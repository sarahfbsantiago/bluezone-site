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
