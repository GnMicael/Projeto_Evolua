// Conteúdos do PDF "Conteúdos para o site – Projeto Evolua".
// Tudo o que está aqui é estático: para atualizar números, textos ou gráficos, edite este arquivo.

export const FINDINGS: { icon: string; title: string }[] = [
  { icon: 'Lightbulb', title: 'Desenvolvimento da autonomia e do pensamento crítico' },
  { icon: 'MessagesSquare', title: 'Melhoria na comunicação e no trabalho em equipe' },
  { icon: 'Search', title: 'Maior interesse pela pesquisa científica e pelo conhecimento' },
  { icon: 'GraduationCap', title: 'Influência da iniciação científica nas escolhas acadêmicas e profissionais' },
  { icon: 'Trophy', title: 'Ampliação das oportunidades por meio da participação em feiras científicas e eventos' },
  { icon: 'School', title: 'Reconhecimento da escola pública como espaço de protagonismo, inovação e transformação social' },
]

export const CONCLUSION =
  'A participação em projetos científicos contribui para a formação de estudantes mais críticos, autônomos e preparados, além de ampliar suas perspectivas acadêmicas, profissionais e pessoais.'

export type ChartOption = { label: string; value: number }
export type ChartData = { id: string; title: string; total: number; options: ChartOption[] }

// Gráficos digitalizados do formulário (9 respostas cada). "value" = número de respostas.
export const CHARTS: ChartData[] = [
  {
    id: 'impacto',
    title: 'Participar dos projetos científicos da 3M realizando na escola EEEI Professor José Claret Dionísio teve algum impacto significativo em sua vida pessoal, acadêmica ou profissional? Se sim, de que maneira?',
    total: 9,
    options: [
      { label: 'Sim, impactou minha escolha de carreira.', value: 3 },
      { label: 'Sim, desenvolveu habilidades importantes (como comunicação, trabalho em equipe, etc.).', value: 6 },
      { label: 'Sim, aumentou meu interesse da área do meu projeto.', value: 0 },
      { label: 'Não, não teve um impacto significativo.', value: 0 },
    ],
  },
  {
    id: 'area-atual',
    title: 'Hoje em dia, você está seguindo na sua vida profissional com a área do projeto que participou?',
    total: 9,
    options: [
      { label: 'Sim, estou trabalhando na mesma área do projeto', value: 1 },
      { label: 'Sim, estou em uma área relacionada ao projeto', value: 2 },
      { label: 'Sim, estou estudando ou me especializando na área do projeto', value: 1 },
      { label: 'Não, estou atuando em uma área completamente diferente da do projeto', value: 4 },
      { label: 'Não, estou fora do mercado de trabalho ou não tenho uma área profissional definida', value: 1 },
    ],
  },
  {
    id: 'participaria',
    title: 'Se você tivesse a oportunidade de participar novamente de um projeto de iniciação científica, você participaria?',
    total: 9,
    options: [
      { label: 'Sim, definitivamente. A experiência foi extremamente valiosa para meu desenvolvimento pessoal e acadêmico.', value: 5 },
      { label: 'Sim, com certeza. Embora tenha enfrentado alguns desafios, acredito que seria uma oportunidade positiva.', value: 4 },
      { label: 'Não, eu não participaria.', value: 0 },
      { label: 'Não tenho certeza. A experiência foi mista e eu precisaria refletir mais.', value: 0 },
    ],
  },
  {
    id: 'faculdade',
    title: 'Se você concluiu o ensino médio ou o ensino técnico, você ingressou em uma faculdade?',
    total: 9,
    options: [
      { label: 'Sim, eu ingressei em uma faculdade', value: 7 },
      { label: 'Não, eu não ingressei em uma faculdade', value: 0 },
      { label: 'Ainda estou planejando ingressar em uma faculdade', value: 2 },
      { label: 'Optei por seguir outro caminho', value: 0 },
    ],
  },
  {
    id: 'estudos',
    title: 'Após concluir o ensino médio, você prosseguiu com seus estudos? Se sim, em que área?',
    total: 9,
    options: [
      // TODO: o PDF cortou os nomes das áreas de graduação. Troque "Graduação (área N)" pelos nomes reais.
      { label: 'Graduação (área 1)', value: 3 },
      { label: 'Graduação (área 2)', value: 2 },
      { label: 'Graduação (área 3)', value: 1 },
      { label: 'Graduação (área 4)', value: 1 },
      { label: 'Curso técnico', value: 2 },
    ],
  },
]

export const INTERVIEW_QUESTION = 'Qual é a maior realização que o projeto trouxe para a sua vida?'

