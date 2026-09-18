// Lista simples de bloqueio para o nome exibido no ranking (fica exposto ao
// público). A checagem fica em game/nome.ts - editar esta lista não exige
// tocar em nenhum componente.
// Entradas com menos de 4 letras (CU, PQP, FDP) só batem como palavra
// inteira do nome (separada por espaço), não como substring - senão
// bloqueiam nome real por coincidência (ex.: "CU" dentro de "MARCUS"). A
// partir de 4 letras a checagem já é por substring, ver LIMITE_PALAVRA_INTEIRA
// em game/nome.ts.
export const PALAVRAS_BLOQUEADAS: string[] = [
  "PORRA",
  "MERDA",
  "CARALHO",
  "PUTA",
  "PUTO",
  "BOSTA",
  "CACETE",
  "FODA",
  "FODASE",
  "VIADO",
  "CORNO",
  "OTARIO",
  "OTARIA",
  "IDIOTA",
  "BURRO",
  "BURRA",
  "RETARDADO",
  "RETARDADA",
  "PQP",
  "VTNC",
  "FDP",
  "ARROMBADO",
  "ARROMBADA",
  "BOSTAGEM",
  "CU",
  "PENIS",
  "BUCETA",
  "PICA",
  "XOXOTA",
  "NAZISTA",
  "HITLER",
];
