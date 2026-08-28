import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";
import { sons } from "@/game/audio";

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

    // com o shuffle virando identidade, a alternativa correta de toda
    // pergunta do banco cai sempre no índice 0 (ver Task 2: todo `correta: 0`)
    for (let i = 0; i < 5; i++) {
      const botoes = screen.getAllByRole("button").filter((b) => b.className.includes("alt"));
      act(() => {
        fireEvent.click(botoes[0]);
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("5 de 5 perguntas certas")).toBeInTheDocument();
  });

  it("'Jogar de novo' no resultado inicia uma nova partida", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    for (let i = 0; i < 5; i++) {
      const botoes = screen.getAllByRole("button").filter((b) => b.className.includes("alt"));
      act(() => {
        fireEvent.click(botoes[0]);
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }
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
    for (let i = 0; i < 5; i++) {
      const botoes = screen.getAllByRole("button").filter((b) => b.className.includes("alt"));
      act(() => {
        fireEvent.click(botoes[0]);
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }
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
