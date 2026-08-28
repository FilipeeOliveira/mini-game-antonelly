import { describe, it, expect } from "vitest";
import { BANCO_PERGUNTAS } from "./perguntas";

describe("BANCO_PERGUNTAS", () => {
  it("tem exatamente 30 perguntas", () => {
    expect(BANCO_PERGUNTAS).toHaveLength(30);
  });

  it("cada pergunta tem exatamente 4 alternativas", () => {
    for (const p of BANCO_PERGUNTAS) {
      expect(p.alternativas).toHaveLength(4);
    }
  });

  it("cada pergunta tem um índice de resposta correta válido (0-3)", () => {
    for (const p of BANCO_PERGUNTAS) {
      expect([0, 1, 2, 3]).toContain(p.correta);
    }
  });

  it("cada pergunta tem um fato não vazio", () => {
    for (const p of BANCO_PERGUNTAS) {
      expect(p.fato.length).toBeGreaterThan(0);
    }
  });

  it("não há perguntas com texto duplicado", () => {
    const textos = BANCO_PERGUNTAS.map((p) => p.pergunta);
    expect(new Set(textos).size).toBe(textos.length);
  });
});
