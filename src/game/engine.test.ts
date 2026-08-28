import { describe, it, expect } from "vitest";
import { embaralhar, sortearPerguntas, calcularPercentual, mensagemResultado } from "./engine";
import type { Pergunta } from "./types";

describe("embaralhar", () => {
  it("retorna todos os itens originais, sem repetir nem perder nenhum", () => {
    const original = [1, 2, 3, 4, 5];
    const resultado = embaralhar(original);
    expect([...resultado].sort()).toEqual([...original].sort());
  });

  it("não modifica o array original", () => {
    const original = [1, 2, 3];
    embaralhar(original);
    expect(original).toEqual([1, 2, 3]);
  });
});

function bancoFalso(tamanho: number): Pergunta[] {
  return Array.from({ length: tamanho }, (_, i) => ({
    pergunta: `Pergunta ${i}`,
    alternativas: ["A", "B", "C", "D"] as [string, string, string, string],
    correta: 0 as const,
    fato: `Fato ${i}`,
  }));
}

describe("sortearPerguntas", () => {
  it("sorteia a quantidade pedida de perguntas", () => {
    const banco = bancoFalso(30);
    const { itens } = sortearPerguntas(banco, [], 5, false);
    expect(itens).toHaveLength(5);
  });

  it("reabastece a sacola quando ela não tem itens suficientes", () => {
    const banco = bancoFalso(6);
    const { sacolaRestante } = sortearPerguntas(banco, [0, 1], 5, false);
    expect(sacolaRestante).toHaveLength(1);
  });

  it("marca certa=true só na alternativa do índice correto", () => {
    const banco: Pergunta[] = [
      { pergunta: "P1", alternativas: ["a", "b", "c", "d"], correta: 2, fato: "f" },
    ];
    const { itens } = sortearPerguntas(banco, [], 1, false);
    const certas = itens[0].alternativas.filter((a) => a.certa);
    expect(certas).toHaveLength(1);
    expect(certas[0].texto).toBe("c");
  });
});

describe("calcularPercentual", () => {
  it.each([
    [5, 5, 100],
    [4, 5, 80],
    [3, 5, 60],
    [2, 5, 40],
    [1, 5, 20],
    [0, 5, 0],
  ])("acertos=%i de total=%i -> %i%%", (acertos, total, esperado) => {
    expect(calcularPercentual(acertos, total)).toBe(esperado);
  });
});

describe("mensagemResultado", () => {
  it.each([
    [100, "Cheia máxima! Você conhece o rio de ponta a ponta"],
    [80, "Quase lá em cima: só faltou um palmo de água"],
    [60, "Boa navegação — o canal está aberto"],
    [40, "Águas médias: dá para melhorar na próxima"],
    [20, "Vazante. Passe no estande e a gente te conta o resto"],
    [0, "Seca total — mas todo mundo começa por aqui"],
  ])("percentual=%i -> mensagem certa", (pct, esperado) => {
    expect(mensagemResultado(pct)).toBe(esperado);
  });
});
