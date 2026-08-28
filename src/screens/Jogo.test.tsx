import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Jogo } from "./Jogo";
import type { ItemPartida } from "@/game/types";

function itemDeTeste(pergunta: string, certaIdx: number): ItemPartida {
  const textos = ["Alternativa 0", "Alternativa 1", "Alternativa 2", "Alternativa 3"];
  return {
    pergunta,
    fato: `Fato sobre ${pergunta}`,
    alternativas: textos.map((texto, i) => ({ texto, certa: i === certaIdx })),
  };
}

describe("Jogo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const itens = [itemDeTeste("Pergunta 1", 0), itemDeTeste("Pergunta 2", 1)];

  it("renderiza a primeira pergunta e suas 4 alternativas", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    expect(screen.getByText("Pergunta 1")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("responder certo mostra 'Isso mesmo!' e desabilita as alternativas", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0"));
    expect(screen.getByText("Isso mesmo!")).toBeInTheDocument();
    screen.getAllByRole("button").forEach((b) => expect(b).toBeDisabled());
  });

  it("responder errado mostra 'Não foi essa' e destaca a certa", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 1"));
    expect(screen.getByText("Não foi essa")).toBeInTheDocument();
    expect(screen.getByText("Alternativa 0").closest("button")).toHaveClass("alt--certa");
  });

  it("avança para a próxima pergunta após o tempo de feedback", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0"));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText("Pergunta 2")).toBeInTheDocument();
  });

  it("chama onFim com o resultado correto ao terminar todas as perguntas", () => {
    const onFim = vi.fn();
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={onFim}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0")); // certa na pergunta 1
    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByText("Alternativa 1")); // certa na pergunta 2
    act(() => vi.advanceTimersByTime(100));

    expect(onFim).toHaveBeenCalledTimes(1);
    const resultado = onFim.mock.calls[0][0];
    expect(resultado.acertos).toBe(2);
    expect(resultado.total).toBe(2);
    expect(resultado.percentual).toBe(100);
    expect(resultado.tempoRespostasMs).toHaveLength(2);
  });

  it("chama onProgresso a cada resposta", () => {
    const onProgresso = vi.fn();
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onProgresso={onProgresso}
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0"));
    expect(onProgresso).toHaveBeenCalledWith(1);
  });

  // ---------------------------------------------------------------------
  // Guarda de resposta única (ver ruling do controlador para a Task 8):
  //
  // O cronômetro por pergunta é agendado dentro de um useEffect cujo
  // cleanup só roda quando `indice` muda. Numa partida de uma pergunta só,
  // responder() vai direto para onFim (nunca chama setIndice), então esse
  // useEffect nunca reexecuta e o cronômetro daquela pergunta nunca é
  // cancelado. O setTimeout do cronômetro fechou sobre a função
  // `responder` (e, se a guarda usar o state `bloqueado`, sobre o valor de
  // `bloqueado` daquela mesma renderização) de quando a pergunta apareceu
  // pela primeira vez — nesse instante `bloqueado` ainda é `false`, seu
  // valor inicial, porque nenhuma resposta anterior nunca o tornou
  // `true`. Se o jogador responder bem antes do cronômetro estourar, esse
  // setTimeout antigo ainda dispara mais tarde e chama responder(-1,
  // false, true) de novo. Uma guarda baseada nesse state fica presa no
  // closure antigo, sempre lê bloqueado=false e deixa a segunda resposta
  // passar: um tempo extra é empurrado para tempoRespostasMs. Uma guarda
  // baseada em ref (mutada de forma síncrona, e por isso visível a
  // qualquer closure que leia o mesmo objeto ref) bloqueia corretamente.
  //
  // Verificado manualmente: trocando a guarda de `responder` para
  // `if (bloqueado) return;` (o state, em vez do ref) este teste falha —
  // `tempoRespostasMs` fica com 2 entradas em vez de 1.
  it("não processa duas vezes a resposta de uma partida de pergunta única quando o cronômetro dispara após o jogador já ter respondido", () => {
    const onFim = vi.fn();
    const umaPergunta = [itemDeTeste("Pergunta única", 0)];
    render(
      <Jogo
        itens={umaPergunta}
        segundosPorPergunta={10}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={onFim}
      />
    );

    // Responde certo quase imediatamente após a pergunta aparecer. Como é
    // a única (e portanto última) pergunta da partida, o cronômetro de
    // 10s continua agendado: não há próxima pergunta para disparar o
    // cleanup do useEffect.
    fireEvent.click(screen.getByText("Alternativa 0"));
    act(() => vi.advanceTimersByTime(100)); // dispara o feedback -> onFim

    expect(onFim).toHaveBeenCalledTimes(1);

    // Agora deixa o cronômetro estourar (mais 9900ms, totalizando 10s
    // desde que a pergunta foi renderizada). Com a guarda correta, nada
    // deve acontecer: a guarda já devia estar travada.
    act(() => vi.advanceTimersByTime(9900));

    expect(onFim).toHaveBeenCalledTimes(1);
    const resultado = onFim.mock.calls[0][0];
    expect(resultado.tempoRespostasMs).toHaveLength(1);
  });
});
