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

// Uma aba por caminho; cria a aba com cabecalho na primeira vez.
function getSheet(name) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(["data", "nome", "e-mail", "telefone", "mensagem", "origem"]);
    sheet.setFrozenRows(1);
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
