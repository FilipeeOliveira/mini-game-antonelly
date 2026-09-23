import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ItemPartida, ResultadoPartida } from "@/game/types";
import { calcularPercentual } from "@/game/engine";
import { TelaFundo } from "@/components/TelaFundo";
import ClickSpark from "@/components/ClickSpark";
import { Tela } from "@/components/Tela";
import { useAjustarFonte } from "@/hooks/useAjustarFonte";

const LETRAS = ["A", "B", "C", "D"];
// Últimos N segundos da pergunta em que a barra de tempo vira vermelha
// (.tempo__barra--curta), fiel ao `iniciarCronometro` do original.
const SEGUNDOS_BARRA_CURTA = 6;

function IconeCheck() {
  return (
    <svg className="alt__check" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// comIcone entra nas deps de propósito: o texto tem o espaço calculado com
// o layout de ANTES de responder (só letra + texto). Quando a alternativa
// certa é revelada (resposta ou tempo esgotado), o IconeCheck aparece do
// lado dela e aperta o espaço de .alt__txt (gap:39px em .alt soma mais um
// vizinho) - sem isto aqui, o font-size continuava o mesmo de antes do
// ícone existir, e um texto comprido que já estava no limite vazava da
// caixa bem na hora de revelar a resposta certa.
function TextoAlternativa({ texto, comIcone }: { texto: string; comIcone: boolean }) {
  const { ref, fonte } = useAjustarFonte<HTMLSpanElement>(44, 20, [texto, comIcone]);
  return (
    <span ref={ref} className="alt__txt" style={{ fontSize: fonte }}>
      {texto}
    </span>
  );
}

// Mesmo motivo do TextoAlternativa: o hook precisa viver DENTRO do bloco
// com key={indice}. Quando ficava em Jogo, a troca de pergunta rodava o
// ajuste com o ref ainda apontando pro <h2> que estava saindo
// (AnimatePresence mode="wait" mantém o antigo na tela durante o exit) - a
// pergunta nova herdava o tamanho que servia pra anterior e era cortada.
function TextoPergunta({ texto }: { texto: string }) {
  const { ref, fonte } = useAjustarFonte<HTMLHeadingElement>(58, 32, [texto]);
  return (
    <h2 ref={ref} className="pergunta" style={{ fontSize: fonte }}>
      {texto}
    </h2>
  );
}

type JogoProps = {
  itens: ItemPartida[];
  fundos: string[];
  segundosPorPergunta: number;
  msFeedbackCerto: number;
  msFeedbackErrado: number;
  onTocar?: (som: "toque" | "certo" | "errado") => void;
  onProgresso?: (indiceAtual: number) => void;
  onFim: (resultado: ResultadoPartida) => void;
};

export function Jogo({
  itens,
  fundos,
  segundosPorPergunta,
  msFeedbackCerto,
  msFeedbackErrado,
  onTocar,
  onProgresso,
  onFim,
}: JogoProps) {
  const [indice, setIndice] = useState(0);
  const [escolhaIdx, setEscolhaIdx] = useState<number | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [barraCurta, setBarraCurta] = useState(false);
  const acertosRef = useRef(0);
  const temposRef = useRef<number[]>([]);
  const inicioPerguntaRef = useRef(Date.now());
  // Guarda de resposta única. Não pode ser o state `bloqueado`: o
  // setTimeout do cronômetro abaixo fecha sobre a função `responder` (e,
  // se a guarda usasse o state, sobre a cópia de `bloqueado` congelada
  // naquela renderização específica). Na última pergunta da partida,
  // `responder` nunca chama setIndice (vai direto para onFim), então o
  // efeito abaixo nunca reexecuta e o cronômetro nunca é cancelado - se o
  // jogador responder perto do fim da contagem, esse setTimeout antigo
  // ainda dispara mais tarde e chama `responder` de novo, com a guarda
  // lendo aquele valor congelado em vez do valor atual (ver o teste "não
  // processa duas vezes..." abaixo, que reproduz o caso onde esse valor
  // congelado é `false`). Um ref é lido de forma síncrona e sempre
  // reflete o valor atual, então bloqueia corretamente.
  const bloqueadoRef = useRef(false);
  // Timer do avanço/fim pós-feedback (equivalente a `avancar` no HTML
  // original). Não é limpo automaticamente por nenhum outro efeito: se o
  // componente desmontar durante o atraso de feedback (por exemplo, o
  // timeout ocioso de 45s da Task 11 abandonando a rodada), esse timeout
  // dispara depois e chama onFim numa tela da qual o app já saiu. Guardado
  // em ref e limpo tanto no cleanup de desmonte quanto no próprio início de
  // `responder`, para não ficar órfão se uma pergunta nova renderizar antes
  // dele disparar.
  const avancarRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = itens[indice];
  const idxCerta = item.alternativas.findIndex((a) => a.certa);

  useEffect(() => {
    bloqueadoRef.current = false;
    setEscolhaIdx(null);
    setBloqueado(false);
    setBarraCurta(false);
    inicioPerguntaRef.current = Date.now();

    if (!segundosPorPergunta) return;
    const cronometro = setTimeout(() => {
      responder(-1, false);
    }, segundosPorPergunta * 1000);
    let corridoBarraCurta: ReturnType<typeof setTimeout> | undefined;
    if (segundosPorPergunta > SEGUNDOS_BARRA_CURTA) {
      corridoBarraCurta = setTimeout(
        () => setBarraCurta(true),
        (segundosPorPergunta - SEGUNDOS_BARRA_CURTA) * 1000
      );
    }
    return () => {
      clearTimeout(cronometro);
      if (corridoBarraCurta) clearTimeout(corridoBarraCurta);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  useEffect(() => {
    return () => {
      if (avancarRef.current) clearTimeout(avancarRef.current);
    };
  }, []);

  function responder(idxEscolhido: number, certa: boolean) {
    if (bloqueadoRef.current) return;
    bloqueadoRef.current = true;
    setBloqueado(true);
    setEscolhaIdx(idxEscolhido);

    const tempo = Date.now() - inicioPerguntaRef.current;
    temposRef.current = [...temposRef.current, tempo];

    if (certa) {
      acertosRef.current += 1;
      onTocar?.("certo");
    } else {
      onTocar?.("errado");
    }

    onProgresso?.(indice + 1);

    if (avancarRef.current) clearTimeout(avancarRef.current);
    const espera = certa ? msFeedbackCerto : msFeedbackErrado;
    avancarRef.current = setTimeout(() => {
      avancarRef.current = null;
      if (indice + 1 >= itens.length) {
        onFim({
          acertos: acertosRef.current,
          total: itens.length,
          percentual: calcularPercentual(acertosRef.current, itens.length),
          tempoTotalMs: temposRef.current.reduce((a, b) => a + b, 0),
          tempoRespostasMs: temposRef.current,
        });
      } else {
        setIndice((i) => i + 1);
      }
    }, espera);
  }

  return (
    <Tela className="jogo">
      <TelaFundo src={fundos[indice]} />

      <div className="jogo__hud">
        <div className="marca">Desafio Antonelly</div>
        <div className="contador">
          <b>{indice + 1}</b> / {itens.length}
        </div>
      </div>
      <div className="tempo">
        <div
          // key={indice} força a remontagem do elemento a cada pergunta,
          // reiniciando a animação CSS do zero (equivalente a reatribuir
          // width/transition no `iniciarCronometro` do original).
          key={indice}
          className={["tempo__barra", barraCurta ? "tempo__barra--curta" : ""]
            .filter(Boolean)
            .join(" ")}
          style={{
            animationDuration: `${segundosPorPergunta}s`,
            // Congela a barra onde estiver assim que o jogador responde, em
            // vez de continuar drenando durante a pausa de feedback - fiel
            // ao original, que parava o cronômetro ao responder.
            animationPlayState: bloqueado ? "paused" : "running",
          }}
        />
      </div>

      {/* Transição entre perguntas: key={indice} faz o AnimatePresence tratar
          cada pergunta como um bloco novo, esmaecendo/deslizando a antiga pra
          fora antes da próxima entrar (mode="wait" - sobrepor o texto de duas
          perguntas ao mesmo tempo, no mesmo lugar da tela, ficaria ilegível).
          Fica de fora do HUD/barra de tempo, que não devem reiniciar a cada
          pergunta. Sem posicionamento próprio no wrapper (nem transform) -
          .pergunta/.alternativas continuam absolute com as mesmas coordenadas
          de sempre, herdadas de .tela (ver theme.css). */}
      <AnimatePresence mode="wait">
        <motion.div
          key={indice}
          className="jogo__pergunta-bloco"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
        >
          <TextoPergunta texto={item.pergunta} />

          <ClickSpark sparkColor="#fff" sparkCount={10} sparkSize={12} sparkRadius={26} duration={450}>
            <div className="alternativas">
              {item.alternativas.map((alt, i) => {
                const classes = ["alt"];
                const comIcone = bloqueado && i === idxCerta;
                if (bloqueado) {
                  if (i === idxCerta) classes.push("alt--certa");
                  else if (i === escolhaIdx) classes.push("alt--errada");
                  else classes.push("alt--apagada");
                }
                return (
                  <button
                    key={alt.texto}
                    type="button"
                    className={classes.join(" ")}
                    disabled={bloqueado}
                    onClick={() => {
                      onTocar?.("toque");
                      responder(i, alt.certa);
                    }}
                  >
                    <span className="alt__letra">{LETRAS[i]}</span>
                    <TextoAlternativa texto={alt.texto} comIcone={comIcone} />
                    {comIcone && <IconeCheck />}
                  </button>
                );
              })}
            </div>
          </ClickSpark>
        </motion.div>
      </AnimatePresence>
    </Tela>
  );
}
