import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Ranking } from "./Ranking";
import type { Partida } from "@/game/types";

function partida(sobrescreve: Partial<Partida>): Partida {
  return {
    id: "x",
    nome: "JOGADOR",
    acertos: 0,
    total: 6,
    percentual: 0,
    tempoMs: 0,
    premio: null,
    timestamp: 0,
    ...sobrescreve,
  };
}

describe("Ranking", () => {
  it("com 1 partida só, preenche as posições 2ª/3ª do pódio e a lista com traços, sem quebrar o layout", () => {
    const { container } = render(
      <Ranking partidas={[partida({ id: "1", nome: "ANA", percentual: 80 })]} idJogadorAtual={null} onVoltar={() => {}} />
    );
    expect(screen.getByText("ANA")).toBeInTheDocument();
    expect(container.querySelectorAll(".podio__coluna")).toHaveLength(3);
    expect(container.querySelectorAll(".podio__coluna--vazia")).toHaveLength(2);
    // traços: nome+valor das 2 colunas vazias do pódio, + nome+percentual+tempo das posições 4ª/5ª
    expect(screen.getAllByText("—")).toHaveLength(2 * 2 + 2 * 3);
  });

  it("mostra o top 3 no pódio e as posições 4ª/5ª na lista, ordenados", () => {
    const partidas = Array.from({ length: 8 }, (_, i) =>
      partida({ id: String(i), nome: `J${i}`, percentual: i * 10 })
    );
    render(<Ranking partidas={partidas} idJogadorAtual={null} onVoltar={() => {}} />);
    expect(screen.getByText("J7")).toBeInTheDocument(); // 1º, no pódio
    expect(screen.getByText("J4")).toBeInTheDocument(); // 4º, na lista
    expect(screen.queryByText("J2")).not.toBeInTheDocument(); // 6º, fora do top 5
  });

  it("destaca a coluna do jogador no pódio quando ele está no top 3", () => {
    const partidas = [partida({ id: "atual", nome: "PEDRO", percentual: 90 })];
    const { container } = render(<Ranking partidas={partidas} idJogadorAtual="atual" onVoltar={() => {}} />);
    expect(container.querySelector(".podio__coluna--destaque")?.textContent).toContain("PEDRO");
    expect(screen.queryByText(/você ficou/i)).not.toBeInTheDocument();
  });

  it("destaca a linha do jogador na lista quando ele está na 4ª ou 5ª posição", () => {
    const partidas = [
      ...Array.from({ length: 3 }, (_, i) => partida({ id: `top-${i}`, percentual: 100 - i })),
      partida({ id: "atual", nome: "PEDRO", percentual: 40 }),
    ];
    const { container } = render(<Ranking partidas={partidas} idJogadorAtual="atual" onVoltar={() => {}} />);
    expect(container.querySelector(".ranking__linha--destaque")?.textContent).toContain("PEDRO");
  });

  it("mostra a posição do jogador quando ele não está no top 5", () => {
    const partidas = [
      ...Array.from({ length: 5 }, (_, i) => partida({ id: `top-${i}`, percentual: 100 - i })),
      partida({ id: "atual", nome: "PEDRO", percentual: 10 }),
    ];
    render(<Ranking partidas={partidas} idJogadorAtual="atual" onVoltar={() => {}} />);
    expect(screen.getByText("Você ficou em 6º")).toBeInTheDocument();
  });

  it("chama onVoltar ao clicar em Voltar", () => {
    const onVoltar = vi.fn();
    render(<Ranking partidas={[]} idJogadorAtual={null} onVoltar={onVoltar} />);
    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });
});
