// Título animado da abertura, em cima da lib "motion" (a mesma engine por
// trás dos componentes de animate-ui.com - o projeto já usa "motion/react"
// em CountUp.tsx). "Desafio" e "Antonelly" pousam em dois tempos com física
// de mola (spring), e "Antonelly" ganha um degradê contínuo em movimento -
// adaptado do primitive "Gradient Text" de animate-ui
// (https://animate-ui.com/r/primitives-texts-gradient.json), com as cores
// da marca no lugar do degradê azul/roxo/rosa padrão. O glow do "neon" do
// primitive original (uma segunda camada de texto borrada por cima) foi
// trocado pelo filter: drop-shadow() em .abertura__titulo-antonelly
// (theme.css) - duas camadas de texto animadas independentemente saem de
// sincronia e ficam com uma borda dupla malfeita.
//
// Sem gate de prefers-reduced-motion de propósito: isto roda numa tela de
// totem público (não é o dispositivo pessoal de ninguém), e a preferência
// de SO/navegador de quem builda/testa o totem não deve decidir se o totem
// anima pro público.
import { motion, type Transition } from "motion/react";

const DEGRADE_ANTONELLY =
  "linear-gradient(90deg, var(--cta-escuro) 0%, var(--cta-claro) 20%, var(--solimoes) 50%, var(--cta-claro) 80%, var(--cta-escuro) 100%)";

const estiloDegrade: React.CSSProperties = {
  backgroundImage: DEGRADE_ANTONELLY,
  backgroundSize: "300% 100%",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const transicaoBrilho: Transition = { duration: 5, repeat: Infinity, ease: "linear" };

function entrada(atraso: number): {
  initial: { opacity: number; y: number; scale: number };
  animate: { opacity: number; y: number; scale: number };
  transition: Transition;
} {
  return {
    initial: { opacity: 0, y: -48, scale: 0.82 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: "spring", stiffness: 260, damping: 20, delay: atraso },
  };
}

export function TituloAbertura() {
  return (
    <h1 className="abertura__titulo">
      <motion.span className="abertura__titulo-linha1" {...entrada(0)}>
        Desafio
      </motion.span>
      <motion.em className="abertura__titulo-antonelly" {...entrada(0.15)}>
        <motion.span
          style={estiloDegrade}
          animate={{ backgroundPosition: ["0% 0%", "300% 0%"] }}
          transition={transicaoBrilho}
        >
          Antonelly
        </motion.span>
      </motion.em>
    </h1>
  );
}
