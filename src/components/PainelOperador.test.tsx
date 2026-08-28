import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PainelOperador } from "./PainelOperador";

function propsPadrao() {
  return {
    aberto: true,
    partidas: 3,
    mediaPercentual: 60,
    tamanhoBanco: 30,
    somLigado: true,
    onFechar: vi.fn(),
    onAlternarSom: vi.fn(),
    onZerar: vi.fn(),
    onTelaCheia: vi.fn(),
  };
}

describe("PainelOperador", () => {
  it("não renderiza nada quando fechado", () => {
    const { container } = render(<PainelOperador {...propsPadrao()} aberto={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra as estatísticas quando aberto", () => {
    render(<PainelOperador {...propsPadrao()} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("mostra travessão quando não há média ainda", () => {
    render(<PainelOperador {...propsPadrao()} mediaPercentual={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("cada botão chama seu callback", () => {
    const props = propsPadrao();
    render(<PainelOperador {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /som:/i }));
    expect(props.onAlternarSom).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /tela cheia/i }));
    expect(props.onTelaCheia).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /zerar contadores/i }));
    expect(props.onZerar).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(props.onFechar).toHaveBeenCalledTimes(1);
  });
});
