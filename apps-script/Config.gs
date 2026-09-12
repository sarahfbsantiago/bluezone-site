// Bluezone - CONFIGURACAO GERAL (Config.gs)
// E-mail que recebe os avisos e limites de seguranca. O que e especifico de cada formulario fica no arquivo dele.

var CONFIG = {
  to: "contato@abluezone.com.br",   // quem recebe os avisos
  maxLength: 4000,                  // tamanho maximo da mensagem
  maxPerHour: 30,                   // limite global de envios por hora
  perEmailSeconds: 90               // intervalo minimo entre envios do mesmo e-mail
};
