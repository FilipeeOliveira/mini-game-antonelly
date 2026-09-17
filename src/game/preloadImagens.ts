export function preloadImagem(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    // resolve mesmo em erro: uma imagem quebrada não pode travar o boot do totem.
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function preloadImagens(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImagem));
}
