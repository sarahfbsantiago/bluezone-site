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
  },
  // Resposta automatica para quem escreveu (ver Resposta.gs).
  reply: function (source) {
    if (source === "bluenews-contato") {
      return {
        subject: "Recebemos sua mensagem - BlueNews",
        kicker: "BlueNews - contato",
        intro: "Sua mensagem chegou pela BlueNews. Vamos ler com aten\u00e7\u00e3o e responder em at\u00e9 1 dia \u00fatil.",
        introHtml: "Sua mensagem chegou pela BlueNews. Vamos ler com aten&ccedil;&atilde;o e responder em at&eacute; <strong>1 dia &uacute;til</strong>."
      };
    }
    return {
      subject: "Inscri\u00e7\u00e3o confirmada - BlueNews",
      kicker: "BlueNews - newsletter",
      intro: "Voc\u00ea est\u00e1 na lista da BlueNews: not\u00edcias, ideias e oportunidades para quem empreende, direto no seu e-mail.",
      introHtml: "Voc&ecirc; est&aacute; na lista da <strong>BlueNews</strong>: not&iacute;cias, ideias e oportunidades para quem empreende, direto no seu e-mail.",
      ctaTexto: "ler a BlueNews",
      ctaLink: "https://abluezone.com.br/bluenews",
      ctaCor: "#10243a"
    };
  }
};
