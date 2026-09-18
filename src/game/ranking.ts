import type { Partida } from "@/game/types";
import { ehMesmoDia } from "@/game/historico";
import type { JanelaRanking } from "@/config/ranking";

export function janelaPartidas(historico: Partida[], janela: JanelaRanking): Partida[] {
  if (janela === "evento") return historico;
  return historico.filter((p) => ehMesmoDia(p.timestamp));
}

// percentual DESC, depois tempoMs ASC (mais rápido ganha), depois
// timestamp ASC (quem jogou primeiro ganha).
export function ordenarRanking(partidas: Partida[]): Partida[] {
  return [...partidas].sort(
    (a, b) => b.percentual - a.percentual || a.tempoMs - b.tempoMs || a.timestamp - b.timestamp
  );
}

export function topRanking(partidas: Partida[], tamanho: number): Partida[] {
  return ordenarRanking(partidas).slice(0, tamanho);
}

// Posição 1-based dentro do ranking ordenado; null se o id não está na lista.
export function posicaoDe(partidas: Partida[], id: string): number | null {
  const indice = ordenarRanking(partidas).findIndex((p) => p.id === id);
  return indice === -1 ? null : indice + 1;
}

export function formatarTempo(ms: number): string {
  const totalSegundos = Math.round(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}
