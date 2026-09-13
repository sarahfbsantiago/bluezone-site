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
  },
  // Resposta automatica para quem escreveu (ver Resposta.gs).
  reply: function () {
    return {
      subject: "Recebemos seu contato - Blueprint",
      kicker: "Blueprint - curso da Bluezone",
      intro: "Recebemos seu interesse no Blueprint, o guia pr\u00e1tico da Bluezone para parar de postar no escuro. Em breve entramos em contato com novidades e condi\u00e7\u00f5es. Se quiser garantir o acesso agora, a p\u00e1gina do curso est\u00e1 aberta.",
      introHtml: "Recebemos seu interesse no <strong>Blueprint</strong>, o guia pr&aacute;tico da Bluezone para parar de postar no escuro. Em breve entramos em contato com novidades e condi&ccedil;&otilde;es. Se quiser garantir o acesso agora, a p&aacute;gina do curso est&aacute; aberta.",
      ctaTexto: "conhecer o Blueprint",
      ctaLink: "https://abluezone.com.br/blueprint",
      ctaCor: "#ff8a2a"
    };
  }
};
