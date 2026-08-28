import { useCallback, useEffect, useRef, useState } from "react";
import { BANCO_PERGUNTAS } from "@/data/perguntas";
import { sortearPerguntas, mensagemResultado } from "@/game/engine";
import type { ItemPartida, ResultadoPartida } from "@/game/types";
import { sons } from "@/game/audio";
import { RioNivel, type MarcaRegua } from "@/components/RioNivel";
import { PainelOperador } from "@/components/PainelOperador";
import { Abertura } from "@/screens/Abertura";
import { Jogo } from "@/screens/Jogo";
import { Resultado } from "@/screens/Resultado";

const CONFIG = {
  perguntasPorPartida: 6,
  segundosPorPergunta: 25,
  msFeedbackCerto: 2000,
  msFeedbackErrado: 2900,
  segundosOciosoJogo: 45,
  segundosOciosoResultado: 25,
  embaralharAlternativas: true,
};

type Tela = "abertura" | "jogo" | "resultado";

export function App() {
  const [tela, setTela] = useState<Tela>("abertura");
  const [itens, setItens] = useState<ItemPartida[]>([]);
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [painelAberto, setPainelAberto] = useState(false);
  const [somLigado, setSomLigado] = useState(true);
  const [partidas, setPartidas] = useState(0);
  const [somaPercentual, setSomaPercentual] = useState(0);
  const sacolaRef = useRef<number[]>([]);
  const ociosoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tocar = useCallback(
    (som: keyof typeof sons) => {
      if (!somLigado) return;
      sons[som]();
    },
    [somLigado]
  );

  function iniciarPartida() {
    const { itens: novosItens, sacolaRestante } = sortearPerguntas(
      BANCO_PERGUNTAS,
      sacolaRef.current,
      CONFIG.perguntasPorPartida,
      CONFIG.embaralharAlternativas
    );
    sacolaRef.current = sacolaRestante;
    setItens(novosItens);
    setIndiceAtual(0);
    setResultado(null);
    setTela("jogo");
  }

  function finalizarPartida(res: ResultadoPartida) {
    setResultado(res);
    setPartidas((p) => p + 1);
    setSomaPercentual((s) => s + res.percentual);
    tocar("fim");
    setTela("resultado");
  }

  function voltarAbertura() {
    setTela("abertura");
  }

  // som de toque nos três botões grandes de navegação (fiel ao HTML
  // original: btn-comecar, btn-denovo e btn-sair chamam somToque() antes de
  // navegar). Envolvido aqui, e não como prop nova em Abertura/Resultado,
  // porque App já é quem possui `tocar` e os callbacks de navegação.
  function comecarComSom() {
    tocar("toque");
    iniciarPartida();
  }

  function jogarDeNovoComSom() {
    tocar("toque");
    iniciarPartida();
  }

  function proximoJogadorComSom() {
    tocar("toque");
    voltarAbertura();
  }

  // comportamentos de quiosque: bloquear menu de contexto, arrastar e gestos
  useEffect(() => {
    const prevenir = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevenir);
    document.addEventListener("dragstart", prevenir);
    document.addEventListener("gesturestart", prevenir);
    return () => {
      document.removeEventListener("contextmenu", prevenir);
      document.removeEventListener("dragstart", prevenir);
      document.removeEventListener("gesturestart", prevenir);
    };
  }, []);

  // manter a tela sempre acesa
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function manterAcordado() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // wake lock é best-effort — pode não estar disponível no navegador/contexto
      }
    }
    function aoVisivel() {
      if (document.visibilityState === "visible") manterAcordado();
    }
    document.addEventListener("visibilitychange", aoVisivel);
    manterAcordado();
    return () => {
      document.removeEventListener("visibilitychange", aoVisivel);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  // timeout de ociosidade: volta pra abertura sem toque na tela
  //
  // Também cobre o painel do operador quando ele fica aberto por engano
  // sobre a própria tela de abertura (ex.: dois dedos pousando e soltando
  // cedo na marca — ver fix em Abertura.tsx). Sem isto, um painel aberto por
  // acidente nunca fecharia sozinho: `tela` já é "abertura", então o ramo
  // antigo devolvia cedo sem armar nada, e `voltarAbertura` (chamado nos
  // outros ramos) não mexe em `painelAberto` — o totem ficaria fora de
  // serviço, bloqueado atrás do painel, até um humano notar.
  useEffect(() => {
    function reiniciarOcioso() {
      if (ociosoRef.current) clearTimeout(ociosoRef.current);
      if (tela === "abertura" && !painelAberto) return;
      if (tela === "abertura") {
        // painel aberto sobre a abertura: nada de navegação de tela a
        // fazer, só fechar o painel se ficar parado tempo demais.
        ociosoRef.current = setTimeout(
          () => setPainelAberto(false),
          CONFIG.segundosOciosoJogo * 1000
        );
        return;
      }
      const segundos =
        tela === "resultado" ? CONFIG.segundosOciosoResultado + 5 : CONFIG.segundosOciosoJogo;
      ociosoRef.current = setTimeout(voltarAbertura, segundos * 1000);
    }
    reiniciarOcioso();
    document.addEventListener("pointerdown", reiniciarOcioso);
    return () => {
      document.removeEventListener("pointerdown", reiniciarOcioso);
      if (ociosoRef.current) clearTimeout(ociosoRef.current);
    };
  }, [tela, painelAberto]);

  const marcasRegua: MarcaRegua[] =
    tela === "jogo"
      ? Array.from({ length: itens.length + 1 }, (_, i) => ({
          valor: i,
          rotulo: String(i).padStart(2, "0"),
          posPercent: 8 + i * (26 / itens.length),
          ativa: i === indiceAtual,
        }))
      : tela === "resultado" && resultado
      ? [0, 25, 50, 75, 100].map((v) => ({
          valor: v,
          rotulo: `${v}%`,
          posPercent: 8 + v * 0.62,
          ativa: v === resultado.percentual,
        }))
      : [];

  const nivelPercent =
    tela === "jogo"
      ? 8 + indiceAtual * (26 / Math.max(itens.length, 1))
      : tela === "resultado" && resultado
      ? 8 + resultado.percentual * 0.62
      : 10;

  return (
    <>
      <RioNivel nivelPercent={nivelPercent} marcas={marcasRegua} />

      {tela === "abertura" && (
        <Abertura onComecar={comecarComSom} onAbrirPainel={() => setPainelAberto(true)} />
      )}

      {tela === "jogo" && itens.length > 0 && (
        <Jogo
          itens={itens}
          segundosPorPergunta={CONFIG.segundosPorPergunta}
          msFeedbackCerto={CONFIG.msFeedbackCerto}
          msFeedbackErrado={CONFIG.msFeedbackErrado}
          onTocar={tocar}
          onProgresso={setIndiceAtual}
          onFim={finalizarPartida}
        />
      )}

      {tela === "resultado" && resultado && (
        <Resultado
          percentual={resultado.percentual}
          acertos={resultado.acertos}
          total={resultado.total}
          mensagem={mensagemResultado(resultado.percentual)}
          segundosAutoVolta={CONFIG.segundosOciosoResultado}
          onJogarDeNovo={jogarDeNovoComSom}
          onProximoJogador={proximoJogadorComSom}
          onAutoVolta={voltarAbertura}
        />
      )}

      <PainelOperador
        aberto={painelAberto}
        partidas={partidas}
        mediaPercentual={partidas ? Math.round(somaPercentual / partidas) : null}
        tamanhoBanco={BANCO_PERGUNTAS.length}
        somLigado={somLigado}
        onFechar={() => setPainelAberto(false)}
        onAlternarSom={() => setSomLigado((s) => !s)}
        onZerar={() => {
          setPartidas(0);
          setSomaPercentual(0);
        }}
        onTelaCheia={() => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
          else document.exitFullscreen?.();
        }}
      />
    </>
  );
}
