import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FUNDO_COR_FALLBACK } from "@/config/backgrounds";

type TelaFundoProps = {
  src: string;
};

// Fundo full-bleed (cover + center) com overlay gradiente azul para garantir
// contraste do texto, e fallback de cor sólida se o arquivo falhar - o totem
// roda o dia inteiro e não pode "piscar" branco entre perguntas.
//
// O crossfade entre imagens é a parte que mais importa aqui: as imagens já
// vêm todas pré-carregadas (ver game/preloadImagens.ts), então o "flick"
// entre perguntas não era rede lenta - era o key={src} trocando a <img>
// inteira num frame só (a antiga some, a nova nasce em opacity:0 e sobe até
// 1 sozinha), deixando um vão sem NENHUMA imagem em cima do
// backgroundColor de fallback por até 0.4s. AnimatePresence mantém a <img>
// antiga montada até ela terminar de esmaecer, então sempre tem pelo menos
// uma imagem visível em cima do fallback durante a troca.
export function TelaFundo({ src }: TelaFundoProps) {
  const [falhou, setFalhou] = useState(false);

  return (
    <div className="tela-fundo" style={{ backgroundColor: FUNDO_COR_FALLBACK }}>
      <AnimatePresence>
        {!falhou && (
          <motion.img
            key={src}
            className="tela-fundo__img"
            src={src}
            alt=""
            aria-hidden="true"
            onError={() => setFalhou(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
      <div className="tela-fundo__overlay" />
    </div>
  );
}
