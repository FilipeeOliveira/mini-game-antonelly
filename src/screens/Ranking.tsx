import { motion } from "motion/react";
import { FUNDO_ABERTURA } from "@/config/backgrounds";
import { TelaFundo } from "@/components/TelaFundo";
import CountUp from "@/components/CountUp";
import { topRanking, posicaoDe, formatarTempo } from "@/game/ranking";
import { RANKING_TAMANHO } from "@/config/ranking";
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
  const top = topRanking(partidas);
  const podio = ORDEM_PODIO.map((posicao) => ({ posicao, partida: top[posicao - 1] ?? null }));
  const resto = Array.from({ length: RANKING_TAMANHO - 3 }, (_, i) => ({
    posicao: i + 4,
    partida: top[i + 3] ?? null,
  }));
  const posicaoJogador = idJogadorAtual ? posicaoDe(partidas, idJogadorAtual) : null;
  const jogadorForaDoTopo = posicaoJogador !== null && posicaoJogador > RANKING_TAMANHO;

  return (
    <section className="tela tela--ativa ranking">
      <TelaFundo src={FUNDO_ABERTURA} />
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
            const destaque = partida !== null && partida.id === idJogadorAtual;
            return (
              <motion.div
                key={partida?.id ?? `vazio-${posicao}`}
                className={["ranking__linha", destaque ? "ranking__linha--destaque" : ""].filter(Boolean).join(" ")}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.28, delay: 0.3 + i * 0.08 }}
              >
                <span className="ranking__pos">{posicao}º</span>
                <span className="ranking__nome">{partida?.nome ?? "—"}</span>
                <span className="ranking__percentual">
                  {partida ? (
                    <>
                      <CountUp to={partida.percentual} duration={0.7} delay={0.3 + i * 0.08} />%
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <span className="ranking__tempo">{partida ? formatarTempo(partida.tempoMs) : "—"}</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {jogadorForaDoTopo && <p className="ranking__posicao-jogador">Você ficou em {posicaoJogador}º</p>}
      <button className="botao-cta botao-cta--fantasma" type="button" onClick={onVoltar}>
        Voltar
      </button>
    </section>
  );
}
