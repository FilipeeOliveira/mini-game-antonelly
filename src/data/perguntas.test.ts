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


  it("não há perguntas com texto duplicado", () => {
    const textos = BANCO_PERGUNTAS.map((p) => p.pergunta);
    expect(new Set(textos).size).toBe(textos.length);
  });
  // Gabarito oficial fornecido pela Antonelly, na ordem das 30 perguntas.
  // Trava o banco: reordenar alternativas sem corrigir `correta` quebra aqui.
  it("o índice de resposta correta bate com o gabarito oficial", () => {
    const GABARITO = [
      1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 2, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 2, 1, 0, 2, 2,
    ];
    expect(BANCO_PERGUNTAS.map((p) => p.correta)).toEqual(GABARITO);
  });
});
