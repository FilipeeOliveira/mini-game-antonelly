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

  // Antes do fix, iniciarPressao sobrescrevia pressaoRef.current sem limpar
  // o timer da pressão anterior. Dois dedos pousando na marca (uma tela de
  // 55" numa feira, crianças) e ambos soltando cedo: o segundo pointerdown
  // sobrescrevia a ref antes do primeiro soltar, deixando o timer do
  // primeiro dedo órfão — ele disparava sozinho 2s depois, mesmo com os
  // dois dedos já soltos havia tempo, abrindo o painel do operador.
  it("dois toques sobrepostos, ambos soltos antes de 2s, não abrem o painel", () => {
    const onAbrirPainel = vi.fn();
    const { container } = render(<Abertura onComecar={() => {}} onAbrirPainel={onAbrirPainel} />);
    const marca = container.querySelector("[data-marca]") as HTMLElement;

    fireEvent.pointerDown(marca); // dedo 1 desce em t=0
    vi.advanceTimersByTime(500);
    fireEvent.pointerDown(marca); // dedo 2 desce em t=500, antes do dedo 1 subir
    vi.advanceTimersByTime(300);
    fireEvent.pointerUp(marca); // dedo 1 sobe em t=800
    vi.advanceTimersByTime(200);
    fireEvent.pointerUp(marca); // dedo 2 sobe em t=1000

    // passa dos 2s de qualquer um dos dois dedos (marcas em t=2000 e
    // t=2500) sem nenhum toque novo.
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
