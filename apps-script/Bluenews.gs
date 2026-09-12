// Bluezone - INSCRICAO NA BLUENEWS (Bluenews.gs)
// Origem enviada pelo site: "bluenews". Grava na aba "bluenews". Nao exige mensagem.

var BLUENEWS = {
  sources: ["bluenews"],
  sheet: "bluenews",
  subject: "Nova inscricao na BlueNews",
  minMessage: 0,
  body: function (d) {
    var nl = String.fromCharCode(10);
    return "Nova inscricao na newsletter BlueNews." + nl + nl +
      "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone;
  }
};
