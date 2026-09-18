import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    partidasHoje: 12,
    partidasEvento: 45,
    brindesPorTipo: { "1 CHOPE": 4, "1 SQUEEZE": 7 },
    onExportarCSV: vi.fn(),
    onZerarRankingDia: vi.fn(),
    onZerarTudo: vi.fn(),
  };
}

describe("PainelOperador", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("não renderiza nada quando fechado", () => {
    const { container } = render(<PainelOperador {...propsPadrao()} aberto={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra as estatísticas de sessão quando aberto", () => {
    render(<PainelOperador {...propsPadrao()} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("mostra travessão quando não há média ainda", () => {
    render(<PainelOperador {...propsPadrao()} mediaPercentual={null} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("mostra os totais de dados (dia/evento/brindes)", () => {
    render(<PainelOperador {...propsPadrao()} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("1 CHOPE: 4 · 1 SQUEEZE: 7")).toBeInTheDocument();
  });

  it("cada botão da sessão chama seu callback", () => {
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

  it("exportar CSV chama o callback direto, sem confirmação", () => {
    const props = propsPadrao();
    render(<PainelOperador {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /exportar csv/i }));
    expect(props.onExportarCSV).toHaveBeenCalledTimes(1);
  });

  it("zerar ranking do dia exige um segundo toque para confirmar", () => {
    const props = propsPadrao();
    render(<PainelOperador {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /zerar ranking do dia/i }));
    expect(props.onZerarRankingDia).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /confirmar zerar hoje/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirmar zerar hoje/i }));
    expect(props.onZerarRankingDia).toHaveBeenCalledTimes(1);
  });

  it("a confirmação de zerar expira sozinha sem exigir ação", () => {
    const props = propsPadrao();
    render(<PainelOperador {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /zerar tudo/i }));
    expect(screen.getByRole("button", { name: /confirmar zerar tudo/i })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("button", { name: /^zerar tudo$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^zerar tudo$/i }));
    expect(props.onZerarTudo).not.toHaveBeenCalled();
  });
});
