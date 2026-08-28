import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";
import { sons } from "@/game/audio";
import { BANCO_PERGUNTAS } from "@/data/perguntas";

// As perguntas reais têm a resposta certa em posições diferentes (A, B ou C),
// então não dá para clicar sempre no primeiro botão. Este helper lê a pergunta
// que está na tela, encontra-a no banco e clica na alternativa cujo texto é o
// gabarito — independente da ordem em que ela foi sorteada.
function responderCorretamente() {
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
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

// Uma partida tem CONFIG.perguntasPorPartida = 6 perguntas.
function jogarPartidaInteiraAcertandoTudo() {
  for (let i = 0; i < 6; i++) responderCorretamente();
}

describe("App — partida completa", () => {
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
  });

  it("joga uma partida inteira acertando tudo e chega a 100% no resultado", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    expect(screen.getByText("1")).toBeInTheDocument();

    jogarPartidaInteiraAcertandoTudo();

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("6 de 6 perguntas certas")).toBeInTheDocument();
  });

  it("'Jogar de novo' no resultado inicia uma nova partida", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    jogarPartidaInteiraAcertandoTudo();
    fireEvent.click(screen.getByRole("button", { name: /jogar de novo/i }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("App — som de toque nos botões grandes de navegação", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("toca o som de toque ao tocar em 'Toque para começar' com o som ligado", () => {
    const espiaoToque = vi.spyOn(sons, "toque").mockImplementation(() => {});
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));

    expect(espiaoToque).toHaveBeenCalledTimes(1);
  });

  it("não toca o som de toque ao tocar em 'Toque para começar' com o som desligado no painel", () => {
    const espiaoToque = vi.spyOn(sons, "toque").mockImplementation(() => {});
    render(<App />);

    // abre o painel do operador: toque longo (2s) na marca/logo da abertura
    const marca = document.querySelector("[data-marca]");
    expect(marca).not.toBeNull();
    fireEvent.pointerDown(marca as Element);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole("button", { name: /som: ligado/i }));
    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));

    expect(espiaoToque).not.toHaveBeenCalled();
  });

  // Fidelidade ao original: só o listener de clique de btn-sair chama
  // somToque() antes de irParaAbertura(); o auto-retorno da tela de
  // resultado (25s sem toque) chama irParaAbertura() puro, sem som. Se o
  // timeout de auto-retorno tocar som, o totem beepa sozinho para um
  // estande vazio a cada rodada, dezenas/centenas de vezes por dia.
  it("não toca som de toque no auto-retorno silencioso da tela de resultado, sem toque do usuário", () => {
    const espiaoToque = vi.spyOn(sons, "toque").mockImplementation(() => {});
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    jogarPartidaInteiraAcertandoTudo();
    expect(screen.getByText("100")).toBeInTheDocument();

    // zera as chamadas acumuladas até aqui (começar a partida e responder
    // cada pergunta tocam "toque") para isolar só o caminho do auto-retorno.
    espiaoToque.mockClear();

    // segundosOciosoResultado da CONFIG do App = 25s; nenhum toque do
    // usuário acontece nesse intervalo.
    act(() => {
      vi.advanceTimersByTime(25000);
    });

    expect(espiaoToque).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /toque para começar/i })).toBeInTheDocument();
  });
});

describe("App — painel do operador aberto por engano não trava o totem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // O timeout de ociosidade do App retornava cedo sempre que `tela` era
  // "abertura" e `voltarAbertura` nunca mexia em `painelAberto` — então um
  // painel aberto por engano sobre a tela de abertura (ex.: o double-touch
  // fantasma coberto no teste de Abertura.test.tsx) nunca fechava sozinho.
  // Um humano precisava notar e fechar manualmente; até lá, o totem ficava
  // fora de serviço, bloqueado atrás do painel.
  it("fecha sozinho o painel do operador aberto sobre a tela de abertura, sem toque do usuário", () => {
    render(<App />);

    const marca = document.querySelector("[data-marca]");
    expect(marca).not.toBeNull();
    fireEvent.pointerDown(marca as Element);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("Painel do operador")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(45000);
    });

    expect(screen.queryByText("Painel do operador")).not.toBeInTheDocument();
  });
});
