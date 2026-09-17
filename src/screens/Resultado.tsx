import { useEffect, useState } from "react";
import { TelaFundo } from "@/components/TelaFundo";

type ResultadoProps = {
  fundo: string;
  percentual: number;
  acertos: number;
  total: number;
  mensagem: string;
  segundosAutoVolta: number;
  onJogarDeNovo: () => void;
  onProximoJogador: () => void;
  // Caminho silencioso do retorno automático (25s sem toque). Deliberadamente
  // separado de onProximoJogador: esse último é acionado só pelo clique no
  // botão "Próximo jogador" e, em App.tsx, está encadeado ao som de toque -
  // fiel ao original, onde apenas o listener de clique de btn-sair chama
  // somToque(), e o auto-retorno (irParaAbertura() puro) nunca toca som. Se
  // o timeout abaixo chamasse onProximoJogador, o totem beeparia sozinho a
  // cada rodada, 25s depois do último jogador sair - com o estande vazio.
  onAutoVolta: () => void;
};

export function Resultado({
  fundo,
  percentual,
  acertos,
  total,
  mensagem,
  segundosAutoVolta,
  onJogarDeNovo,
  onProximoJogador,
  onAutoVolta,
}: ResultadoProps) {
  const [restante, setRestante] = useState(segundosAutoVolta);

  useEffect(() => {
    setRestante(segundosAutoVolta);

    const timeout = setTimeout(() => {
      onAutoVolta();
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
      <TelaFundo src={fundo} />
      <p className="resultado__olho">Sua cota</p>
      <p className="nota">
        {percentual}
        <sup>%</sup>
      </p>
      <h2 className="veredito-final">{mensagem}</h2>
      <p className="acertos">
        {acertos} de {total} perguntas certas
      </p>
      <div className="acoes">
        <button className="botao-cta" type="button" onClick={onJogarDeNovo}>
          Jogar de novo
        </button>
        <button className="botao-cta botao-cta--fantasma" type="button" onClick={onProximoJogador}>
          Próximo jogador
        </button>
      </div>
      <p className="auto-volta">Voltando à tela inicial em {restante}s</p>
    </section>
  );
}
