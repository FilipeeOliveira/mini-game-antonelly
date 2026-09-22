import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { BANCO_PERGUNTAS } from "@/data/perguntas";
import { sortearPerguntas, mensagemResultado, embaralhar } from "@/game/engine";
import type { ItemPartida, ResultadoPartida, Partida } from "@/game/types";
import { sons, musica } from "@/game/audio";
import { preloadImagens } from "@/game/preloadImagens";
import { TODOS_FUNDOS, FUNDOS_PERGUNTA, FUNDO_RESULTADO } from "@/config/backgrounds";
import { calcularPremio, logMapaPremios } from "@/game/premiacao";
import {
  listarHistorico,
  salvarPartida,
  zerarHistoricoDoDia,
  zerarHistoricoCompleto,
  contarBrindesPorTipo,
  historicoParaCSV,
} from "@/game/historico";
import { janelaPartidas } from "@/game/ranking";
import { RANKING_JANELA } from "@/config/ranking";
import { baixarRankingPDF } from "@/game/pdf";
import { PainelOperador } from "@/components/PainelOperador";
import { Canvas1080 } from "@/components/Canvas1080";
import { Abertura } from "@/screens/Abertura";
import { NomeJogador } from "@/screens/NomeJogador";
import { Jogo } from "@/screens/Jogo";
import { Resultado } from "@/screens/Resultado";
import { Ranking } from "@/screens/Ranking";

const CONFIG = {
  perguntasPorPartida: 6,
  segundosPorPergunta: 25,
  msFeedbackCerto: 2000,
  msFeedbackErrado: 2900,
  // Único valor de ociosidade pra toda tela que não seja a abertura
  // (inclusive o teclado de nome e o ranking) - volta pra abertura e
  // descarta a partida em andamento, que já não é salva no histórico
  // porque isto só acontece em finalizarPartida.
  segundosOcioso: 60,
  embaralharAlternativas: true,
};

