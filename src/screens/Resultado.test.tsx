import type { ComponentProps } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Resultado } from "./Resultado";

describe("Resultado", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function montar(props: Partial<ComponentProps<typeof Resultado>> = {}) {
    return render(
      <Resultado
        percentual={80}
        acertos={4}
        total={5}
        mensagem="Quase lá em cima: só faltou um palmo de água"
        segundosAutoVolta={25}
        onJogarDeNovo={() => {}}
        onProximoJogador={() => {}}
        {...props}
      />
    );
  }

  it("mostra a porcentagem, a mensagem e a contagem de acertos", () => {
    montar();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Quase lá em cima: só faltou um palmo de água")).toBeInTheDocument();
    expect(screen.getByText("4 de 5 perguntas certas")).toBeInTheDocument();
  });

  it("chama onJogarDeNovo ao clicar em 'Jogar de novo'", () => {
    const onJogarDeNovo = vi.fn();
    montar({ onJogarDeNovo });
    fireEvent.click(screen.getByRole("button", { name: /jogar de novo/i }));
    expect(onJogarDeNovo).toHaveBeenCalledTimes(1);
  });

  it("chama onProximoJogador ao clicar em 'Próximo jogador'", () => {
    const onProximoJogador = vi.fn();
    montar({ onProximoJogador });
    fireEvent.click(screen.getByRole("button", { name: /próximo jogador/i }));
    expect(onProximoJogador).toHaveBeenCalledTimes(1);
  });

  it("chama onProximoJogador automaticamente após segundosAutoVolta", () => {
    const onProximoJogador = vi.fn();
    montar({ segundosAutoVolta: 3, onProximoJogador });
    vi.advanceTimersByTime(3000);
    expect(onProximoJogador).toHaveBeenCalledTimes(1);
  });

  it("para o intervalo de contagem regressiva ao chegar em 0, sem continuar disparando", () => {
    montar({ segundosAutoVolta: 2 });
    vi.advanceTimersByTime(2000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
