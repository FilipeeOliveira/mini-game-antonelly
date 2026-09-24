import type { Pergunta } from "@/game/types";

// Fonte: QUIZ_ANTONELLY_CENATEC_VERSAO_FINAL_REVISADA.pdf (docs/) - texto e
// gabarito sincronizados 1:1 com esse documento. Qualquer alteração de
// pergunta/alternativa/resposta deve vir de uma nova revisão desse PDF.
export const BANCO_PERGUNTAS: Pergunta[] = [
  {
    pergunta: "Em qual região a Antonelly possui forte presença operacional?",
    alternativas: ["Região Sul", "Amazônia e Região Norte", "Região Sudeste", "Região Centro-Oeste"],
    correta: 1,
  },
  {
    pergunta: "Qual destas atividades está diretamente relacionada à atuação da Antonelly?",
    alternativas: [
      "Operação de infraestrutura portuária",
      "Gestão de terminais rodoviários",
      "Administração de aeroportos regionais",
      "Operação de redes de metrô urbano",
    ],
    correta: 0,
  },
  {
    pergunta: "O que significa a sigla IP4?",
    alternativas: [
      "Instalação Portuária Pública de Pequeno Porte",
      "Instituto de Portos Públicos do Interior",
      "Infraestrutura Portuária de Quarta Geração",
      "Índice de Planejamento Portuário de Quatro Etapas",
    ],
    correta: 0,
  },
  {
    pergunta: "Em uma operação no interior do Amazonas, qual modal possui importância estratégica?",
    alternativas: ["Ferroviário", "Aquaviário", "Metroviário", "Teleférico"],
    correta: 1,
  },
  {
    pergunta: "Qual destas cidades já esteve relacionada às operações da Antonelly?",
    alternativas: ["Envira", "Belém", "Parauapebas", "Curitiba"],
    correta: 0,
  },
  {
    pergunta: "Por que estoques estratégicos são importantes para operações no interior?",
    alternativas: [
      "Reduzem o planejamento logístico",
      "Mantêm insumos disponíveis em áreas distantes",
      "Eliminam o transporte aquaviário",
      "Dispensam a logística de abastecimento",
    ],
    correta: 1,
  },
  {
    pergunta: "Qual área tem papel fundamental na prevenção de acidentes e na segurança dos colaboradores?",
    alternativas: ["SESMT", "Marketing", "Financeiro", "Design gráfico"],
    correta: 0,
  },
  {
    pergunta: "Qual destes valores combina melhor com uma operação distribuída por vários municípios?",
    alternativas: [
      "Integração entre equipes",
      "Isolamento entre equipes",
      "Ausência de planejamento",
      "Descentralização sem diálogo",
    ],
    correta: 0,
  },
  {
    pergunta: "Em operações portuárias, para que serve uma boa sinalização?",
    alternativas: [
      "Decorar áreas operacionais",
      "Orientar fluxos e dar segurança",
      "Substituir equipes operacionais",
      "Acelerar o fluxo de embarcações",
    ],
    correta: 1,
  },
  {
    pergunta: "Complete o lema utilizado na comunicação da Antonelly: “Construímos sonhos...”",
    alternativas: ["Criamos caminhos.", "Mudamos vidas.", "Navegamos juntos.", "Ligamos destinos."],
    correta: 1,
  },
  {
    pergunta: "Qual é a principal função de um muro de contenção?",
    alternativas: [
      "Melhorar a iluminação natural de uma construção",
      "Conter o solo e resistir aos esforços provocados por ele",
      "Reduzir o consumo de concreto da fundação",
      "Substituir o sistema de drenagem do terreno",
    ],
    correta: 1,
  },
  {
    pergunta: "O que é um flutuante?",
    alternativas: [
      "Estrutura mantida abaixo da superfície",
      "Estrutura sustentada pela flutuação",
      "Veículo destinado ao transporte terrestre",
      "Estrutura suspensa por cabos",
    ],
    correta: 1,
  },
  {
    pergunta:
      "A Antonelly Construções e Serviços está presente em mais de quantos municípios da Região Norte?",
    alternativas: ["30 municípios", "40 municípios", "50 municípios", "20 municípios"],
    correta: 2,
  },
  {
    pergunta: "Qual conjunto de palavras melhor define a Antonelly?",
    alternativas: [
      "Conexão, transformação e movimento",
      "Transporte, vendas e produção",
      "Navegação, marketing e manutenção",
      "Isolamento, estagnação e imobilidade",
    ],
    correta: 0,
  },
  {
    pergunta: "O que é uma poita na área naval?",
    alternativas: [
      "Proteção lateral para o casco",
      "Peso de fundeio para amarração",
      "Equipamento de controle do calado",
      "Sistema de iluminação da embarcação",
    ],
    correta: 1,
  },
  {
    pergunta: "Em uma IP4, qual estrutura normalmente recebe diretamente as atracações das embarcações?",
    alternativas: ["Ponte de acesso", "Flutuante principal", "Flutuante intermediário", "Guarita administrativa"],
    correta: 1,
  },
  {
    pergunta: "Qual sistema ajuda a manter estruturas flutuantes posicionadas mesmo sob ação da correnteza?",
    alternativas: ["Sistema de drenagem", "Sistema de fundeio", "Sistema de contenção", "Sistema de climatização"],
    correta: 1,
  },
  {
    pergunta: "Qual destes componentes pode fazer parte de um sistema de fundeio de uma IP4?",
    alternativas: ["Poitas de fundeio", "Sapatas de fundação", "Vergas estruturais", "Luminárias de emergência"],
    correta: 0,
  },
  {
    pergunta: "Durante uma atracação, qual deve ser uma das principais preocupações da equipe da IP4?",
    alternativas: [
      "Manter organização e segurança",
      "Reduzir o tempo de permanência",
      "Maximizar atracações simultâneas",
      "Suspender protocolos de segurança",
    ],
    correta: 0,
  },
  {
    pergunta: "Qual situação pode ser considerada uma patologia em uma estrutura?",
    alternativas: ["Corrosão da armadura", "Concretagem planejada", "Execução de fundação", "Pintura de acabamento"],
    correta: 0,
  },
  {
    pergunta: "Qual é a função de um finger em uma IP4?",
    alternativas: [
      "Ligar pontes de acesso",
      "Apoiar a atracação de pequenas embarcações",
      "Fixar boias do sistema de fundeio",
      "Permitir circulação terrestre de veículos",
    ],
    correta: 1,
  },
  {
    pergunta: "Na construção civil, o que é uma sapata?",
    alternativas: [
      "Fundação superficial da estrutura",
      "Ligação estrutural de grandes vãos",
      "Contenção de terrenos em concreto",
      "Revestimento para acabamento",
    ],
    correta: 0,
  },
  {
    pergunta: "O que são patologias de obras?",
    alternativas: [
      "Alterações previstas no projeto",
      "Problemas que afetam o desempenho da construção",
      "Técnicas de reforço estrutural",
      "Etapas de aprovação do projeto",
    ],
    correta: 1,
  },
  {
    pergunta: "Qual é uma das principais funções do técnico naval em uma IP4?",
    alternativas: [
      "Autorizar navegação das embarcações",
      "Coordenar atracações com segurança",
      "Fazer manutenção das embarcações",
      "Criar campanhas de divulgação",
    ],
    correta: 1,
  },
  {
    pergunta: "O que é um muro de contenção?",
    alternativas: [
      "Estrutura para contenção do solo",
      "Parede para divisão de ambientes",
      "Estrutura para drenagem pluvial",
      "Elemento de acabamento de fachadas",
    ],
    correta: 0,
  },
  {
    pergunta: "Quantas IP4s são atualmente administradas pela Antonelly?",
    alternativas: ["47", "49", "51", "53"],
    correta: 2,
  },
  {
    pergunta: "Qual das obras abaixo foi executada pela Antonelly em Parintins?",
    alternativas: ["Centro Cultural de Parintins", "Museu dos Bois", "Mercado Municipal de Parintins", "Teatro Amazonas"],
    correta: 1,
  },
  {
    pergunta: "Qual dos portos abaixo foi construído pela Antonelly?",
    alternativas: ["Porto de Alvarães", "Porto de Parintins", "Porto de Coari", "Porto de Santos (SP)"],
    correta: 0,
  },
  {
    pergunta: "Qual das cidades abaixo NÃO possui uma IP4?",
    alternativas: ["Alvarães", "Carauari", "Lábrea", "Parintins"],
    correta: 2,
  },
  {
    pergunta:
      "Quantas boias de fundeio foram instaladas na IP4 de Parintins e quantas poitas foram utilizadas em cada uma?",
    alternativas: [
      "4 boias, 3 poitas por boia",
      "5 boias, 2 poitas por boia",
      "5 boias, 3 poitas por boia",
      "6 boias, 1 poita por boia",
    ],
    correta: 2,
  },
];
