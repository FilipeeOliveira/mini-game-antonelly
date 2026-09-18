import "@testing-library/jest-dom/vitest";

// jsdom não carrega imagens de verdade (sem rede/decoder), então o preload de
// backgrounds (ver game/preloadImagens.ts) nunca dispararia onload sozinho.
// Este stub simula o carregamento assíncrono via setTimeout, para funcionar
// tanto com timers reais quanto com vi.useFakeTimers()/advanceTimersByTimeAsync.
class ImagemFake {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = "";
  set src(valor: string) {
    this._src = valor;
    const disparar = valor.includes("quebrada") ? this.onerror : this.onload;
    setTimeout(() => disparar?.(), 0);
  }
  get src() {
    return this._src;
  }
}
// @ts-expect-error stub simplificado para o ambiente de teste - só precisa de src/onload/onerror
global.Image = ImagemFake;

// jsdom não implementa ResizeObserver/IntersectionObserver - usados por
// ClickSpark (components/ClickSpark.tsx) e pelo useInView da lib "motion"
// (Ranking.tsx). Stubs no-op bastam: os testes não dependem do disparo real
// de redimensionamento/interseção, só de esses construtores existirem.
class ObserverFake {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error stub simplificado para o ambiente de teste
global.ResizeObserver = ObserverFake;
// @ts-expect-error stub simplificado para o ambiente de teste
global.IntersectionObserver = ObserverFake;

