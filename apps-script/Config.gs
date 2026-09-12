// Bluezone - CONFIGURACAO (Config.gs)
// Tudo que se ajusta com frequencia fica aqui: e-mail de destino, limites e a tabela de caminhos (origens).

var CONFIG = {
  to: "contato@abluezone.com.br",   // quem recebe os avisos
  maxLength: 4000,                  // tamanho maximo da mensagem
  maxPerHour: 30,                   // limite global de envios por hora
  perEmailSeconds: 90               // intervalo minimo entre envios do mesmo e-mail
};

// Um caminho por origem enviada pelo site (campo "source").
// sheet = aba da planilha (criada sozinha) | subject = assunto do e-mail | minMessage = tamanho minimo da mensagem
var ORIGENS = {
  "bluezone-site":   { sheet: "contatos",  subject: "Novo contato pelo site Bluezone",          minMessage: 10 },
  "bluenews":        { sheet: "bluenews",  subject: "Nova inscricao na BlueNews",               minMessage: 0 },
  "popup-blueprint": { sheet: "blueprint", subject: "Novo lead do pop-up Blueprint",            minMessage: 0 },
  "blueprint":       { sheet: "blueprint", subject: "Novo contato pela pagina do Blueprint",    minMessage: 0 }
};

// Se chegar uma origem desconhecida, usa este caminho.
var ORIGEM_PADRAO = ORIGENS["bluezone-site"];
