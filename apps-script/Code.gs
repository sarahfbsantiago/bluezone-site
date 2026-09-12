// Bluezone - receptor do formulario de contato (Google Apps Script, Web App).
// Grava cada mensagem na aba "contatos" da planilha e envia um e-mail de aviso.
// Seguranca: valida e sanitiza campos, neutraliza formulas no Sheets e limita envios no servidor.

var CONFIG = {
  to: "dmarketingevendas@gmail.com",
  sheetName: "contatos",
  subject: "Novo contato pelo site Bluezone",
  subjectNews: "Nova inscricao na BlueNews",
  subjectPopup: "Novo lead do pop-up Blueprint",
  maxLength: 4000,
  maxPerHour: 30,        // limite global de envios por hora
  perEmailSeconds: 90    // intervalo minimo entre envios do mesmo e-mail
};

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    if (raw.length > 12000) return respond({ ok: false, error: "invalid" });
    var body = JSON.parse(raw);
    var name = clean(body.name, 120);
    var email = clean(body.email, 200).toLowerCase();
    var phone = formatPhone(body.phone);
    var message = clean(body.message, CONFIG.maxLength);
    if (!name || !isEmail(email) || !phone || message.length < 10) {
      return respond({ ok: false, error: "invalid" });
    }
    if (!allow(email)) return respond({ ok: false, error: "rate_limited" });

    var source = clean(body.source, 60);
    var sheet = getSheet();
    sheet.appendRow([new Date(), safeCell(name), safeCell(email), safeCell(phone), safeCell(message), safeCell(source)]);

    var nl = String.fromCharCode(10);
    MailApp.sendEmail({
      to: CONFIG.to,
      replyTo: email,
      subject: (source === "bluenews" ? CONFIG.subjectNews : source === "popup-blueprint" ? CONFIG.subjectPopup : CONFIG.subject) + " - " + name,
      body: "Nome: " + name + nl + "E-mail: " + email + nl + "Telefone: " + phone + nl + nl + message
    });
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: "server" });
  }
}

function doGet() {
  return respond({ ok: true, service: "bluezone-contact" });
}

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

function getSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
    sheet.appendRow(["data", "nome", "e-mail", "telefone", "mensagem", "origem"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
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

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
