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
