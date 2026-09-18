import { describe, it, expect } from "vitest";
import { normalizarNome, contemPalavraBloqueada, LIMITE_CARACTERES_NOME } from "./nome";

describe("normalizarNome", () => {
  it("põe em caixa alta e remove acentos", () => {
    expect(normalizarNome("joão")).toBe("JOAO");
  });

  it("colapsa espaços repetidos e corta nas pontas", () => {
    expect(normalizarNome("  ana   maria  ")).toBe("ANA MARIA");
  });

  it(`corta no limite de ${LIMITE_CARACTERES_NOME} caracteres`, () => {
    expect(normalizarNome("A".repeat(20))).toHaveLength(LIMITE_CARACTERES_NOME);
  });
});

describe("contemPalavraBloqueada", () => {
  it("detecta palavra bloqueada mesmo dentro de um nome maior", () => {
    expect(contemPalavraBloqueada("SEUMERDAJOAO")).toBe(true);
  });

  it("não bloqueia nome comum", () => {
    expect(contemPalavraBloqueada("MARIA")).toBe(false);
  });

  it("não bloqueia MARCUS - 'CU' de 2 letras só bate como token inteiro, não substring", () => {
    expect(contemPalavraBloqueada("MARCUS")).toBe(false);
  });

  it("bloqueia 'CU' quando é o nome inteiro ou um token separado por espaço", () => {
    expect(contemPalavraBloqueada("CU")).toBe(true);
    expect(contemPalavraBloqueada("SEU CU")).toBe(true);
  });

  it("pega a palavra bloqueada mesmo com letras repetidas (martelar a tecla)", () => {
    expect(contemPalavraBloqueada("PUUUTA")).toBe(true);
  });

  it("pega a palavra bloqueada mesmo digitada com espaço entre as letras", () => {
    expect(contemPalavraBloqueada("P U T A")).toBe(true);
  });
});
