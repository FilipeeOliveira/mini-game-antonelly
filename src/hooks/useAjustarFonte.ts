import { useLayoutEffect, useRef, useState } from "react";

// ponytail: shrink-to-fit por tentativa (mede e reduz em passos), não por
// cálculo exato de métrica de fonte - upgrade se algum dia precisar de fit
// instantâneo sem "piscar" um frame no tamanho grande antes de encolher.
const PASSO_PX = 2;

// Reduz `fonteInicial` em passos de PASSO_PX até `medir()` parar de reportar
// overflow ou até atingir `fonteMinima`. Extraído como função pura só para
// poder testar a lógica de decremento sem precisar de layout real do jsdom.
export function proximaFonte(fonteAtual: number, fonteMinima: number, transbordando: boolean): number | null {
  if (!transbordando) return null;
  const proxima = fonteAtual - PASSO_PX;
  return proxima >= fonteMinima ? proxima : fonteMinima;
}

export function useAjustarFonte<T extends HTMLElement>(
  fonteInicial: number,
  fonteMinima: number,
  deps: unknown[]
) {
  const ref = useRef<T | null>(null);
  const [fonte, setFonte] = useState(fonteInicial);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let tamanho = fonteInicial;
    el.style.fontSize = `${tamanho}px`;

    // element.scrollHeight/scrollWidth em jsdom são sempre 0, então este loop
    // é no-op em teste (comportamento coberto separadamente por proximaFonte).
    while (tamanho > fonteMinima && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
      const proxima = proximaFonte(tamanho, fonteMinima, true);
      if (proxima === null || proxima === tamanho) break;
      tamanho = proxima;
      el.style.fontSize = `${tamanho}px`;
    }

    setFonte(tamanho);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, fonte };
}
