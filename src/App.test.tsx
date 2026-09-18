import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";
import { sons } from "@/game/audio";
import { BANCO_PERGUNTAS } from "@/data/perguntas";

// Troca de tela agora sai animada (AnimatePresence em App.tsx/Tela.tsx, ver
// components/Tela.tsx). Mesmo com MotionGlobalConfig.skipAnimations = true
// (test/setup.ts) e o requestAnimationFrame trocado por uma versão baseada
// em setTimeout (test/rafShim.ts, pra passar pelo relógio fake), o
// "onComplete" que de fato desmonta a tela que está saindo resolve via
// microtask - `act()` síncrono e `vi.advanceTimersByTime` não esperam essa
// microtask, então a tela antiga fica presa no DOM mesmo depois do avanço.
// Precisa da variante async de ambos (act assíncrono + advanceTimersByTimeAsync,
// que intercala o avanço do relógio com flushes da fila de microtasks) pra
// realmente ver o React desmontar a tela. Sem isto, getByRole/getByText
// encontram elementos duplicados (o antigo + o novo) na primeira query com
// nome repetido entre telas (ex.: os dois botões "Ranking" de abertura e
// resultado). 400ms é bem mais que a duração real da transição (0.32s) e
// bem menos que o menor timer de verdade do app (2000ms de feedback), então
// não risca disparar nada da lógica do jogo.
async function avancarTransicaoDeTela() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
}

// As perguntas reais têm a resposta certa em posições diferentes (A, B ou C),
// então não dá para clicar sempre no primeiro botão. Este helper lê a pergunta
// que está na tela, encontra-a no banco e clica na alternativa cujo texto é o
// gabarito - independente da ordem em que ela foi sorteada.
async function responderCorretamente() {
  const textoPergunta = document.querySelector(".pergunta")?.textContent ?? "";
  const noBanco = BANCO_PERGUNTAS.find((p) => p.pergunta === textoPergunta);
  if (!noBanco) throw new Error(`pergunta fora do banco: ${textoPergunta}`);
  const textoCerto = noBanco.alternativas[noBanco.correta];
  const botao = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("alt") && (b.textContent ?? "").endsWith(textoCerto));
  if (!botao) throw new Error(`alternativa correta não está na tela: ${textoCerto}`);
  act(() => {
    fireEvent.click(botao);
  });
  // msFeedbackCerto da CONFIG do App = 2000ms - depois disso a última
  // pergunta troca pra tela de resultado (transição animada, ver acima).
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
}

// Uma partida tem CONFIG.perguntasPorPartida = 6 perguntas.
async function jogarPartidaInteiraAcertandoTudo() {
  for (let i = 0; i < 6; i++) await responderCorretamente();
}

// App faz preload de todos os backgrounds no boot antes de liberar "Vamos
// começar" (ver src/App.tsx) - o stub de Image em test/setup.ts dispara
// onload via setTimeout(0), então basta avançar os timers fake e deixar o
// microtask do preload resolver para o botão destravar.
async function aguardarFundosProntos() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

// "Vamos começar" leva pra tela de nome do jogador antes da primeira
// pergunta, e o jogo não inicia sem um nome digitado - estes helpers digitam
// um nome padrão e confirmam, pros testes que não são sobre a identificação
// do jogador em si.
async function digitarNomeEConfirmar(nome = "JOGADOR") {
  for (const letra of nome) {
    fireEvent.click(screen.getByRole("button", { name: letra === " " ? "ESPAÇO" : letra }));
  }
  fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
  await avancarTransicaoDeTela();
}

async function comecarEDigitarNome(nome = "JOGADOR") {
  fireEvent.click(screen.getByRole("button", { name: /vamos começar/i }));
  await avancarTransicaoDeTela();
  await digitarNomeEConfirmar(nome);
}

describe("App - partida completa", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // random = 0.999999 faz o embaralhamento (Fisher-Yates) virar identidade:
    // a sacola sai na ordem original [0,1,2,...] e as alternativas de cada
    // pergunta também mantêm a ordem original do banco.
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("joga uma partida inteira acertando tudo e chega a 100% no resultado", async () => {
    render(<App />);
    await aguardarFundosProntos();

    await comecarEDigitarNome();
    expect(screen.getByText("1")).toBeInTheDocument();

    await jogarPartidaInteiraAcertandoTudo();

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("6 de 6 perguntas certas")).toBeInTheDocument();
  });

  it("'Jogar de novo' no resultado volta pra tela de nome e inicia uma nova partida", async () => {
    render(<App />);
    await aguardarFundosProntos();

    await comecarEDigitarNome();
    await jogarPartidaInteiraAcertandoTudo();
    fireEvent.click(screen.getByRole("button", { name: /jogar de novo/i }));
    await avancarTransicaoDeTela();
    await digitarNomeEConfirmar();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("grava a partida no histórico assim que ela termina", async () => {
    render(<App />);
    await aguardarFundosProntos();

    await comecarEDigitarNome();
    await jogarPartidaInteiraAcertandoTudo();

    const historico = JSON.parse(localStorage.getItem("mga:v1:partidas") ?? "[]");
    expect(historico).toHaveLength(1);
    expect(historico[0]).toMatchObject({ nome: "JOGADOR", acertos: 6, total: 6, percentual: 100, premio: "1 CHOPE" });
  });
});

