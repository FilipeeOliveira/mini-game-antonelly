import { describe, it, expect } from "vitest";
import { calcularPremio } from "./premiacao";
import { calcularPercentual } from "./engine";

const TOTAL_PERGUNTAS = 6;

describe("calcularPremio", () => {
  // Cobre todo acerto possível numa partida de 6 perguntas (0 a 6), fiel ao
  // arredondamento real de calcularPercentual - nada de percentual
  // hardcoded que possa divergir do que o jogo realmente calcula.
  it.each(
    Array.from({ length: TOTAL_PERGUNTAS + 1 }, (_, acertos) => acertos)
  )("acertos=%i mapeia para a faixa correta", (acertos) => {
    const percentual = calcularPercentual(acertos, TOTAL_PERGUNTAS);
    const premio = calcularPremio(percentual);

    const esperado =
      percentual >= 90
        ? "1 CHOPE"
        : percentual >= 70
          ? "1 SQUEEZE"
          : percentual >= 50
            ? "1 CHAVEIRO"
            : null;

    expect(premio).toBe(esperado);
  });

  it("nunca deixa uma pontuação sem faixa correspondente (consolação em min:0)", () => {
    expect(calcularPremio(0)).toBe(null);
    expect(calcularPremio(49)).toBe(null);
  });

  it("é robusto a faixas fora de ordem na config (ordena defensivamente por min desc)", () => {
    const foraDeOrdem = [
      { min: 0, premio: null },
      { min: 90, premio: "1 CHOPE" },
      { min: 50, premio: "1 CHAVEIRO" },
      { min: 70, premio: "1 SQUEEZE" },
    ];
    expect(calcularPremio(75, foraDeOrdem)).toBe("1 SQUEEZE");
  });
});
