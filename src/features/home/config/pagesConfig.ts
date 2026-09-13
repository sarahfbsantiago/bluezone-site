/** Conteúdo das páginas que a rolagem revela depois do hero. */
export type TestimonialItem =
  | { type: 'quote'; name: string; service: string; photo: string; via: 'whatsapp' | ''; text: string }
  | { type: 'image' | 'video' | 'audio'; src: string; poster: string; alt: string; caption: string }

export const pages = {
  two: { id: 'page-two', label: '01 — marca', title: 'Transformamos pequenos e médios empreendedores em negócios e marcas preparadas para crescer' },
  three: {
    id: 'page-three',
    label: '03 — quem somos',
    /** Trechos entre ** viram negrito. */
    text: 'A **Bluezone** é uma assessoria de comunicação, estratégia e tecnologia para micro e pequenos negócios e profissionais autônomos.',
    paragraphs: [
      'Ajudamos empreendedores a transformar ideias, conhecimento e experiência em uma presença digital mais **clara, profissional e estratégica**. Unimos comunicação, posicionamento, conteúdo e tecnologia para criar soluções que façam sentido para cada negócio — sem complicação, sem fórmulas prontas e sem a necessidade de grandes estruturas. **Somos a estrutura estratégica por trás de quem quer crescer, mas não quer crescer no improviso.**',
    ],
  },
  four: {
    id: 'page-four',
    label: '04 — fundadores',
    lead: 'Quem faz a Blue.',
    title: 'Os fundadores contam por que a Bluezone existe.',
    /** Vídeo dos fundadores falando sobre a Blue (YouTube/Vimeo embed ou arquivo). Vazio = placeholder. */
    video: '',
  },
  /** História da Bluezone: as Zonas Azuis. Textos da cliente (12/09/2026); o último parágrafo, sobre os novos braços, foi redigido a pedido. */
  story: {
    id: 'historia',
    label: '02 — história',
    title: 'Você já ouviu falar nas "Zonas Azuis"?',
    paragraphs: [
      'São locais no mundo onde as pessoas não apenas vivem, mas prosperam por mais tempo, alcançando uma longevidade invejável. Nestes lugares, há um segredo, uma fórmula mágica para uma vida longa e saudável.',
      'Na Bluezone, nos inspiramos nessas **Zonas Azuis** para transformar o panorama empresarial de nossos clientes. Assim como essas regiões privilegiadas, buscamos trazer a longevidade para o mundo corporativo.',
    ],
    blocks: [
      {
        id: 'proposta-blue',
        kicker: 'proposta Blue!',
        paragraphs: [
          'Assim como os habitantes das Zonas Azuis valorizam seus hábitos saudáveis e sua comunidade, na Bluezone, priorizamos três pilares essenciais: **aprimoramento da experiência do cliente, acompanhamento contínuo e capacitação eficaz**. Esses elementos formam a base para uma jornada empresarial longeva e bem-sucedida.',
          'Nossas estratégias de "vendarketing" são como a dieta equilibrada das Zonas Azuis: moldamos a estrutura de marketing e vendas de nossos clientes em um ciclo completo 360°. Começamos ajustando perfis, fortalecendo o branding e posicionamento de marca, para depois direcionar uma abordagem abrangente de marketing digital. Capacitamos o cliente em vendas para que ele saiba receber bem essa demanda.',
        ],
      },
      {
        id: 'novos-bracos',
        kicker: 'e a história continua',
        paragraphs: [
          'Hoje a Bluezone está crescendo e criando novos braços: **inteligência artificial, tecnologia e produtos digitais** que colocam nas mãos do micro, pequeno e médio empreendedor ferramentas que antes só as grandes empresas tinham. A mesma ideia de longevidade, agora com mais alcance.',
        ],
      },
    ],
  },
  solutions: {
    id: 'solucoes',
    label: '05 — soluções',
    blocks: [
      {
        id: 'o-que-fazemos',
        kicker: 'o que fazemos',
        title: 'Comunicação, estratégia e tecnologia que trabalham juntas.',
        paragraphs: [
          'Criamos e estruturamos:',
        ],
        items: [
          { title: 'Posicionamento', text: 'Para deixar claro quem é o negócio, o que ele oferece e por que alguém deveria escolhê-lo.' },
          { title: 'Conteúdo', text: 'Para transformar conhecimento e experiência em comunicação relevante, consistente e alinhada à estratégia.' },
          { title: 'Direção', text: 'Para organizar prioridades, decisões e próximos passos — evitando que o empreendedor precise descobrir tudo sozinho.' },
          { title: 'Tecnologia', text: 'Para simplificar processos, ampliar possibilidades e colocar ferramentas digitais para trabalhar a favor do negócio.' },
        ],
        closing: [],
      },
      {
        id: 'como-fazemos',
        kicker: 'como fazemos',
        title: 'Clareza antes de execução.',
        paragraphs: [
          'Nossa abordagem combina quatro movimentos:',
        ],
        items: [
          { title: 'Entender.', text: 'Mergulhamos no contexto do negócio para identificar oportunidades e problemas reais.' },
          { title: 'Estruturar.', text: 'Organizamos posicionamento, comunicação, processos e prioridades.' },
          { title: 'Executar.', text: 'Transformamos estratégia em conteúdo, ferramentas e ações concretas.' },
          { title: 'Evoluir.', text: 'Acompanhamos o que funciona, aprendemos com os resultados e ajustamos a rota.' },
        ],
        closing: [],
      },
      {
        id: 'para-quem-fazemos',
        kicker: 'para quem fazemos',
        title: 'Para quem constrói um negócio de verdade.',
        paragraphs: [],
        items: [
          { title: '', text: 'Para quem faz muita coisa sozinho.' },
          { title: '', text: 'Para quem tem conhecimento, mas dificuldade em transformá-lo em conteúdo.' },
          { title: '', text: 'Para quem já tentou fazer de tudo nas redes, mas sente que falta direção.' },
          { title: '', text: 'Para quem cresceu e percebeu que improvisar já não é suficiente.' },
          { title: '', text: 'E para quem está começando e quer construir uma base sólida desde o início.' },
        ],
        closing: [],
      },
    ],
  },
  /** Tablet 3D entre "para quem fazemos" e "clientes": slideshow com fotos dos fundadores (as mesmas da página do Blueprint). `position` = object-position do recorte 4:3. */
  foundersGallery: {
    id: 'fundadores',
    caption: 'Bela e Alisson, fundadores da Bluezone',
    intervalMs: 2200,
    photos: [
      { src: '/midia/blueprint/hero.jpg', alt: 'Alisson e Bela fazendo uma selfie com o notebook', position: 'center 42%' },
      { src: '/midia/blueprint/palco.jpg', alt: 'Alisson e Bela sorrindo no palco, com luz de LED', position: 'center 32%' },
      { src: '/midia/blueprint/idealizadores.jpg', alt: 'Alisson sentado na cadeira e Bela ao lado, no estúdio', position: 'center 30%' },
    ],
  },
  testimonials: {
    id: 'clientes',
    label: '06 — clientes',
    title: 'O que nossos clientes dizem sobre nós.',
    /** Troca automática a cada N segundos (pausa com mouse, toque, mídia tocando e aba oculta). */
    autoAdvanceMs: 7000,
    /**
     * Cada item vira um cartão do carrossel.
     * `type: 'quote'`: depoimento em texto (name, service, text, photo em public/, via: 'whatsapp' | '' para o selo de origem).
     * `type: 'image' | 'video' | 'audio'`: mídia com `src` em public/ (ex.: /midia/clientes/02.mp4) e `poster` opcional. Sem `src`, mostra o espaço reservado.
     */
    items: [
      { type: 'quote', name: 'Vania Abreu', service: 'redes sociais e identidade visual', photo: '/midia/clientes/vania-abreu.png', via: '', text: 'Passando para deixar registrado meu agradecimento, mas especialmente meu encantamento com a Bluezone pelas entregas maravilhosas, tanto no artístico quanto no calendário de conteúdos, análise e formas de trabalho tão cuidadosa e profissional. Estou muito feliz por vocês estarem cuidando das minhas redes, da minha identidade visual e por estarmos juntos nesse pedaço de mundo que é a internet. Adorei. Vida longa a nossa parceria e que nosso percurso seja tão bonito quanto sonhamos.' },
      { type: 'quote', name: 'Dra. Monique', service: 'Instagram, identidade visual e vídeos', photo: '/midia/clientes/monique.png', via: '', text: 'A Blue foi o melhor investimento que fiz pro meu Instagram. Eu não fazia ideia por onde começar, quais conteúdos trazer, como mostrar o meu lado profissional e até mesmo o pessoal de forma estratégica. Eles me trouxeram uma visão de mercado, da minha área. Me explicaram passo a passo em cada reunião como eu poderia chamar a atenção exata do meu público. Criaram minha identidade visual do jeitinho que pedi. E com isso, atingimos um perfil, primeiramente, lindíssimo, refinado, elegante, com conteúdos incríveis, que ficou muito mais do que eu esperava. Os vídeos!!! Meu Deus, as edições dos vídeos, os takes, a qualidade, a atenção da Bela, do Alisson desde o primeiro dia. Só agradecer, Blue!' },
      { type: 'quote', name: 'Bella Falconi', service: 'edição de vídeos para campanhas', photo: '/midia/clientes/bella-falconi.png', via: 'whatsapp', text: 'Adorei os vídeos.' },
      { type: 'quote', name: 'Viviane Alecrim', service: 'estratégia e conteúdo', photo: '/midia/clientes/viviane-alecrim.png', via: '', text: 'Se tem uma coisa que eu confio, é no seu poder de convencimento e criação das melhores estratégias!!!' },
      { type: 'quote', name: 'Rosi Thomaz', service: 'projeto e estratégia', photo: '/midia/clientes/rosi-thomaz.png', via: '', text: 'Obrigada pela apresentação do projeto elaborado, ficou incrível! Me surpreendi com a assertividade, com a compreensão que desenvolveram do meu negócio e as soluções propostas. Parabéns pelo talento e competência nessa etapa!' },
      { type: 'quote', name: 'Darlim Miranda', service: 'identidade visual e mentoria', photo: '/midia/clientes/darlim-miranda.png', via: '', text: 'Bela e Alisson, passando para agradecer por tudo. Vocês são top demais. Arrasaram na escolha da nossa identidade, nas cores. Tudo perfeito. Sinto a dedicação e carinho em cada detalhe. Sem falar nas nossas mentorias. Foi Deus que colocou vocês em nossos caminhos. Desejo a vocês muito sucesso, pois vocês são incríveis.' },
    ] as TestimonialItem[],
    /** Prints reais de WhatsApp, lado a lado em iPhones 3D que giram com o scroll (telas recortadas dos PNGs, em public/midia/clientes/). */
    phones: [
      { src: '/midia/clientes/wpp-viviane.webp', alt: 'Mensagem de Viviane Alecrim no WhatsApp agradecendo a primeira etapa do contrato', name: 'Viviane Alecrim', note: 'via WhatsApp' },
      { src: '/midia/clientes/wpp-cliente.webp', alt: 'Mensagem de cliente no WhatsApp: que trabalho lindo de vocês, Bluezone', name: 'Cliente Bluezone', note: 'via WhatsApp' },
    ],
  },
  products: {
    id: 'produtos',
    label: '07 — produtos',
    kicker: 'em breve',
    title: 'O que estamos construindo.',
    intro: 'Produtos para colocar estratégia, conteúdo e tecnologia na rotina de quem empreende.',
    items: [
      { title: 'Blueprint', brand: 'blueprint', badge: 'curso disponível', text: 'Guia prático em vídeo para parar de postar no escuro: comunicação com intenção, clareza e direção, do zero.', cta: 'conheça o Blueprint', href: '/blueprint' },
      { title: 'IA para automação', text: 'Ferramentas que tiram tarefas repetitivas do caminho: atendimento, organização e rotina de comunicação funcionando sem depender de você o tempo todo.' },
      { title: 'IA para criação de conteúdo', text: 'Um sistema de criação, não um chat em branco. Alimentado com o posicionamento, o público, a voz e o histórico da sua marca, ele gera conteúdo com estratégia, mantém a consistência entre as peças e lembra o que precisa ser publicado e quando.' },
      { title: 'BlueCast', text: 'O podcast da Blue. O time atualiza o micro e médio empreendedor sobre o mercado brasileiro: inovação, oportunidades, editais abertos e histórias de quem está construindo o próprio negócio. A BlueNews em áudio.' },
      { title: 'Plataforma Blue de cursos', text: 'Nossa plataforma própria de cursos. Quem compra entra também na comunidade de empreendedores da Blue: um espaço para conversar, trocar experiências, fazer networking e crescer junto.' },
    ],
    note: 'Quer ser avisado quando lançarmos? Fale com a gente.',
  },
  team: {
    id: 'time',
    label: '08 — nosso time/parceiros',
    title: 'Quem faz a Bluezone acontecer.',
    /** Fundadores em destaque (foto maior). Foto: caminho em public/, ex.: /time/isabela.jpg. */
    founders: [
      {
        name: 'Isabela Lima',
        role: 'Founder da Bluezone',
        tags: ['Estrategista', 'Consultora', 'Publicitária'],
        bio: 'Atua no planejamento, posicionamento, copywriting e direção criativa, conectando os objetivos de cada projeto a uma comunicação estratégica.',
        photo: '/midia/isabela-lima.png',
      },
      {
        name: 'Alisson Werneck',
        role: 'Co-founder da Bluezone',
        tags: ['Marcas', 'Branding', 'Growth Marketing'],
        bio: 'Coordena projetos e produções audiovisuais, garantindo organização, agilidade e coerência entre o planejamento e a entrega.',
        photo: '/midia/alisson-werneck.png',
      },
    ],
    /** Demais integrantes e parceiros. Foto: caminho em public/, ex.: /time/raphael.jpg. */
    members: [
      { name: 'Raphael Bretz', role: 'Designer Gráfico', tags: [], bio: 'Responsável por captar e transformar conteúdos em soluções visuais, desenvolvendo peças que fortalecem a identidade e a apresentação das marcas.', photo: '/midia/raphael-bretz.png' },
      { name: 'Sarah Santiago', role: 'Desenvolvedora fullstack', tags: ['Engenheira de IA', 'Cibersegurança'], bio: 'Responsável por transformar desafios em soluções digitais, auxiliando nossos clientes na criação de sites modernos, seguros e escaláveis, que combinam excelência técnica, experiência do usuário e inovação para gerar resultados reais.', photo: '/midia/sarah-santiago.png' },
      { name: 'Ana Simões', role: 'Advogada especialista em Direito Digital', tags: [], bio: 'Responsável pela gestão financeira e contratual, conduzindo os processos com organização, transparência e segurança em cada parceria.', photo: '/midia/ana-simoes.png' },
      { name: 'Luiz Philipe', role: 'Gestor de Tráfego', tags: [], bio: 'Responsável pelo planejamento, execução e monitoramento de campanhas digitais na Bluezone, direcionando os conteúdos para alcançar públicos estratégicos e ampliar os resultados da marca.', photo: '/midia/luiz-philipe.png' },
      { name: 'Hebert Coutinho', role: 'Especialista em Tráfego Pago', tags: ['Inteligência Artificial', 'Automação'], bio: 'Atuação completa na criação, gestão e otimização de campanhas de tráfego pago em plataformas como Google Ads e Meta Ads, combinando análise de dados, inteligência artificial e automações para tornar o processo de aquisição e atendimento mais eficiente.', photo: '/midia/hebert-coutinho.png' },
    ],
  },
  blog: {
    id: 'bluenews',
    label: 'bluenews',
    name: 'BlueNews',
    href: '/bluenews',
    kicker: 'em breve',
    title: 'Ideias, direção e bastidores de quem está construindo o próprio negócio.',
    text: 'A BlueNews vai chegar de dois jeitos: uma newsletter por e-mail com novidades, oportunidades e o que importa para quem empreende, e um portal com artigos, guias práticos e histórias de marcas que escolheram crescer com estratégia. Estamos preparando as primeiras edições.',
    cta: 'quero ser avisado',
    /** Formulário de inscrição (nome, e-mail, telefone). Vai para o mesmo Apps Script do contato com origem "bluenews". */
    form: {
      title: 'Deixe seus dados e a gente te avisa quando a primeira edição sair.',
      submit: 'quero ser avisado',
      message: 'Inscrição na BlueNews: quero receber a newsletter e as novidades por e-mail.',
      success: 'inscrição feita. a primeira edição chega no seu e-mail.',
    },
    /** Seções do portal (header da BlueNews e cartões da página). As cinco primeiras são da cliente; as demais foram sugeridas em 12/09/2026. */
    categories: [
      { id: 'geral', label: 'geral', title: 'Geral', text: 'Novidades da Bluezone, avisos e tudo o que não cabe em uma seção específica.' },
      { id: 'tecnologia', label: 'tecnologia', title: 'Tecnologia', text: 'Ferramentas, IA e automação explicadas para quem precisa aplicar no próprio negócio, sem equipe técnica.' },
      { id: 'marketing', label: 'marketing', title: 'Marketing', text: 'Posicionamento, redes sociais, tráfego e marca: o que funciona para negócios pequenos e por quê.' },
      { id: 'empreendedorismo', label: 'empreendedorismo', title: 'Empreendedorismo', text: 'Decisões, rotina e crescimento de quem constrói um negócio de verdade, com estrutura enxuta.' },
      { id: 'conteudo', label: 'criação de conteúdo', title: 'Criação de conteúdo', text: 'Como transformar conhecimento e experiência em conteúdo consistente, com método e sem depender de inspiração.' },
      { id: 'financas', label: 'finanças', title: 'Finanças', text: 'Precificação, fluxo de caixa, impostos e organização financeira para o negócio se manter saudável.' },
      { id: 'vendas', label: 'vendas', title: 'Vendas', text: 'Da primeira conversa ao fechamento: prospecção, atendimento, propostas e recorrência.' },
      { id: 'oportunidades', label: 'oportunidades', title: 'Oportunidades', text: 'Editais, programas de fomento, crédito, eventos e prazos que valem a atenção do pequeno empreendedor.' },
      { id: 'historias', label: 'histórias', title: 'Histórias', text: 'Bastidores e aprendizados de empreendedores e marcas que escolheram crescer com direção.' },
    ],
  },
  contact: {
    id: 'contato',
    label: '09 — contato',
    title: 'Entre em contato',
    subtitle: 'Como podemos ajudar?',
    paragraphs: [
      'Conte um pouco sobre o momento do seu negócio, os desafios que está enfrentando e onde quer chegar.',
      'Vamos conversar?',
    ],
    note: 'Respondemos em até 1 dia útil.',
  },
} as const
