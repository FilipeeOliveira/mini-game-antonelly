import { useLayoutEffect, useState, type ReactNode } from "react";

const LARGURA = 1080;
const ALTURA = 1920;

function calcularEscala() {
  return Math.min(window.innerWidth / LARGURA, window.innerHeight / ALTURA);
}

// Desenha tudo num canvas fixo de 1080x1920 e escala via transform para
// caber no viewport real do totem (ou da janela de teste/desenvolvimento),
// mantendo proporção e centralizando - assim as medidas em px do mockup
// valem sempre, independente do tamanho de tela real.
export function Canvas1080({ children }: { children: ReactNode }) {
  const [escala, setEscala] = useState(calcularEscala);

  useLayoutEffect(() => {
    function aoRedimensionar() {
      setEscala(calcularEscala());
    }
    aoRedimensionar();
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);

  return (
    <div className="canvas1080-moldura">
      <div
        className="canvas1080"
        style={{
          width: LARGURA,
          height: ALTURA,
          transform: `scale(${escala})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
