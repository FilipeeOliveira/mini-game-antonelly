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

// Um registro de histórico: gravado assim que a partida termina, para
// sempre. O ranking é só uma consulta ordenada sobre esta lista - nunca
// apagar um registro para "abrir vaga" no ranking (ver game/ranking.ts).
export type Partida = {
  id: string;
  nome: string;
  acertos: number;
  total: number;
  percentual: number;
  tempoMs: number;
  premio: string | null;
  timestamp: number;
};
