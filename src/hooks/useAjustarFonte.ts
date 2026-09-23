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

    // Mede e encolhe até caber. Extraída pra função porque roda duas vezes:
    // uma vez já (síncrona, sem "piscar" o tamanho grande antes de encolher)
    // e de novo quando as fontes @fontsource terminam de carregar. Sem a
    // segunda passada, medir antes da fonte real carregar usa as métricas da
    // fonte de fallback (mais estreita) - o texto passa despercebido como
    // "cabe" e, quando a fonte real troca (mais larga, principalmente nos
    // pesos bold/900 do Archivo), transborda pra fora da caixa sem nunca
    // encolher, cortado por overflow:hidden.
    function ajustar() {
      if (!el) return;
      let tamanho = fonteInicial;
      el.style.fontSize = `${tamanho}px`;

      // element.scrollHeight/scrollWidth em jsdom são sempre 0, então este
      // loop é no-op em teste (comportamento coberto separadamente por
      // proximaFonte).
      while (tamanho > fonteMinima && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
        const proxima = proximaFonte(tamanho, fonteMinima, true);
        if (proxima === null || proxima === tamanho) break;
        tamanho = proxima;
        el.style.fontSize = `${tamanho}px`;
      }

      setFonte(tamanho);
    }

    ajustar();

    const fontes = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fontes) return;
    let ativo = true;
    const reajustar = () => {
      if (ativo) ajustar();
    };
    // Pede a fonte exata deste elemento (família/peso/tamanho computados) com
    // os glifos do próprio texto, em vez de só `fonts.ready`: o ready resolve
    // na hora se nada estiver carregando naquele instante, e aí a medição
    // feita com o fallback ficava valendo.
    const estilo = getComputedStyle(el);
    fontes
      .load(`${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`, el.textContent ?? "")
      .then(reajustar, () => {});
    // E refaz se qualquer fonte terminar de carregar com a tela já montada
    // (swap tardio) - o tamanho não pode ficar congelado no do fallback.
    fontes.addEventListener("loadingdone", reajustar);
    return () => {
      ativo = false;
      fontes.removeEventListener("loadingdone", reajustar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, fonte };
}
