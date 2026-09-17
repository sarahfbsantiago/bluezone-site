/** Área ainda não construída: título, o que ela vai fazer e como isso é feito hoje. */
export function Scaffold({ title, intro, items, today }: { title: string; intro: string; items: string[]; today?: string }) {
  return (
    <section className="admin-list">
      <div className="admin-toolbar"><h1 className="solution-title">{title}</h1><span className="admin-soon">em construção</span></div>
      <p className="admin-note">{intro}</p>
      <ul className="adm-plan" aria-label="O que vai ter">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {today && <p className="admin-note adm-today"><strong>hoje:</strong> {today}</p>}
    </section>
  )
}

export const PUBLICAR = {
  title: 'Publicar',
  intro: 'O calendário de conteúdo da Bluezone, com todos os canais no mesmo lugar: Instagram, TikTok, YouTube, Facebook e LinkedIn.',
  items: [
    'calendário mensal com um cartão por post, com a prévia do jeito de cada rede',
    'cada post com canal, formato, tema, legenda, hashtags, mídia, data e status: ideia, rascunho, aprovado, postado',
    'geração de legenda e lâminas a partir de um tema, seguindo o guia da marca',
    'botão "baixar tudo" para postar pelo celular; publicação direta depois, canal por canal',
  ],
  today: 'os posts são criados e aprovados fora do painel e postados à mão.',
}

export const CAMPANHAS = {
  title: 'Campanhas',
  intro: 'Toda campanha, paga ou orgânica, com um link rastreável e os leads que ela trouxe. Meta Ads e Google Ads entram aqui como fonte de números.',
  items: [
    'registro da campanha: plataforma, objetivo, período, verba e link com utm gerado na hora',
    'leads e vendas que chegaram por aquela campanha, ao lado do gasto',
    'leitura automática de gasto, alcance, cliques e conversões do Meta Ads e do Google Ads',
    '"impulsionar" um post aprovado direto do calendário',
  ],
  today: 'as campanhas são criadas nos gerenciadores do Meta e do Google; os leads já chegam com a origem na planilha.',
}

export const CLIENTES = {
  title: 'Clientes',
  intro: 'Do lead ao cliente: quem chegou pelos formulários, por onde chegou e em que ponto da conversa está.',
  items: [
    'lista de leads com origem, campanha, consentimento e data, vinda da planilha de contatos',
    'funil: novo, em conversa, proposta, fechado, perdido, com anotações',
    'vendas do Blueprint por pessoa, depois direto da Kiwify',
    'pendências: quem está sem resposta há mais de um dia útil',
  ],
  today: 'os leads chegam por e-mail em contato@ e ficam na planilha "Bluezone - contatos".',
}

export const MARCA = {
  title: 'Marca',
  intro: 'O que faz a geração de conteúdo acertar o tom: como a Bluezone fala, o que nunca diz, e exemplos do que ficou bom e do que ficou ruim.',
  items: [
    'guia de voz: tom, palavras que usamos, palavras que evitamos, chamadas para ação',
    'paleta, tipografia e moldes de imagem por canal',
    'exemplos aprovados e reprovados, com o motivo, para a geração aprender com as correções',
    'fontes de notícias da BlueNews por seção',
  ],
  today: 'o guia vive na cabeça da equipe; a primeira versão sai dos posts de referência que a cliente escolher.',
}
