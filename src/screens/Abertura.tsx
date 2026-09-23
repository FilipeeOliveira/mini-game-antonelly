import { Play, Settings } from "lucide-react";
import logoAntonelly from "@/assets/antonelly-logo.svg";
import { FUNDO_ABERTURA } from "@/config/backgrounds";
import { TelaFundo } from "@/components/TelaFundo";
import { BotaoCta } from "@/components/BotaoCta";
import { TituloAbertura } from "@/components/TituloAbertura";
import { Tela } from "@/components/Tela";

type AberturaProps = {
  pronto: boolean;
  onComecar: () => void;
  onAbrirPainel: () => void;
  onAbrirRanking: () => void;
  onAbrirTesteLayout?: () => void;
};

export function Abertura({ pronto, onComecar, onAbrirPainel, onAbrirRanking, onAbrirTesteLayout }: AberturaProps) {
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
      <div className="ctas-coluna">
        <BotaoCta disabled={!pronto} onClick={onComecar}>
          <Play size={34} fill="currentColor" />
          Começar
        </BotaoCta>
        <BotaoCta variante="ranking" onClick={onAbrirRanking}>
          Ranking
        </BotaoCta>
      </div>
      <button
        className="botao-config"
        type="button"
        aria-label="Configurações"
        onClick={onAbrirPainel}
      >
        <Settings size={26} />
      </button>
      {/* Só no `vite dev`: vira `false` no build e some do bundle do totem. */}
      {import.meta.env.DEV && onAbrirTesteLayout && (
        <button
          type="button"
          onClick={onAbrirTesteLayout}
          style={{ position: "absolute", left: 24, bottom: 24, zIndex: 1, opacity: 0.5, font: "14px monospace", color: "#fff", background: "rgba(0,0,0,0.5)", border: "1px dashed #fff", padding: "6px 10px", cursor: "pointer" }}
        >
          DEV · layout perguntas
        </button>
      )}
    </Tela>
  );
}