type Tela = "abertura" | "nome" | "jogo" | "resultado" | "ranking";
type OrigemRanking = "abertura" | "resultado";

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

  const [nomeJogador, setNomeJogador] = useState("JOGADOR");
  const [premioAtual, setPremioAtual] = useState<string | null>(null);
  const [idPartidaAtual, setIdPartidaAtual] = useState<string | null>(null);
  const [origemRanking, setOrigemRanking] = useState<OrigemRanking>("abertura");
  const [partidasRanking, setPartidasRanking] = useState<Partida[]>([]);
  const [painelDados, setPainelDados] = useState({
    partidasHoje: 0,
    partidasEvento: 0,
    brindesPorTipo: {} as Record<string, number>,
  });

  const sacolaRef = useRef<number[]>([]);
  const ociosoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicaIniciadaRef = useRef(false);

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

  // Loga o mapa acertos -> % -> prêmio uma vez no boot, pra conferência.
  useEffect(() => {
    logMapaPremios(CONFIG.perguntasPorPartida);
  }, []);

  // Música de fundo (loop arcade de 15s - ver game/audio.ts): navegadores
  // bloqueiam áudio sem gesto do usuário, então o loop só pode começar no
  // primeiro toque em qualquer lugar do totem, igual ao desbloqueio do
  // AudioContext que os bips de sons.* já dependiam.
  useEffect(() => {
    function aoPrimeiroToque() {
      if (musicaIniciadaRef.current) return;
      musicaIniciadaRef.current = true;
      musica.iniciar(somLigado);
    }
    document.addEventListener("pointerdown", aoPrimeiroToque);
    return () => document.removeEventListener("pointerdown", aoPrimeiroToque);
  }, [somLigado]);

  // Alterna o volume da música junto com o botão de som do painel do
  // operador, sem parar/reagendar o loop (ver musica.setVolume).
  useEffect(() => {
    if (!musicaIniciadaRef.current) return;
    musica.setVolume(somLigado);
  }, [somLigado]);

  const tocar = useCallback(
    (som: keyof typeof sons) => {
      if (!somLigado) return;
      sons[som]();
    },
    [somLigado]
  );

  function atualizarPainelDados() {
    const historico = listarHistorico();
    setPainelDados({
      partidasHoje: janelaPartidas(historico, "dia").length,
      partidasEvento: historico.length,
      brindesPorTipo: contarBrindesPorTipo(historico),
    });
  }

  // Carrega os números do histórico só quando o painel abre - é um painel
  // raramente usado, não precisa de um estado global reativo.
  useEffect(() => {
    if (painelAberto) atualizarPainelDados();
  }, [painelAberto]);

  // Recarrega o ranking sempre que a tela abre, com a janela configurada
  // (dia/evento - ver config/ranking.ts).
  useEffect(() => {
    if (tela === "ranking") setPartidasRanking(janelaPartidas(listarHistorico(), RANKING_JANELA));
  }, [tela]);

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
    setPremioAtual(null);
    setIdPartidaAtual(null);
    setTela("jogo");
  }

  function finalizarPartida(res: ResultadoPartida) {
    const premio = calcularPremio(res.percentual);
    const partida: Partida = {
      id: crypto.randomUUID(),
      nome: nomeJogador,
      acertos: res.acertos,
      total: res.total,
      percentual: res.percentual,
      // Reaproveita tempoTotalMs (soma dos tempos de resposta) em vez de um
      // cronômetro de parede novo: como o tempo só serve de desempate entre
      // percentuais iguais, e nesse caso a pausa de feedback acumulada é
      // idêntica pros dois jogadores (mesmo número de acertos/erros), a
      // ordenação relativa é sempre a mesma - sem precisar tocar em Jogo.tsx.
      tempoMs: res.tempoTotalMs,
      premio,
      timestamp: Date.now(),
    };
    // Grava assim que a partida termina, não ao sair da tela.
    salvarPartida(partida);

    setResultado(res);
    setPremioAtual(premio);
    setIdPartidaAtual(partida.id);
    setPartidas((p) => p + 1);
    setSomaPercentual((s) => s + res.percentual);
    tocar("fim");
    setTela("resultado");
  }

  function voltarAbertura() {
    setTela("abertura");
  }

  // som de toque nos botões grandes de navegação (fiel ao HTML original:
  // btn-comecar, btn-denovo e btn-sair chamam somToque() antes de navegar,
  // convenção estendida aqui pras novas telas de nome/ranking).
  function comecarComSom() {
    tocar("toque");
    setTela("nome");
  }

  function confirmarNomeComSom(nome: string) {
    tocar("toque");
    setNomeJogador(nome);
    iniciarPartida();
  }

  function voltarDoNomeComSom() {
    tocar("toque");
    voltarAbertura();
  }

  function proximoJogadorComSom() {
    tocar("toque");
    voltarAbertura();
  }

  function abrirRankingComSom(origem: OrigemRanking) {
    tocar("toque");
    setOrigemRanking(origem);
    setTela("ranking");
  }

  function voltarDoRankingComSom() {
    tocar("toque");
    setTela(origemRanking);
  }

  function exportarCSV() {
    const csv = historicoParaCSV(listarHistorico());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `desafio-antonelly-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function baixarPDF() {
    baixarRankingPDF(listarHistorico());
  }

  function zerarRankingDia() {
    zerarHistoricoDoDia();
    atualizarPainelDados();
  }

  function zerarTudo() {
    zerarHistoricoCompleto();
    atualizarPainelDados();
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

  // timeout de ociosidade: volta pra abertura sem toque na tela, em
  // qualquer tela que não seja a abertura (nome, jogo, resultado, ranking -
  // inclusive o teclado virtual, que dispara pointerdown como qualquer
  // outro toque). Descarta a partida em andamento: nada foi salvo no
  // histórico até finalizarPartida rodar.
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
        ociosoRef.current = setTimeout(() => setPainelAberto(false), CONFIG.segundosOcioso * 1000);
        return;
      }
      ociosoRef.current = setTimeout(voltarAbertura, CONFIG.segundosOcioso * 1000);
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
      {/* AnimatePresence (motion/react) dá saída animada às telas, não só
          entrada: sem isto, a tela antiga some no frame seguinte enquanto
          a nova esmaece por cima (.tela é position:absolute - ver
          theme.css - então as duas se sobrepõem exatamente no lugar
          certo durante a troca). Cada tela precisa de uma key estável -
          usar `tela` mantém a identidade de cada ramo entre re-renders
          (ex.: erros de nome dentro de "nome" não devem re-disparar a
          transição). */}
      <AnimatePresence>
        {tela === "abertura" && (
          <Abertura
            key="abertura"
            pronto={fundosProntos}
            onComecar={comecarComSom}
            onAbrirPainel={() => setPainelAberto(true)}
            onAbrirRanking={() => abrirRankingComSom("abertura")}
          />
        )}

        {tela === "nome" && (
          <NomeJogador key="nome" onConfirmar={confirmarNomeComSom} onVoltar={voltarDoNomeComSom} />
        )}

        {tela === "jogo" && itens.length > 0 && (
          <Jogo
            key="jogo"
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
            key="resultado"
            fundo={FUNDO_RESULTADO}
            percentual={resultado.percentual}
            acertos={resultado.acertos}
            total={resultado.total}
            mensagem={mensagemResultado(resultado.percentual)}
            premio={premioAtual}
            segundosAutoVolta={CONFIG.segundosOcioso}
            onProximoJogador={proximoJogadorComSom}
            onAbrirRanking={() => abrirRankingComSom("resultado")}
            onAutoVolta={voltarAbertura}
          />
        )}

        {tela === "ranking" && (
          <Ranking
            key="ranking"
            partidas={partidasRanking}
            idJogadorAtual={origemRanking === "resultado" ? idPartidaAtual : null}
            onVoltar={voltarDoRankingComSom}
          />
        )}
      </AnimatePresence>

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
        partidasHoje={painelDados.partidasHoje}
        partidasEvento={painelDados.partidasEvento}
        brindesPorTipo={painelDados.brindesPorTipo}
        onExportarCSV={exportarCSV}
        onBaixarPDF={baixarPDF}
        onZerarRankingDia={zerarRankingDia}
        onZerarTudo={zerarTudo}
      />
    </Canvas1080>
  );
}
