import { useState } from "react";
import { FUNDO_COR_FALLBACK } from "@/config/backgrounds";

type TelaFundoProps = {
  src: string;
};

// Fundo full-bleed (cover + center) com overlay gradiente azul para garantir
// contraste do texto, crossfade suave ao trocar de imagem e fallback de cor
// sólida se o arquivo falhar - o totem roda o dia inteiro e não pode "piscar"
// branco entre perguntas.
export function TelaFundo({ src }: TelaFundoProps) {
  const [falhou, setFalhou] = useState(false);

  return (
    <div className="tela-fundo" style={{ backgroundColor: FUNDO_COR_FALLBACK }}>
      {!falhou && (
        <img
          key={src}
          className="tela-fundo__img"
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setFalhou(true)}
        />
      )}
      <div className="tela-fundo__overlay" />
    </div>
  );
}
