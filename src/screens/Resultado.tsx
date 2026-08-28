import { useEffect, useState } from "react";

type ResultadoProps = {
  percentual: number;
  acertos: number;
  total: number;
  mensagem: string;
  segundosAutoVolta: number;
  onJogarDeNovo: () => void;
  onProximoJogador: () => void;
};

export function Resultado({
  percentual,
  acertos,
  total,
  mensagem,
  segundosAutoVolta,
  onJogarDeNovo,
  onProximoJogador,
}: ResultadoProps) {
  const [restante, setRestante] = useState(segundosAutoVolta);

  useEffect(() => {
    setRestante(segundosAutoVolta);

    const timeout = setTimeout(() => {
      onProximoJogador();
    }, segundosAutoVolta * 1000);

    let restanteAtual = segundosAutoVolta;
    const intervalo = setInterval(() => {
      restanteAtual = restanteAtual <= 1 ? 0 : restanteAtual - 1;
      setRestante(restanteAtual);
      if (restanteAtual <= 0) {
        clearInterval(intervalo);
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosAutoVolta]);

  return (
    <section className="tela tela--ativa resultado">
      <div className="marca">
        <span aria-hidden="true" /> Desafio do Rio
      </div>
      <p className="olho" style={{ marginTop: "auto" }}>
        Sua cota
      </p>
      <p className="nota">
        {percentual}
        <sup>%</sup>
      </p>
      <h2 className="veredito-final">{mensagem}</h2>
      <p className="acertos">
        {acertos} de {total} perguntas certas
      </p>
      <div className="acoes">
        <button className="botao botao--primario" type="button" onClick={onJogarDeNovo}>
          Jogar de novo
        </button>
        <button className="botao botao--fantasma" type="button" onClick={onProximoJogador}>
          Próximo jogador
        </button>
      </div>
      <p className="auto-volta">Voltando à tela inicial em {restante}s</p>
      <div style={{ marginTop: "auto" }} />
    </section>
  );
}
