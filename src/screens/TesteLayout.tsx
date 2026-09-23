import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BANCO_PERGUNTAS } from "@/data/perguntas";
import { FUNDOS_PERGUNTA } from "@/config/backgrounds";
import type { ItemPartida, Pergunta } from "@/game/types";
import { Jogo } from "@/screens/Jogo";

// Ferramenta de desenvolvimento (só aparece com import.meta.env.DEV - ver
// Abertura/App): percorre o banco da pergunta mais longa pra mais curta
// renderizando o <Jogo> real, pra conferir se o useAjustarFonte segura o
// layout. Não substitui o teste do Playwright com as 30 perguntas.

const maiorAlternativa = (p: Pergunta) => Math.max(...p.alternativas.map((a) => a.length));

// Enunciado e alternativas têm caixas e useAjustarFonte próprios, então o
// enunciado manda na ordem e a alternativa mais longa só desempata.
export function ordenarPorTamanho(banco: Pergunta[]): Pergunta[] {
  return banco
    .slice()
    .sort((a, b) => b.pergunta.length - a.pergunta.length || maiorAlternativa(b) - maiorAlternativa(a));
}

// Alternativas na ordem do banco (sem embaralhar), pra a inspeção ser
// reproduzível.
function paraItem(p: Pergunta): ItemPartida {
  return { pergunta: p.pergunta, alternativas: p.alternativas.map((texto, i) => ({ texto, certa: i === p.correta })) };
}

const ORDENADAS = ordenarPorTamanho(BANCO_PERGUNTAS);

export function TesteLayout({ onSair }: { onSair: () => void }) {
  const [indice, setIndice] = useState(0);
  const [fontes, setFontes] = useState({ pergunta: "-", menorAlt: "-" });
  const areaRef = useRef<HTMLDivElement>(null);
  const p = ORDENADAS[indice];

  // Lê do DOM o font-size que o useAjustarFonte gravou em .pergunta/.alt__txt
  // (ele escreve em el.style.fontSize) - observa porque o ajuste roda de novo
  // quando document.fonts termina de carregar.
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    function ler() {
      const px = (el: Element | null) => (el instanceof HTMLElement ? parseFloat(el.style.fontSize) : NaN);
      const alts = [...area!.querySelectorAll(".alt__txt")].map(px).filter((n) => !isNaN(n));
      const pergunta = px(area!.querySelector(".pergunta"));
      setFontes({
        pergunta: isNaN(pergunta) ? "-" : `${pergunta}px`,
        menorAlt: alts.length ? `${Math.min(...alts)}px` : "-",
      });
    }
    ler();
    const obs = new MutationObserver(ler);
    obs.observe(area, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
    return () => obs.disconnect();
  }, []);

  const botao: CSSProperties = { font: "700 28px var(--inter)", padding: "16px 28px", borderRadius: 12, border: "none", cursor: "pointer" };

  return (
    <>
      <div ref={areaRef}>
        <Jogo
          key={indice}
          itens={[paraItem(p)]}
          fundos={[FUNDOS_PERGUNTA[indice % FUNDOS_PERGUNTA.length]]}
          segundosPorPergunta={0}
          msFeedbackCerto={0}
          msFeedbackErrado={0}
          onFim={() => {}}
        />
      </div>
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10,
          display: "flex", alignItems: "center", gap: 20, padding: 24,
          background: "rgba(0,0,0,0.8)", color: "#fff", font: "500 24px var(--inter)",
        }}
      >
        <button type="button" style={botao} disabled={indice === 0} onClick={() => setIndice((i) => i - 1)}>
          ◀ Anterior
        </button>
        <div style={{ flex: 1, textAlign: "center", lineHeight: 1.4 }}>
          <b>Pergunta {indice + 1} de {ORDENADAS.length}</b>
          <br />
          enunciado {p.pergunta.length} car. · fonte {fontes.pergunta} (mín 32px)
          <br />
          maior alt. {maiorAlternativa(p)} car. · menor fonte alt. {fontes.menorAlt} (mín 20px)
        </div>
        <button
          type="button"
          style={botao}
          disabled={indice === ORDENADAS.length - 1}
          onClick={() => setIndice((i) => i + 1)}
        >
          Próxima ▶
        </button>
        <button type="button" style={{ ...botao, background: "#c33", color: "#fff" }} onClick={onSair}>
          Sair
        </button>
      </div>
    </>
  );
}
