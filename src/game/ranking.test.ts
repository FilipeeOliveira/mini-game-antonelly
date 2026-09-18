import { describe, it, expect } from "vitest";
import { janelaPartidas, ordenarRanking, topRanking, posicaoDe, formatarTempo } from "./ranking";
import type { Partida } from "@/game/types";

function partida(sobrescreve: Partial<Partida>): Partida {
  return {
    id: "x",
    nome: "JOGADOR",
    acertos: 0,
    total: 6,
    percentual: 0,
    tempoMs: 0,
    premio: null,
    timestamp: 0,
    ...sobrescreve,
  };
}

describe("janelaPartidas", () => {
  it("'evento' devolve o histórico inteiro", () => {
    const historico = [partida({ id: "1", timestamp: 0 }), partida({ id: "2", timestamp: Date.now() })];
    expect(janelaPartidas(historico, "evento")).toHaveLength(2);
  });

  it("'dia' filtra só partidas de hoje", () => {
    const ontem = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const historico = [partida({ id: "hoje", timestamp: Date.now() }), partida({ id: "ontem", timestamp: ontem })];
    expect(janelaPartidas(historico, "dia").map((p) => p.id)).toEqual(["hoje"]);
  });
});

describe("ordenarRanking", () => {
  it("ordena por percentual desc", () => {
    const historico = [partida({ id: "baixo", percentual: 50 }), partida({ id: "alto", percentual: 90 })];
    expect(ordenarRanking(historico).map((p) => p.id)).toEqual(["alto", "baixo"]);
  });

  it("empate no percentual: desempata por tempoMs asc (mais rápido ganha)", () => {
    const historico = [
      partida({ id: "lento", percentual: 80, tempoMs: 20000 }),
      partida({ id: "rapido", percentual: 80, tempoMs: 8000 }),
    ];
    expect(ordenarRanking(historico).map((p) => p.id)).toEqual(["rapido", "lento"]);
  });

  it("empate em percentual e tempoMs: desempata por timestamp asc (quem jogou primeiro)", () => {
    const historico = [
      partida({ id: "depois", percentual: 80, tempoMs: 10000, timestamp: 2000 }),
      partida({ id: "antes", percentual: 80, tempoMs: 10000, timestamp: 1000 }),
    ];
    expect(ordenarRanking(historico).map((p) => p.id)).toEqual(["antes", "depois"]);
  });

  it("não muta o array original", () => {
    const historico = [partida({ id: "a", percentual: 10 }), partida({ id: "b", percentual: 90 })];
    const copia = [...historico];
    ordenarRanking(historico);
    expect(historico).toEqual(copia);
  });
});

describe("topRanking", () => {
  it("devolve só os N primeiros", () => {
    const historico = Array.from({ length: 8 }, (_, i) => partida({ id: String(i), percentual: i }));
    expect(topRanking(historico, 5)).toHaveLength(5);
    expect(topRanking(historico, 5).map((p) => p.id)).toEqual(["7", "6", "5", "4", "3"]);
  });
});

describe("posicaoDe", () => {
  it("devolve a posição 1-based do jogador", () => {
    const historico = [partida({ id: "a", percentual: 90 }), partida({ id: "b", percentual: 50 })];
    expect(posicaoDe(historico, "b")).toBe(2);
  });

  it("devolve null se o id não está na lista", () => {
    expect(posicaoDe([], "fantasma")).toBeNull();
  });
});

describe("formatarTempo", () => {
  it("formata milissegundos como m:ss", () => {
    expect(formatarTempo(65000)).toBe("1:05");
    expect(formatarTempo(9000)).toBe("0:09");
    expect(formatarTempo(0)).toBe("0:00");
  });
});
