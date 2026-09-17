import { useCallback, useEffect, useRef, useState } from "react";
import { BANCO_PERGUNTAS } from "@/data/perguntas";
import { sortearPerguntas, mensagemResultado, embaralhar } from "@/game/engine";
import type { ItemPartida, ResultadoPartida } from "@/game/types";
import { sons } from "@/game/audio";
import { preloadImagens } from "@/game/preloadImagens";
import { TODOS_FUNDOS, FUNDOS_PERGUNTA, FUNDO_RESULTADO } from "@/config/backgrounds";
import { PainelOperador } from "@/components/PainelOperador";
import { Canvas1080 } from "@/components/Canvas1080";
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
  const [fundosPerguntas, setFundosPerguntas] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [somLigado, setSomLigado] = useState(true);
  const [partidas, setPartidas] = useState(0);
  const [somaPercentual, setSomaPercentual] = useState(0);
  const [fundosProntos, setFundosProntos] = useState(false);
  const sacolaRef = useRef<number[]>([]);
  const ociosoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload de todos os backgrounds no boot, antes de liberar "Vamos
  // começar" - o totem roda o dia inteiro em loop e não pode piscar branco
  // esperando uma imagem local carregar.
  useEffect(() => {
    let ativo = true;
    preloadImagens(TODOS_FUNDOS).then(() => {
      if (ativo) setFundosProntos(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

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
    // Sorteia os fundos da partida sem repetição: embaralha o pool e usa os
    // primeiros N (o pool tem o mesmo tamanho de uma partida - 6 fundos para
    // 6 perguntas - então cada pergunta ganha um fundo diferente).
    setFundosPerguntas(embaralhar(FUNDOS_PERGUNTA).slice(0, novosItens.length));
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
        // wake lock é best-effort - pode não estar disponível no navegador/contexto
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
  // cedo na marca - ver fix em Abertura.tsx). Sem isto, um painel aberto por
  // acidente nunca fecharia sozinho: `tela` já é "abertura", então o ramo
  // antigo devolvia cedo sem armar nada, e `voltarAbertura` (chamado nos
  // outros ramos) não mexe em `painelAberto` - o totem ficaria fora de
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

  return (
    <Canvas1080>
      {tela === "abertura" && (
        <Abertura pronto={fundosProntos} onComecar={comecarComSom} onAbrirPainel={() => setPainelAberto(true)} />
      )}

      {tela === "jogo" && itens.length > 0 && (
        <Jogo
          itens={itens}
          fundos={fundosPerguntas}
          segundosPorPergunta={CONFIG.segundosPorPergunta}
          msFeedbackCerto={CONFIG.msFeedbackCerto}
          msFeedbackErrado={CONFIG.msFeedbackErrado}
          onTocar={tocar}
          onFim={finalizarPartida}
        />
      )}

      {tela === "resultado" && resultado && (
        <Resultado
          fundo={FUNDO_RESULTADO}
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
    </Canvas1080>
  );
}
