// Tem que rodar (e terminar de rodar) ANTES de qualquer import de
// "motion/react" em qualquer arquivo de teste - motion-dom captura
// requestAnimationFrame numa const de topo de módulo, na primeira vez que é
// importado, e nunca mais olha de novo. O rAF nativo do jsdom não passa
// pelo relógio fake do vitest (vi.useFakeTimers()/advanceTimersByTime), então
// depois desse primeiro import a lib fica imune a avanço de tempo fake pra
// sempre - a tela que sai numa transição animada (AnimatePresence, ver
// components/Tela.tsx) nunca termina a animação de saída e nunca é
// desmontada nos testes.
//
// Import statements são hoisted pro topo do módulo pelo JS, então não dá
// pra simplesmente colocar este código antes do `import` de motion dentro
// do mesmo arquivo de setup - por isto este arquivo é separado e listado
// ANTES de test/setup.ts em vitest.config.ts (setupFiles roda em ordem).
// Troca por uma versão baseada em setTimeout, que aí sim resolve a função
// global atual (incluindo a versão fake) a cada chamada.
window.requestAnimationFrame = (callback: FrameRequestCallback): number =>
  setTimeout(() => callback(Date.now()), 16) as unknown as number;
window.cancelAnimationFrame = (handle: number): void => clearTimeout(handle);