export const INTERVIEWS: string[] = [
  'Acredito que participar de projetos como esse durante o ensino fundamental vai muito além da oportunidade de desenvolver novas habilidades, acredito que o maior benefício seja a ampliação de horizontes. Sair do ensino fundamental com a ideia de que é possível ocupar e se aventurar por áreas que não costumam estar no cotidiano de adolescentes, principalmente os de escola pública, como o universo da ciência é uma forma de ampliar e acreditar que é possível alcançar lugares que antes pareceriam inalcançáveis. Obs: Mas a parte de visitar empresas/faculdades e conhecer pessoas de vários cantos também é muito massa 🤪✨️',
  'Realização pessoal e satisfação em concluir e receber premiação devido aos projetos acadêmicos realizados.',
  'Mesmo depois de um momento trágico que passei, consegui criar um foco e desenvolver um bom networking para minha carreira profissional, ganhei mais confiança também e habilidades comunicativas.',
  'Poder sair fora da bolha da escola e apresentar o que estudamos e desenvolvemos ao longo do projeto para outras pessoas, além das experiências que vivemos ao longo deste percurso.',
  'Me trouxe clareza e suporte para prosseguir com os estudos, me deixaram mais familiarizada com as exigências acadêmicas. E os conhecimentos de ambos os projetos que participei (o curativo, e os métodos de estudos) são extremamente úteis, pois me benefício das "dicas" que estudei. Também posso dizer que, ao participar deles pude conhecer novos lugares, receber convites, ser reconhecida. Nós pudemos ir em feiras de ciências nas escolas da região, na Unicamp, na Usp, na feira Paulista, na Febic... E não me arrependo em nada, pois foram experiências incríveis!!!',
  'Networking',
  'Novos conhecimentos',
  'Me mostrou a carreira que eu quero seguir futuramente. Atualmente tenho estudado bastante, conforme aprendi realizando projetos.',
  'Abriu a oportunidade de fazer um curso que não está pensado, além que me ajudar no meu curso técnico.',
]

export const SCHOOLS: string[] = [
  'Escola Estadual Professor José Claret Dionísio',
  'Escola Estadual Professora Liomar Freitas Câmara',
  'Escola Estadual Jonatas Davi Visel dos Santos',
  'Escola Estadual Professora Maria Cristina de Souza Lôbo',
  'Escola Técnica Estadual de Hortolândia (ETEC)',
  'Instituto Federal de Educação, Ciência e Tecnologia de São Paulo – Câmpus Hortolândia (IFSP)',
  'Escola Estadual Professora Hedy Madalena Bocchi',
  'Escola Estadual Professora Conceição Aparecida Terza Gomes Cardinales',
  'Escola Estadual Priscila Fernandes da Rocha',
]

export const IMPACT = [
  { value: '300+', label: 'Pessoas impactadas', note: 'Alcance estimado do projeto.' },
  { value: '20+', label: 'Pessoas entrevistadas', note: 'Participantes que contribuíram diretamente com a pesquisa.' },
]

export const CONTACT = {
  instagram: 'https://www.instagram.com/evoluaimpactoprojetos',
  instagramHandle: '@evoluaimpactoprojetos',
  email: 'impactocientificojcd@gmail.com',
}

/* ---------- Universo da Iniciação Científica ---------- */
export type Link = { label: string; url?: string; desc?: string }
export type ScienceItem = { id: string; title: string; text: string; intro?: string; list?: Link[]; outro?: string }

