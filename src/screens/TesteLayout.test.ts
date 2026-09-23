import { describe, it, expect } from "vitest";
import { BANCO_PERGUNTAS } from "@/data/perguntas";
import type { Pergunta } from "@/game/types";
import { ordenarPorTamanho } from "./TesteLayout";

describe("ordenarPorTamanho", () => {
  it("ordena as 30 perguntas do banco do enunciado mais longo pro mais curto", () => {
    const ordenadas = ordenarPorTamanho(BANCO_PERGUNTAS);
    expect(ordenadas).toHaveLength(BANCO_PERGUNTAS.length);
    for (let i = 1; i < ordenadas.length; i++) {
      expect(ordenadas[i - 1].pergunta.length).toBeGreaterThanOrEqual(ordenadas[i].pergunta.length);
    }
  });

  it("desempata pela alternativa mais longa", () => {
    const curta: Pergunta = { pergunta: "abc", alternativas: ["a", "b", "c", "d"], correta: 0 };
    const longa: Pergunta = { pergunta: "xyz", alternativas: ["a", "bbbbbb", "c", "d"], correta: 0 };
    expect(ordenarPorTamanho([curta, longa])[0]).toBe(longa);
  });
});
