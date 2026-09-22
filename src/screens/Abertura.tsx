import { Settings } from "lucide-react";
import logoAntonelly from "@/assets/antonelly-logo.svg";
import { FUNDO_ABERTURA } from "@/config/backgrounds";
import { TelaFundo } from "@/components/TelaFundo";
import { IconeCoroa } from "@/components/IconeCoroa";
import { TituloAbertura } from "@/components/TituloAbertura";
import { Tela } from "@/components/Tela";

type AberturaProps = {
  pronto: boolean;
  onComecar: () => void;
  onAbrirPainel: () => void;
  onAbrirRanking: () => void;
};

export function Abertura({ pronto, onComecar, onAbrirPainel, onAbrirRanking }: AberturaProps) {
  return (
    <Tela className="abertura">
      <TelaFundo src={FUNDO_ABERTURA} />
      <div className="abertura__marca">
        <img className="abertura__logo" src={logoAntonelly} alt="Antonelly Construções" />
      </div>
      <TituloAbertura />
      <p className="abertura__subtitulo">
        Seis perguntas sobre o rio,
        <br />o porto e a obra.
        <br />
        Quanto você sabe?
      </p>
      <button
        className="botao-cta"
        type="button"
        disabled={!pronto}
        onClick={onComecar}
      >
        Vamos começar!
      </button>
      <button className="botao-cta botao-cta--ranking" type="button" onClick={onAbrirRanking}>
        <IconeCoroa />
        Ranking
      </button>
      <button
        className="botao-config"
        type="button"
        aria-label="Configurações"
        onClick={onAbrirPainel}
      >
        <Settings size={26} />
      </button>
    </Tela>
  );
}
