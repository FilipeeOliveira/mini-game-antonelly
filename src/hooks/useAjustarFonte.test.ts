import { describe, it, expect } from "vitest";
import { proximaFonte } from "./useAjustarFonte";

describe("proximaFonte", () => {
  it("não reduz quando não está transbordando", () => {
    expect(proximaFonte(58, 24, false)).toBeNull();
  });

  it("reduz em 2px quando está transbordando", () => {
    expect(proximaFonte(58, 24, true)).toBe(56);
  });

  it("não passa da fonte mínima", () => {
    expect(proximaFonte(25, 24, true)).toBe(24);
  });

  it("fica travado na mínima quando já está nela", () => {
    expect(proximaFonte(24, 24, true)).toBe(24);
  });
});
