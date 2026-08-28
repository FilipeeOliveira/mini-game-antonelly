import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Abertura } from "./Abertura";

describe("Abertura", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mostra o botão de começar e o logo", () => {
    render(<Abertura onComecar={() => {}} onAbrirPainel={() => {}} />);
    expect(screen.getByRole("button", { name: /toque para começar/i })).toBeInTheDocument();
    expect(screen.getByAltText("Antonelly Construções")).toBeInTheDocument();
  });

  it("chama onComecar ao clicar no botão", () => {
    const onComecar = vi.fn();
    render(<Abertura onComecar={onComecar} onAbrirPainel={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    expect(onComecar).toHaveBeenCalledTimes(1);
  });

  it("abre o painel após 2s de toque longo na marca", () => {
    const onAbrirPainel = vi.fn();
    const { container } = render(<Abertura onComecar={() => {}} onAbrirPainel={onAbrirPainel} />);
    const marca = container.querySelector("[data-marca]") as HTMLElement;
    fireEvent.pointerDown(marca);
    vi.advanceTimersByTime(2000);
    expect(onAbrirPainel).toHaveBeenCalledTimes(1);
  });

  it("não abre o painel se soltar antes de 2s", () => {
    const onAbrirPainel = vi.fn();
    const { container } = render(<Abertura onComecar={() => {}} onAbrirPainel={onAbrirPainel} />);
    const marca = container.querySelector("[data-marca]") as HTMLElement;
    fireEvent.pointerDown(marca);
    vi.advanceTimersByTime(1000);
    fireEvent.pointerUp(marca);
    vi.advanceTimersByTime(2000);
    expect(onAbrirPainel).not.toHaveBeenCalled();
  });

  it("não abre o painel se a tela for desmontada antes de 2s (segundo dedo navegou)", () => {
    const onAbrirPainel = vi.fn();
    const { container, unmount } = render(<Abertura onComecar={() => {}} onAbrirPainel={onAbrirPainel} />);
    const marca = container.querySelector("[data-marca]") as HTMLElement;
    fireEvent.pointerDown(marca);
    vi.advanceTimersByTime(1000);
    unmount();
    vi.advanceTimersByTime(2000);
    expect(onAbrirPainel).not.toHaveBeenCalled();
  });
});
