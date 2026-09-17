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
        fundo="fundo-teste.svg"
        percentual={80}
        acertos={5}
        total={6}
        mensagem="Quase lá em cima: só faltou um palmo de água"
        segundosAutoVolta={25}
        onJogarDeNovo={() => {}}
        onProximoJogador={() => {}}
        onAutoVolta={() => {}}
        {...props}
      />
    );
  }

  it("mostra a porcentagem, a mensagem e a contagem de acertos", () => {
    montar();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Quase lá em cima: só faltou um palmo de água")).toBeInTheDocument();
    expect(screen.getByText("5 de 6 perguntas certas")).toBeInTheDocument();
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

  // Nota: este teste testava originalmente "chama onProximoJogador
  // automaticamente após segundosAutoVolta" - mas essa era exatamente a
  // causa do beep fantasma (fix da Task de revisão final): App.tsx
  // encadeia onProximoJogador ao som de toque para o botão, e o timeout de
  // auto-retorno chamava esse mesmo prop, tocando som sozinho a cada
  // rodada. O fix separa os dois caminhos com um prop novo, onAutoVolta,
  // dedicado ao timeout - o teste foi atualizado para verificar o
  // caminho correto (autorizado pelo carve-out de interface da própria
  // spec do fix), mantendo a cobertura de que o auto-retorno dispara e,
  // adicionalmente, travando que ele NÃO chama mais onProximoJogador.
  it("chama onAutoVolta automaticamente após segundosAutoVolta, sem chamar onProximoJogador", () => {
    const onAutoVolta = vi.fn();
    const onProximoJogador = vi.fn();
    montar({ segundosAutoVolta: 3, onAutoVolta, onProximoJogador });
    vi.advanceTimersByTime(3000);
    expect(onAutoVolta).toHaveBeenCalledTimes(1);
    expect(onProximoJogador).not.toHaveBeenCalled();
  });

  it("para o intervalo de contagem regressiva ao chegar em 0, sem continuar disparando", () => {
    montar({ segundosAutoVolta: 2 });
    vi.advanceTimersByTime(2000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
