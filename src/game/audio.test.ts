import { describe, it, expect, vi, beforeEach } from "vitest";
import { sons } from "./audio";

describe("sons", () => {
  let criarOscilador: ReturnType<typeof vi.fn>;
  let criarGanho: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const osc = {
      type: "",
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const ganho = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    criarOscilador = vi.fn(() => osc);
    criarGanho = vi.fn(() => ganho);

    // @ts-expect-error mock mínimo de AudioContext para o teste
    window.AudioContext = vi.fn(() => ({
      state: "running",
      currentTime: 0,
      destination: {},
      createOscillator: criarOscilador,
      createGain: criarGanho,
      resume: vi.fn(),
    }));
  });

  it("sons.toque cria um oscilador", () => {
    sons.toque();
    expect(criarOscilador).toHaveBeenCalledTimes(1);
  });

  it("sons.certo cria três osciladores (um acorde)", () => {
    sons.certo();
    expect(criarOscilador).toHaveBeenCalledTimes(3);
  });

  it("não lança erro se AudioContext não existir no navegador", () => {
    // @ts-expect-error remove o mock para simular navegador sem suporte
    delete window.AudioContext;
    expect(() => sons.errado()).not.toThrow();
  });
});
