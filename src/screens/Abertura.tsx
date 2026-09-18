import { useEffect, useRef } from "react";
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
  const pressaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function iniciarPressao() {
    // Limpa qualquer temporizador pendente de uma pressão anterior antes de
    // armar um novo. Sem isto, um segundo dedo pousando na marca antes do
    // primeiro soltar sobrescreve pressaoRef sem cancelar o timer antigo:
    // esse timer órfão dispara 2s depois mesmo que os dois dedos já tenham
    // soltado havia tempo, abrindo o painel do operador sozinho.
    if (pressaoRef.current) clearTimeout(pressaoRef.current);
    pressaoRef.current = setTimeout(onAbrirPainel, 2000);
  }
  function cancelarPressao() {
    if (pressaoRef.current) clearTimeout(pressaoRef.current);
  }

  useEffect(() => () => cancelarPressao(), []);

  return (
    <Tela className="abertura">
      <TelaFundo src={FUNDO_ABERTURA} />
      <div
        className="abertura__marca"
        data-marca
        onPointerDown={iniciarPressao}
        onPointerUp={cancelarPressao}
        onPointerLeave={cancelarPressao}
        onPointerCancel={cancelarPressao}
      >
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
    </Tela>
  );
}
