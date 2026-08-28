import { useEffect, useRef } from "react";

type AberturaProps = {
  onComecar: () => void;
  onAbrirPainel: () => void;
};

export function Abertura({ onComecar, onAbrirPainel }: AberturaProps) {
  const pressaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function iniciarPressao() {
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
        <img className="marca__logo" src="/antonelly-logo.svg" alt="Antonelly Construções" />
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
