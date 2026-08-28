import { useEffect, useRef, useState } from "react";
import type { ItemPartida, ResultadoPartida } from "@/game/types";

const LETRAS = ["A", "B", "C", "D"];

type JogoProps = {
  itens: ItemPartida[];
  segundosPorPergunta: number;
  msFeedbackCerto: number;
  msFeedbackErrado: number;
  mostrarFato: boolean;
  onTocar?: (som: "toque" | "certo" | "errado") => void;
  onProgresso?: (indiceAtual: number) => void;
  onFim: (resultado: ResultadoPartida) => void;
};

export function Jogo({
  itens,
  segundosPorPergunta,
  msFeedbackCerto,
  msFeedbackErrado,
  mostrarFato,
  onTocar,
  onProgresso,
  onFim,
}: JogoProps) {
  const [indice, setIndice] = useState(0);
  const [escolhaIdx, setEscolhaIdx] = useState<number | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [veredito, setVeredito] = useState<"certo" | "errado" | null>(null);
  const [expirou, setExpirou] = useState(false);
  const acertosRef = useRef(0);
  const temposRef = useRef<number[]>([]);
  const inicioPerguntaRef = useRef(Date.now());
  // Guarda de resposta única. Não pode ser o state `bloqueado`: o
  // setTimeout do cronômetro abaixo fecha sobre a função `responder` (e,
  // se a guarda usasse o state, sobre a cópia de `bloqueado` congelada
  // naquela renderização específica). Na última pergunta da partida,
  // `responder` nunca chama setIndice (vai direto para onFim), então o
  // efeito abaixo nunca reexecuta e o cronômetro nunca é cancelado — se o
  // jogador responder perto do fim da contagem, esse setTimeout antigo
  // ainda dispara mais tarde e chama `responder` de novo, com a guarda
  // lendo aquele valor congelado em vez do valor atual (ver o teste "não
  // processa duas vezes..." abaixo, que reproduz o caso onde esse valor
  // congelado é `false`). Um ref é lido de forma síncrona e sempre
  // reflete o valor atual, então bloqueia corretamente.
  const bloqueadoRef = useRef(false);

  const item = itens[indice];
  const idxCerta = item.alternativas.findIndex((a) => a.certa);

  useEffect(() => {
    bloqueadoRef.current = false;
    setEscolhaIdx(null);
    setBloqueado(false);
    setVeredito(null);
    setExpirou(false);
    inicioPerguntaRef.current = Date.now();

    if (!segundosPorPergunta) return;
    const cronometro = setTimeout(() => {
      responder(-1, false, true);
    }, segundosPorPergunta * 1000);
    return () => clearTimeout(cronometro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  function responder(idxEscolhido: number, certa: boolean, tempoEsgotado = false) {
    if (bloqueadoRef.current) return;
    bloqueadoRef.current = true;
    setBloqueado(true);
    setEscolhaIdx(idxEscolhido);
    setExpirou(tempoEsgotado);

    const tempo = Date.now() - inicioPerguntaRef.current;
    temposRef.current = [...temposRef.current, tempo];

    if (certa) {
      acertosRef.current += 1;
      setVeredito("certo");
      onTocar?.("certo");
    } else {
      setVeredito("errado");
      onTocar?.("errado");
    }

    onProgresso?.(indice + 1);

    const espera = certa ? msFeedbackCerto : msFeedbackErrado;
    setTimeout(() => {
      if (indice + 1 >= itens.length) {
        onFim({
          acertos: acertosRef.current,
          total: itens.length,
          percentual: Math.round((acertosRef.current / itens.length) * 100),
          tempoTotalMs: temposRef.current.reduce((a, b) => a + b, 0),
          tempoRespostasMs: temposRef.current,
        });
      } else {
        setIndice((i) => i + 1);
      }
    }, espera);
  }

  return (
    <section className="tela tela--ativa">
      <header className="topo">
        <div className="marca">Desafio do Rio</div>
        <div className="contador">
          <b>{indice + 1}</b> / {itens.length}
        </div>
      </header>
      <div className="tempo">
        <div className="tempo__barra" />
      </div>

      <div className="jogo__corpo">
        <h2 className="pergunta">{item.pergunta}</h2>
        <div className="alternativas">
          {item.alternativas.map((alt, i) => {
            const classes = ["alt"];
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
                <span className="alt__txt">{alt.texto}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={[
          "veredito",
          veredito ? "veredito--visivel" : "",
          veredito === "certo" ? "veredito--ok" : "",
          veredito === "errado" ? "veredito--nao" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-live="polite"
      >
        <p className="veredito__titulo">
          {veredito === "certo"
            ? "Isso mesmo!"
            : veredito === "errado"
              ? expirou
                ? "Tempo esgotado"
                : "Não foi essa"
              : ""}
        </p>
        <p className="veredito__fato">{veredito && mostrarFato ? item.fato : ""}</p>
      </div>
    </section>
  );
}
