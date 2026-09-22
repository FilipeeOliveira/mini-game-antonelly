import { useEffect, useState } from "react";
import { TelaFundo } from "@/components/TelaFundo";
import { BotaoCta } from "@/components/BotaoCta";
import { Tela } from "@/components/Tela";

function IconeSelo() {
  return (
    <svg className="premio__selo" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l2.6 5.27 5.82.85-4.21 4.1 1 5.8L12 15.27 6.79 18.02l1-5.8-4.21-4.1 5.82-.85L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

type ResultadoProps = {
  fundo: string;
  percentual: number;
  acertos: number;
  total: number;
  mensagem: string;
  premio: string | null;
  segundosAutoVolta: number;
  onProximoJogador: () => void;
  onAbrirRanking: () => void;
  // Caminho silencioso do retorno automático (25s sem toque). Deliberadamente
  // separado de onProximoJogador: esse último é acionado só pelo clique no
  // botão "Voltar ao início" e, em App.tsx, está encadeado ao som de toque -
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
  premio,
  segundosAutoVolta,
  onProximoJogador,
  onAbrirRanking,
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
    <Tela className="resultado">
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
      {premio ? (
        <div className="premio">
          <IconeSelo />
          <span className="premio__nome">Parabéns! Você ganhou {premio.toLowerCase()}.</span>
        </div>
      ) : (
        <p className="premio premio--vazio">Poxa, não foi dessa vez!</p>
      )}
      <div className="ctas-coluna">
        <BotaoCta onClick={onProximoJogador}>Voltar ao início</BotaoCta>
        <BotaoCta variante="ranking" onClick={onAbrirRanking}>
          Ranking
        </BotaoCta>
      </div>
      <p className="auto-volta">Voltando à tela inicial em {restante}s</p>
    </Tela>
  );
}