describe("App - som de toque nos botões grandes de navegação", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("toca o som de toque ao tocar em 'Vamos começar' com o som ligado", async () => {
    const espiaoToque = vi.spyOn(sons, "toque").mockImplementation(() => {});
    render(<App />);
    await aguardarFundosProntos();

    fireEvent.click(screen.getByRole("button", { name: /vamos começar/i }));

    expect(espiaoToque).toHaveBeenCalledTimes(1);
  });

  it("não toca o som de toque ao tocar em 'Vamos começar' com o som desligado no painel", async () => {
    const espiaoToque = vi.spyOn(sons, "toque").mockImplementation(() => {});
    render(<App />);
    await aguardarFundosProntos();

    // abre o painel do operador: toque longo (2s) na marca/logo da abertura
    const marca = document.querySelector("[data-marca]");
    expect(marca).not.toBeNull();
    fireEvent.pointerDown(marca as Element);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole("button", { name: /som: ligado/i }));
    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

    fireEvent.click(screen.getByRole("button", { name: /vamos começar/i }));

    expect(espiaoToque).not.toHaveBeenCalled();
  });

  // Fidelidade ao original: só o listener de clique de btn-sair chama
  // somToque() antes de irParaAbertura(); o auto-retorno da tela de
  // resultado (sem toque) chama irParaAbertura() puro, sem som. Se o
  // timeout de auto-retorno tocar som, o totem beepa sozinho para um
  // estande vazio a cada rodada, dezenas/centenas de vezes por dia.
  it("não toca som de toque no auto-retorno silencioso da tela de resultado, sem toque do usuário", async () => {
    const espiaoToque = vi.spyOn(sons, "toque").mockImplementation(() => {});
    render(<App />);
    await aguardarFundosProntos();

    await comecarEDigitarNome();
    await jogarPartidaInteiraAcertandoTudo();
    expect(screen.getByText("100")).toBeInTheDocument();

    // zera as chamadas acumuladas até aqui (começar a partida, digitar/
    // confirmar o nome e responder cada pergunta tocam "toque") para isolar
    // só o caminho do auto-retorno.
    espiaoToque.mockClear();

    // segundosOcioso da CONFIG do App = 60s; nenhum toque do usuário
    // acontece nesse intervalo.
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(espiaoToque).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /vamos começar/i })).toBeInTheDocument();
  });
});

describe("App - painel do operador aberto por engano não trava o totem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  // O timeout de ociosidade do App retornava cedo sempre que `tela` era
  // "abertura" e `voltarAbertura` nunca mexia em `painelAberto` - então um
  // painel aberto por engano sobre a tela de abertura (ex.: o double-touch
  // fantasma coberto no teste de Abertura.test.tsx) nunca fechava sozinho.
  // Um humano precisava notar e fechar manualmente; até lá, o totem ficava
  // fora de serviço, bloqueado atrás do painel.
  it("fecha sozinho o painel do operador aberto sobre a tela de abertura, sem toque do usuário", async () => {
    render(<App />);
    await aguardarFundosProntos();

    const marca = document.querySelector("[data-marca]");
    expect(marca).not.toBeNull();
    fireEvent.pointerDown(marca as Element);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("Painel do operador")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.queryByText("Painel do operador")).not.toBeInTheDocument();
  });
});

describe("App - identificação do jogador e ranking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("usa o nome digitado na tela de identificação", async () => {
    render(<App />);
    await aguardarFundosProntos();

    fireEvent.click(screen.getByRole("button", { name: /vamos começar/i }));
    await avancarTransicaoDeTela();
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "N" }));
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    await avancarTransicaoDeTela();

    await jogarPartidaInteiraAcertandoTudo();

    const historico = JSON.parse(localStorage.getItem("mga:v1:partidas") ?? "[]");
    expect(historico[0].nome).toBe("ANA");
  });

  it("não inicia a partida se o nome ficar vazio - Confirmar sem digitar nada não avança", async () => {
    render(<App />);
    await aguardarFundosProntos();

    fireEvent.click(screen.getByRole("button", { name: /vamos começar/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(screen.getByText("Digite seu nome para continuar")).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("'Voltar' na tela de nome desiste e retorna pra abertura sem iniciar partida", async () => {
    render(<App />);
    await aguardarFundosProntos();

    fireEvent.click(screen.getByRole("button", { name: /vamos começar/i }));
    await avancarTransicaoDeTela();
    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    await avancarTransicaoDeTela();

    expect(screen.getByRole("button", { name: /vamos começar/i })).toBeInTheDocument();
  });

  it("abre o ranking a partir da abertura e volta pra abertura", async () => {
    render(<App />);
    await aguardarFundosProntos();

    fireEvent.click(screen.getByRole("button", { name: /ranking/i }));
    await avancarTransicaoDeTela();
    expect(screen.getByText("Ranking")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    await avancarTransicaoDeTela();
    expect(screen.getByRole("button", { name: /vamos começar/i })).toBeInTheDocument();
  });

  it("abre o ranking a partir do resultado, destaca o jogador, e volta pro resultado", async () => {
    render(<App />);
    await aguardarFundosProntos();

    await comecarEDigitarNome();
    await jogarPartidaInteiraAcertandoTudo();

    fireEvent.click(screen.getByRole("button", { name: /^ranking$/i }));
    await avancarTransicaoDeTela();
    expect(screen.getByText("JOGADOR")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    await avancarTransicaoDeTela();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("idle na tela de nome (inclusive no teclado) volta pra abertura e descarta a partida", async () => {
    render(<App />);
    await aguardarFundosProntos();

    fireEvent.click(screen.getByRole("button", { name: /vamos começar/i }));
    fireEvent.click(screen.getByRole("button", { name: "A" })); // toque no teclado reinicia o ocioso

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByRole("button", { name: /vamos começar/i })).toBeInTheDocument();
    expect(listarHistoricoDoTeste()).toHaveLength(0);
  });
});

function listarHistoricoDoTeste(): unknown[] {
  return JSON.parse(localStorage.getItem("mga:v1:partidas") ?? "[]");
}
