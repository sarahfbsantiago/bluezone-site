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
  }
};
