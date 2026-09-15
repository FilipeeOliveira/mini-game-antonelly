import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Jogo } from "./Jogo";
import type { ItemPartida } from "@/game/types";

function itemDeTeste(pergunta: string, certaIdx: number): ItemPartida {
  const textos = ["Alternativa 0", "Alternativa 1", "Alternativa 2", "Alternativa 3"];
  return {
    pergunta,
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
  // pela primeira vez - nesse instante `bloqueado` ainda é `false`, seu
  // valor inicial, porque nenhuma resposta anterior nunca o tornou
  // `true`. Se o jogador responder bem antes do cronômetro estourar, esse
  // setTimeout antigo ainda dispara mais tarde e chama responder(-1,
  // false, true) de novo. Uma guarda baseada nesse state fica presa no
  // closure antigo, sempre lê bloqueado=false e deixa a segunda resposta
  // passar: uma segunda entrada é empurrada para tempoRespostasMs e um
  // segundo onFim é agendado (e disparado, após seu próprio atraso de
  // feedback).
  //
  // Verificado manualmente: trocando a guarda de `responder` para
  // `if (bloqueado) return;` (o state, em vez do ref) este teste falha -
  // onFim acaba sendo chamado 2 vezes, a segunda com tempoRespostasMs de
  // comprimento 2 ([0, 10000]).
  it("não processa duas vezes a resposta de uma partida de pergunta única quando o cronômetro dispara após o jogador já ter respondido", () => {
    const onFim = vi.fn();
    const umaPergunta = [itemDeTeste("Pergunta única", 0)];
    render(
      <Jogo
        itens={umaPergunta}
        segundosPorPergunta={10}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
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

    // Deixa o cronômetro estourar (mais 9900ms, totalizando 10s desde que
    // a pergunta foi renderizada) e, em seguida, avança mais 200ms - além
    // do próprio msFeedbackErrado do segundo `responder(-1, false, true)`
    // que a guarda quebrada deixaria passar - para dar tempo do segundo
    // onFim (se a guarda estiver quebrada) também disparar. Com a guarda
    // correta, nada disso deve acontecer: a guarda já devia estar travada
    // antes do cronômetro estourar.
    act(() => vi.advanceTimersByTime(9900 + 200));

    expect(onFim).toHaveBeenCalledTimes(1);
    const resultado = onFim.mock.calls[0][0];
    expect(resultado.tempoRespostasMs).toHaveLength(1);
  });

  // ---------------------------------------------------------------------
  // Limpeza do timer de avanço/fim pós-feedback (equivalente a `avancar`
  // no HTML original, cancelado por `limparTemporizadores()` quando
  // `irParaAbertura()` abandona a rodada). Se <Jogo> desmontar enquanto o
  // atraso de feedback ainda está em curso - por exemplo, por causa do
  // timeout ocioso de 45s que a Task 11 porta para o App - esse setTimeout
  // não pode sobreviver ao desmonte: se sobreviver, ele chama onFim depois
  // que o app já navegou para outra tela, uma transição fantasma.
  //
  // Verificado manualmente: removendo a limpeza do useEffect de
  // desmontagem em Jogo.tsx (deixando o setTimeout de `responder`
  // solto, sem ref/clearTimeout) este teste falha - onFim é chamado depois
  // do unmount.
  it("cancela o timer de avanço pós-feedback ao desmontar, sem chamar onFim depois", () => {
    const onFim = vi.fn();
    // Pergunta única: o timer de avanço agendado por `responder` teria como
    // alvo o próprio `onFim` (por ser a última pergunta da partida), não um
    // `setIndice` - exercitando exatamente o caminho que a limpeza precisa
    // impedir de disparar após o desmonte.
    const umaPergunta = [itemDeTeste("Pergunta única", 0)];
    const { unmount } = render(
      <Jogo
        itens={umaPergunta}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        onFim={onFim}
      />
    );

    fireEvent.click(screen.getByText("Alternativa 0")); // certa, dispara o timer de avanço (-> onFim)
    unmount(); // desmonta antes dos 100ms de msFeedbackCerto decorrerem

    act(() => vi.advanceTimersByTime(10000));

    expect(onFim).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  // Barra de tempo (fix: a versão React renderizava a barra sempre em
  // width:100%, sem nenhuma indicação visual do tempo passando - o jogador
  // via "Tempo esgotado" sem aviso algum, numa pergunta que parecia ter
  // tempo de sobra). A barra volta a encolher via animação CSS
  // (transform: scaleX), com a duração/estado aplicados via inline style -
  // é isso que os testes abaixo verificam, sem tentar observar a animação
  // CSS em si dentro do jsdom.
  describe("barra de tempo", () => {
    it("aplica a duração da animação conforme segundosPorPergunta", () => {
      const { container } = render(
        <Jogo
          itens={itens}
          segundosPorPergunta={25}
          msFeedbackCerto={100}
          msFeedbackErrado={100}
          onFim={() => {}}
        />
      );
      const barra = container.querySelector(".tempo__barra") as HTMLElement;
      expect(barra.style.animationDuration).toBe("25s");
    });

    it("ganha a classe tempo__barra--curta nos últimos 6s da pergunta", () => {
      const { container } = render(
        <Jogo
          itens={itens}
          segundosPorPergunta={10}
          msFeedbackCerto={100}
          msFeedbackErrado={100}
          onFim={() => {}}
        />
      );
      const barra = () => container.querySelector(".tempo__barra") as HTMLElement;
      expect(barra().className).not.toContain("tempo__barra--curta");

      act(() => vi.advanceTimersByTime(4000)); // 10s - 6s = falta 4s para os últimos 6s

      expect(barra().className).toContain("tempo__barra--curta");
    });

    it("reinicia a barra (sem tempo__barra--curta) ao avançar para a próxima pergunta", () => {
      const { container } = render(
        <Jogo
          itens={itens}
          segundosPorPergunta={10}
          msFeedbackCerto={100}
          msFeedbackErrado={100}
          onFim={() => {}}
        />
      );
      const barra = () => container.querySelector(".tempo__barra") as HTMLElement;

      act(() => vi.advanceTimersByTime(4000)); // entra nos últimos 6s da pergunta 1
      expect(barra().className).toContain("tempo__barra--curta");

      fireEvent.click(screen.getByText("Alternativa 0")); // responde certo, avança
      act(() => vi.advanceTimersByTime(100)); // msFeedbackCerto

      expect(screen.getByText("Pergunta 2")).toBeInTheDocument();
      expect(barra().className).not.toContain("tempo__barra--curta");
    });

    it("congela a animação (animationPlayState: paused) assim que o jogador responde", () => {
      const { container } = render(
        <Jogo
          itens={itens}
          segundosPorPergunta={10}
          msFeedbackCerto={500}
          msFeedbackErrado={500}
          onFim={() => {}}
        />
      );
      const barra = container.querySelector(".tempo__barra") as HTMLElement;
      expect(barra.style.animationPlayState).toBe("running");

      fireEvent.click(screen.getByText("Alternativa 0"));

      expect(barra.style.animationPlayState).toBe("paused");
    });
  });
});
