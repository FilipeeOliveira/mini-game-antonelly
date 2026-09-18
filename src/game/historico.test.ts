import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listarHistorico,
  salvarPartida,
  zerarHistoricoDoDia,
  zerarHistoricoCompleto,
  contarBrindesPorTipo,
  historicoParaCSV,
  ehMesmoDia,
} from "./historico";
import type { Partida } from "@/game/types";

function partidaDeTeste(sobrescreve: Partial<Partida> = {}): Partida {
  return {
    id: "1",
    nome: "MARIA",
    acertos: 5,
    total: 6,
    percentual: 83,
    tempoMs: 12000,
    premio: "1 SQUEEZE",
    timestamp: Date.now(),
    ...sobrescreve,
  };
}

describe("historico", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("começa vazio", () => {
    expect(listarHistorico()).toEqual([]);
  });

  it("salvarPartida acrescenta ao histórico e sobrevive a uma nova leitura", () => {
    salvarPartida(partidaDeTeste());
    salvarPartida(partidaDeTeste({ id: "2", nome: "JOAO" }));
    expect(listarHistorico()).toHaveLength(2);
    expect(listarHistorico().map((p) => p.nome)).toEqual(["MARIA", "JOAO"]);
  });

  it("zerarHistoricoDoDia remove só as partidas de hoje, mantém as de outros dias", () => {
    const ontem = Date.now() - 2 * 24 * 60 * 60 * 1000;
    salvarPartida(partidaDeTeste({ id: "hoje", timestamp: Date.now() }));
    salvarPartida(partidaDeTeste({ id: "ontem", timestamp: ontem }));
    zerarHistoricoDoDia();
    expect(listarHistorico().map((p) => p.id)).toEqual(["ontem"]);
  });

  it("zerarHistoricoCompleto limpa tudo", () => {
    salvarPartida(partidaDeTeste());
    zerarHistoricoCompleto();
    expect(listarHistorico()).toEqual([]);
  });

  it("contarBrindesPorTipo agrupa por prêmio, ignorando quem não ganhou", () => {
    const historico = [
      partidaDeTeste({ premio: "1 CHOPE" }),
      partidaDeTeste({ premio: "1 CHOPE" }),
      partidaDeTeste({ premio: "1 SQUEEZE" }),
      partidaDeTeste({ premio: null }),
    ];
    expect(contarBrindesPorTipo(historico)).toEqual({ "1 CHOPE": 2, "1 SQUEEZE": 1 });
  });

  it("historicoParaCSV gera cabeçalho e uma linha por partida", () => {
    const csv = historicoParaCSV([partidaDeTeste()]);
    const linhas = csv.split("\n");
    expect(linhas[0]).toBe("nome,acertos,total,percentual,tempoMs,premio,dataHora");
    expect(linhas[1]).toContain("MARIA");
  });

  it("ehMesmoDia compara pelo dia local, não pelo timestamp exato", () => {
    const agora = new Date(2026, 0, 15, 23, 0, 0).getTime();
    const maisTarde = new Date(2026, 0, 15, 23, 59, 0).getTime();
    const diaSeguinte = new Date(2026, 0, 16, 0, 1, 0).getTime();
    expect(ehMesmoDia(agora, maisTarde)).toBe(true);
    expect(ehMesmoDia(agora, diaSeguinte)).toBe(false);
  });

  it("degrada sem quebrar quando o storage falha ao ler", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage indisponível");
    });
    expect(listarHistorico()).toEqual([]);
    vi.restoreAllMocks();
  });

  it("degrada sem quebrar quando o storage falha ao gravar", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage cheio");
    });
    expect(() => salvarPartida(partidaDeTeste())).not.toThrow();
    vi.restoreAllMocks();
  });
});
