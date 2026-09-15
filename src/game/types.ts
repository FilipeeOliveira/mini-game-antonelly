export type Pergunta = {
  pergunta: string;
  alternativas: [string, string, string, string];
  correta: 0 | 1 | 2 | 3;
};

export type Alternativa = {
  texto: string;
  certa: boolean;
};

export type ItemPartida = {
  pergunta: string;
  alternativas: Alternativa[];
};

export type ResultadoPartida = {
  acertos: number;
  total: number;
  percentual: number;
  tempoTotalMs: number;
  tempoRespostasMs: number[];
};