export const SCIENCE: ScienceItem[] = [
  {
    id: 'o-que-e',
    title: 'O que é iniciação científica?',
    text: 'A iniciação científica é o primeiro contato dos estudantes com a pesquisa e a produção do conhecimento científico. Por meio dela, os alunos aprendem a investigar problemas, desenvolver ideias, analisar informações e buscar soluções. Essa experiência contribui para o desenvolvimento do pensamento crítico, da autonomia, da criatividade e de habilidades importantes para a vida acadêmica e profissional.',
  },
  {
    id: 'como-comecar',
    title: 'Como começar um projeto científico na escola?',
    text: 'Para começar um projeto científico, é importante observar situações do cotidiano que despertem curiosidade ou apresentem algum problema. Depois, deve-se escolher um tema, formular uma pergunta de pesquisa, procurar um professor orientador, estabelecer objetivos e organizar um planejamento. A partir disso, é possível iniciar a investigação e registrar todas as etapas do desenvolvimento.',
  },
  {
    id: 'escolher-tema',
    title: 'Como escolher um tema de pesquisa?',
    text: 'Um tema de pesquisa pode surgir de situações observadas na escola, na comunidade ou na sociedade. O ideal é escolher um assunto que desperte interesse e que permita uma investigação. Algumas áreas que podem servir de inspiração são tecnologia, educação, meio ambiente, saúde, sustentabilidade e comportamento humano. O tema deve ser delimitado para que a pesquisa tenha um objetivo claro e seja possível de realizar.',
  },
  {
    id: 'desenvolver',
    title: 'Como desenvolver uma pesquisa científica?',
    text: 'Uma pesquisa científica envolve etapas organizadas para investigar determinado problema. Geralmente, começa com a escolha do tema e a formulação de uma pergunta de pesquisa. Em seguida, são definidos os objetivos, a justificativa e o referencial teórico. Depois, estabelece-se a metodologia, realiza-se a coleta de dados, analisam-se os resultados e elaboram-se as conclusões. Todas as etapas devem ser registradas e fundamentadas em informações confiáveis.',
  },
  {
    id: 'feiras',
    title: 'Como participar de feiras científicas?',
    text: 'Para participar de uma feira científica, o estudante precisa desenvolver um projeto de pesquisa e procurar eventos que aceitem trabalhos da sua categoria. É necessário consultar os regulamentos, observar os prazos de inscrição e preparar os materiais de apresentação, como resumo científico e banner. Durante o evento, os participantes apresentam suas pesquisas, respondem às perguntas dos avaliadores e compartilham conhecimentos com outros pesquisadores.',
    outro: 'Alguns exemplos de eventos são FEBRACE, FEBIC, FeNaDANTE e MILSET Brasil.',
  },
  {
    id: 'oportunidades',
    title: 'Onde encontrar oportunidades para jovens pesquisadores?',
    text: 'Existem diversas instituições que incentivam a participação de jovens na ciência, oferecendo programas, eventos, bolsas e oportunidades de aprendizagem. Universidades, institutos federais, escolas técnicas e instituições de pesquisa são alguns dos lugares onde essas oportunidades podem ser encontradas.',
    intro: 'Algumas instituições para conhecer são:',
    list: [
      { label: 'CNPq', desc: 'Conselho Nacional de Desenvolvimento Científico e Tecnológico', url: 'https://www.gov.br/cnpq' },
      { label: 'FAPESP', desc: 'Fundação de Amparo à Pesquisa do Estado de São Paulo', url: 'https://fapesp.br' },
      { label: 'CAPES', desc: 'Coordenação de Aperfeiçoamento de Pessoal de Nível Superior', url: 'https://www.gov.br/capes' },
      { label: 'Universidades públicas e institutos federais' },
    ],
  },
  {
    id: 'ferramentas',
    title: 'Materiais e ferramentas para estudantes pesquisadores',
    text: 'Existem diversas ferramentas gratuitas que facilitam o desenvolvimento de pesquisas científicas. Algumas auxiliam na busca por artigos e referências, enquanto outras permitem organizar informações, elaborar questionários e apresentar resultados.',
    list: [
      { label: 'Google Acadêmico', desc: 'busca por artigos e trabalhos científicos', url: 'https://scholar.google.com.br' },
      { label: 'SciELO', desc: 'acesso a artigos e publicações acadêmicas', url: 'https://www.scielo.br' },
      { label: 'Google Forms', desc: 'criação de questionários e coleta de dados', url: 'https://forms.google.com' },
      { label: 'Google Planilhas', desc: 'organização de informações e elaboração de gráficos', url: 'https://sheets.google.com' },
      { label: 'Canva', desc: 'criação de banners e apresentações', url: 'https://www.canva.com' },
      { label: 'Zotero', desc: 'organização de referências bibliográficas', url: 'https://www.zotero.org' },
    ],
  },
  {
    id: 'professores',
    title: 'Como os professores podem incentivar a iniciação científica?',
    text: 'Os professores possuem um papel fundamental na formação de jovens pesquisadores. Para incentivar a iniciação científica, podem estimular a curiosidade dos alunos, propor atividades investigativas, incentivar perguntas e debates, orientar projetos e apresentar oportunidades de participação em feiras científicas. Também é importante valorizar as ideias dos estudantes, incentivar a autonomia e mostrar que a pesquisa pode começar com problemas simples do cotidiano escolar.',
  },
]

export const SCIENCE_PURPOSE =
  'Compartilhar conhecimentos, orientar novos pesquisadores e incentivar estudantes e professores a reconhecerem a escola pública como um espaço de produção científica, inovação e transformação social.'
