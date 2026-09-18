import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NomeJogador } from "./NomeJogador";

function digitarTexto(texto: string) {
  for (const letra of texto) {
    fireEvent.click(screen.getByRole("button", { name: letra === " " ? "ESPAÇO" : letra }));
  }
}

describe("NomeJogador", () => {
  it("confirma com o nome digitado, normalizado em caixa alta", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    digitarTexto("JOAO");
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirmar).toHaveBeenCalledWith("JOAO");
  });

  it("nome vazio não confirma - o jogo não inicia sem nome", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByText("Digite seu nome para continuar")).toBeInTheDocument();
  });

  it("nome só com espaços não confirma", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    digitarTexto("   ");
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("backspace apaga o último caractere digitado", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    digitarTexto("ANAX");
    fireEvent.click(screen.getByRole("button", { name: "Apagar" }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirmar).toHaveBeenCalledWith("ANA");
  });

  it("não digita além do limite de caracteres", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    digitarTexto("A".repeat(20));
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirmar).toHaveBeenCalledWith("A".repeat(14));
  });

  it("recusa nome com palavra bloqueada, mostra mensagem e limpa o campo", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    digitarTexto("MERDA");
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("SEU NOME")).toBeInTheDocument();
  });

  it("mostra aviso visual em tempo real assim que uma palavra bloqueada é digitada, antes de confirmar", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    digitarTexto("CU");
    expect(screen.getByRole("status")).toHaveTextContent(/não pode ser usado/i);
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("permite nome comum que contém uma palavra curta bloqueada por coincidência (MARCUS)", () => {
    const onConfirmar = vi.fn();
    render(<NomeJogador onConfirmar={onConfirmar} onVoltar={() => {}} />);
    digitarTexto("MARCUS");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirmar).toHaveBeenCalledWith("MARCUS");
  });

  it("chama onVoltar ao clicar em Voltar", () => {
    const onVoltar = vi.fn();
    render(<NomeJogador onConfirmar={() => {}} onVoltar={onVoltar} />);
    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });
});
