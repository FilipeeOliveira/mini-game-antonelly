import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Abertura } from "./Abertura";

describe("Abertura", () => {
  it("mostra o botão de começar e o logo", () => {
    render(<Abertura pronto onComecar={() => {}} onAbrirPainel={() => {}} onAbrirRanking={() => {}} />);
    expect(screen.getByRole("button", { name: /começar/i })).toBeInTheDocument();
    expect(screen.getByAltText("Antonelly Construções")).toBeInTheDocument();
  });

  it("chama onComecar ao clicar no botão", () => {
    const onComecar = vi.fn();
    render(<Abertura pronto onComecar={onComecar} onAbrirPainel={() => {}} onAbrirRanking={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /começar/i }));
    expect(onComecar).toHaveBeenCalledTimes(1);
  });

  it("desabilita o botão enquanto os fundos não terminaram de carregar", () => {
    render(<Abertura pronto={false} onComecar={() => {}} onAbrirPainel={() => {}} onAbrirRanking={() => {}} />);
    expect(screen.getByRole("button", { name: /começar/i })).toBeDisabled();
  });

  it("chama onAbrirRanking ao clicar em Ranking", () => {
    const onAbrirRanking = vi.fn();
    render(<Abertura pronto onComecar={() => {}} onAbrirPainel={() => {}} onAbrirRanking={onAbrirRanking} />);
    fireEvent.click(screen.getByRole("button", { name: /ranking/i }));
    expect(onAbrirRanking).toHaveBeenCalledTimes(1);
  });

  it("chama onAbrirPainel ao clicar no botão de configurações", () => {
    const onAbrirPainel = vi.fn();
    render(<Abertura pronto onComecar={() => {}} onAbrirPainel={onAbrirPainel} onAbrirRanking={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /configurações/i }));
    expect(onAbrirPainel).toHaveBeenCalledTimes(1);
  });
});
