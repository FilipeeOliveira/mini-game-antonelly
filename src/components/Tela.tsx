import { motion } from "motion/react";
import type { ReactNode } from "react";

// Wrapper compartilhado pelas 5 telas do totem (abertura, nome, jogo,
// resultado, ranking) - troca o <section className="tela ..."> antigo (só
// entrada via CSS, sem saída) por um motion.section com AnimatePresence em
// App.tsx: a tela que sai desliza/esmaece junto com a que entra, em vez de
// sumir seca no frame seguinte. .tela continua position:absolute (ver
// theme.css), então as duas ocupam o mesmo lugar durante a transição.
const variantes = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -28 },
};

type TelaProps = {
  className: string;
  children: ReactNode;
};

export function Tela({ className, children }: TelaProps) {
  return (
    <motion.section
      className={`tela ${className}`}
      variants={variantes}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.32, ease: "easeInOut" }}
    >
      {children}
    </motion.section>
  );
}
