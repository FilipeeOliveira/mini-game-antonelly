import { motion } from "motion/react";
import { FUNDO_ABERTURA } from "@/config/backgrounds";
import { TelaFundo } from "@/components/TelaFundo";
import { Tela } from "@/components/Tela";
import { IconeCoroa } from "@/components/IconeCoroa";
import CountUp from "@/components/CountUp";
import { topRanking, ordenarRanking, posicaoDe, formatarTempo } from "@/game/ranking";
import type { Partida } from "@/game/types";

// Sem foto de perfil no jogo - todo lugar que mostraria um avatar usa este
// ícone genérico, consistente com os outros ícones já desenhados à mão no
// projeto (IconeCheck em Jogo.tsx, IconeSelo em Resultado.tsx).
function IconeUsuario() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="currentColor" />
    </svg>
  );
}

// Ordem visual do pódio: 2º-1º-3º, igual a qualquer pódio físico.
const ORDEM_PODIO = [2, 1, 3] as const;

export type RankingProps = {
  partidas: Partida[];
  idJogadorAtual: string | null;
  onVoltar: () => void;
};

export function Ranking({ partidas, idJogadorAtual, onVoltar }: RankingProps) {
  const top3 = topRanking(partidas, 3);
  const podio = ORDEM_PODIO.map((posicao) => ({ posicao, partida: top3[posicao - 1] ?? null }));
  // Sem corte de tamanho aqui de propósito - o ranking tem que mostrar todo
  // mundo que já jogou, não só um top fixo. A lista rola dentro do cartão
  // (ver .ranking__lista no CSS) pra caber qualquer quantidade de gente sem
  // estourar a tela.
  const resto = ordenarRanking(partidas)
    .slice(3)
    .map((partida, i) => ({ posicao: i + 4, partida }));
  const posicaoJogador = idJogadorAtual ? posicaoDe(partidas, idJogadorAtual) : null;
  const jogadorForaDoPodio = posicaoJogador !== null && posicaoJogador > 3;

  return (
    <Tela className="ranking">
      <TelaFundo src={FUNDO_ABERTURA} />

      {/* Cartão único (título + pódio + lista), no lugar das peças soltas
          por cima da foto - mais perto do cartão de leaderboard de
          https://ui.trophy.so/docs/components/leaderboard-card que o
          pedido citou como referência. */}
      <div className="ranking__cartao">
        <h1 className="ranking__titulo">Ranking</h1>

        <div className="podio">
          {podio.map(({ posicao, partida }) => (
            <motion.div
              key={partida?.id ?? `vazio-${posicao}`}
              className={[
                "podio__coluna",
                `podio__coluna--${posicao}`,
                !partida ? "podio__coluna--vazia" : "",
                partida?.id === idJogadorAtual ? "podio__coluna--destaque" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (3 - posicao) * 0.1 }}
            >
              {/* Coroa do 1º lugar - pulsa sem parar (Motion cuida do scale;
                  a posição/tamanho ficam em .podio__coroa no CSS, sem
                  transform, pra não brigar com o transform que a animação
                  escreve). */}
              {posicao === 1 && partida && (
                <motion.div
                  className="podio__coroa"
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <IconeCoroa size={40} />
                </motion.div>
              )}
              <div className="podio__avatar">
                <IconeUsuario />
              </div>
              <p className="podio__nome">{partida?.nome ?? "—"}</p>
              <p className="podio__valor">
                {partida ? (
                  <>
                    <CountUp to={partida.percentual} duration={0.7} delay={(3 - posicao) * 0.1} />%
                  </>
                ) : (
                  "—"
                )}
              </p>
              <div className="podio__bloco">
                <span className="podio__numero">{posicao}º</span>
              </div>
            </motion.div>
          ))}
        </div>

        {resto.length > 0 && (
          <div className="ranking__lista">
            {resto.map(({ posicao, partida }, i) => {
              const destaque = partida.id === idJogadorAtual;
              // Atraso do stagger tampado (em vez de crescer sem limite com
              // i) - com "todo mundo que já jogou" a lista pode ter dezenas
              // de linhas, e ninguém deve esperar segundos pra ver as
              // últimas aparecerem.
              const atraso = 0.3 + Math.min(i * 0.03, 0.5);
              return (
                <motion.div
                  key={partida.id}
                  className={["ranking__linha", destaque ? "ranking__linha--destaque" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.28, delay: atraso }}
                >
                  <span className="ranking__pos">{posicao}º</span>
                  <span className="ranking__nome">{partida.nome}</span>
                  <span className="ranking__percentual">
                    <CountUp to={partida.percentual} duration={0.7} delay={atraso} />%
                  </span>
                  <span className="ranking__tempo">{formatarTempo(partida.tempoMs)}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {jogadorForaDoPodio && <p className="ranking__posicao-jogador">Você ficou em {posicaoJogador}º</p>}
      </div>

      <button className="botao-cta botao-cta--fantasma" type="button" onClick={onVoltar}>
        Voltar
      </button>
    </Tela>
  );
}
