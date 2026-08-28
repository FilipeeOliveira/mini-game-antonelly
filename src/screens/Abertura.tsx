import { useEffect, useRef } from "react";
import logoAntonelly from "@/assets/antonelly-logo.svg";

type AberturaProps = {
  onComecar: () => void;
  onAbrirPainel: () => void;
};

export function Abertura({ onComecar, onAbrirPainel }: AberturaProps) {
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
    <section className="tela tela--ativa abertura">
      <div
        className="marca marca--logo"
        data-marca
        onPointerDown={iniciarPressao}
        onPointerUp={cancelarPressao}
        onPointerLeave={cancelarPressao}
        onPointerCancel={cancelarPressao}
      >
        <img className="marca__logo" src={logoAntonelly} alt="Antonelly Construções" />
      </div>
      <p className="olho">Feira · Totem interativo</p>
      <h1 className="titulao">
        Desafio
        <em>do Rio</em>
      </h1>
      <p className="chamada">
        Cinco perguntas sobre o rio, o porto e a obra. <b>Quanto você sabe?</b>
      </p>
      <button className="botao-gigante" type="button" onClick={onComecar}>
        Toque para começar
      </button>
      <p className="rodape-abertura">Menos de 2 minutos · toque na tela</p>
    </section>
  );
}
