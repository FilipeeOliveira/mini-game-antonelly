import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";

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
