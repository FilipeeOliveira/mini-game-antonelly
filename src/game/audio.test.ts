import { describe, it, expect, vi, beforeEach } from "vitest";

describe("sons", () => {
  let criarOscilador: ReturnType<typeof vi.fn>;
  let criarGanho: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Cada teste precisa de sua própria instância do módulo: `audio.ts` guarda
    // o AudioContext num singleton de escopo de módulo, e o Vitest não isola
    // módulos entre `it()`s do mesmo arquivo por padrão. Resetar o registro de
    // módulos e importar `./audio` dinamicamente dentro de cada teste garante
    // um `contextoAudio` novo a cada teste, em vez de vazar entre eles.
    vi.resetModules();

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
    // Usa uma `function` (não arrow function) porque o código sob teste faz
    // `new AudioContextClasse()`, e o Vitest exige que a implementação de um
    // `vi.fn()` usado como construtor seja `function`/`class`.
    window.AudioContext = vi.fn(function () {
      return {
        state: "running",
        currentTime: 0,
        destination: {},
        createOscillator: criarOscilador,
        createGain: criarGanho,
        resume: vi.fn(),
      };
    });
  });

  it("sons.toque cria um oscilador", async () => {
    const { sons } = await import("./audio");
    sons.toque();
    expect(criarOscilador).toHaveBeenCalledTimes(1);
  });

  it("sons.certo cria três osciladores (um acorde)", async () => {
    const { sons } = await import("./audio");
    sons.certo();
    expect(criarOscilador).toHaveBeenCalledTimes(3);
  });

  it("não lança erro se AudioContext não existir no navegador", async () => {
    // @ts-expect-error remove o mock para simular navegador sem suporte
    delete window.AudioContext;
    const { sons } = await import("./audio");
    expect(() => sons.errado()).not.toThrow();
  });
});
