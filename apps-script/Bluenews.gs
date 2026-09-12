// Bluezone - BLUENEWS (Bluenews.gs)
// Origens enviadas pelo site: "bluenews" (inscricao na newsletter) e "bluenews-contato" (formulario de contato do portal).
// Grava na aba "bluenews". A inscricao nao exige mensagem; o contato exige.

var BLUENEWS = {
  sources: ["bluenews", "bluenews-contato"],
  sheet: "bluenews",
  minMessage: 0,
  subjectFor: function (source) {
    return source === "bluenews-contato" ? "Contato pela BlueNews" : "Nova inscricao na BlueNews";
  },
  body: function (d) {
    var nl = String.fromCharCode(10);
    if (d.source === "bluenews-contato") {
      return "Contato pelo portal BlueNews." + nl + nl +
        "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone + nl + nl +
        "Mensagem:" + nl + d.message;
    }
    return "Nova inscricao na newsletter BlueNews." + nl + nl +
      "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone;
  }
};
