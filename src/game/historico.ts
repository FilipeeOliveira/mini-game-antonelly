import type { Partida } from "@/game/types";

const CHAVE_PARTIDAS = "mga:v1:partidas";

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    // storage indisponível (privado, cheio, bloqueado) - degrada pro padrão,
    // o jogo continua normalmente, só o ranking fica sem histórico.
    return padrao;
  }
}

function escrever(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // idem - falha de storage nunca pode quebrar o jogo.
  }
}

export function ehMesmoDia(timestamp: number, referencia: number = Date.now()): boolean {
  return new Date(timestamp).toDateString() === new Date(referencia).toDateString();
}

export function listarHistorico(): Partida[] {
  return ler<Partida[]>(CHAVE_PARTIDAS, []);
}

// Grava assim que a partida termina (chamado direto no fim da partida, não
// ao sair da tela) - sobrevive a recarregamento e queda de energia.
export function salvarPartida(partida: Partida): void {
  escrever(CHAVE_PARTIDAS, [...listarHistorico(), partida]);
}

// Remove só as partidas de hoje. Nunca apagar pra "abrir vaga" no ranking -
// isto é uma ação explícita do operador, com confirmação dupla na UI.
export function zerarHistoricoDoDia(): void {
  escrever(
    CHAVE_PARTIDAS,
    listarHistorico().filter((p) => !ehMesmoDia(p.timestamp))
  );
}

export function zerarHistoricoCompleto(): void {
  escrever(CHAVE_PARTIDAS, []);
}

export function contarBrindesPorTipo(historico: Partida[]): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const partida of historico) {
    if (!partida.premio) continue;
    contagem[partida.premio] = (contagem[partida.premio] ?? 0) + 1;
  }
  return contagem;
}

export function historicoParaCSV(historico: Partida[]): string {
  const cabecalho = "nome,acertos,total,percentual,tempoMs,premio,dataHora";
  const linhas = historico.map((p) =>
    [p.nome, p.acertos, p.total, p.percentual, p.tempoMs, p.premio ?? "", new Date(p.timestamp).toISOString()].join(
      ","
    )
  );
  return [cabecalho, ...linhas].join("\n");
}
