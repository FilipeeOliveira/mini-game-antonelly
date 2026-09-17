import { describe, it, expect } from "vitest";
import { preloadImagens } from "./preloadImagens";

describe("preloadImagens", () => {
  it("resolve depois que todas as imagens carregam", async () => {
    await expect(preloadImagens(["a.svg", "b.svg", "c.svg"])).resolves.toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("resolve mesmo se uma imagem falhar, sem travar o boot", async () => {
    await expect(preloadImagens(["quebrada.svg"])).resolves.toEqual([undefined]);
  });
});
