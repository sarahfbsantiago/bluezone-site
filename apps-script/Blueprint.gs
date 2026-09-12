// Bluezone - BLUEPRINT (Blueprint.gs)
// Origens enviadas pelo site: "popup-blueprint" (pop-up da home) e "blueprint" (formulario na pagina do curso, quando existir).
// Grava na aba "blueprint". Nao exige mensagem.

var BLUEPRINT = {
  sources: ["popup-blueprint", "blueprint"],
  sheet: "blueprint",
  minMessage: 0,
  subjectFor: function (source) {
    return source === "popup-blueprint" ? "Novo lead do pop-up Blueprint" : "Novo contato pela pagina do Blueprint";
  },
  body: function (d) {
    var nl = String.fromCharCode(10);
    return "Interesse no Blueprint (" + (d.source === "popup-blueprint" ? "pop-up do site" : "pagina do curso") + ")." + nl + nl +
      "Nome: " + d.name + nl + "E-mail: " + d.email + nl + "Telefone: " + d.phone + (d.message ? nl + nl + d.message : "");
  }
};
