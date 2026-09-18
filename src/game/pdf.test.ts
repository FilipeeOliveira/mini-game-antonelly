import { describe, it, expect } from "vitest";
import { gerarRankingPDF } from "./pdf";
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

// jsPDF não comprime o conteúdo por padrão, então o texto desenhado
// aparece literal nos bytes do PDF gerado (operador Tj do PDF) - decodificar
// e procurar a substring dá um teste de conteúdo de verdade, não só "não
// lançou erro". Ver game/pdf.ts.
function textoDoPDF(bytes: ArrayBuffer): string {
  return new TextDecoder("iso-8859-1").decode(bytes);
}

describe("gerarRankingPDF", () => {
  it("inclui o nome e o placar (acertos/total) de cada jogador, ordenados como o ranking", () => {
    const historico = [
      partida({ id: "1", nome: "ANA", acertos: 3, total: 6, percentual: 50 }),
      partida({ id: "2", nome: "BEATRIZ", acertos: 6, total: 6, percentual: 100 }),
    ];
    const doc = gerarRankingPDF(historico);
    const texto = textoDoPDF(doc.output("arraybuffer"));

    expect(texto).toContain("BEATRIZ");
    expect(texto).toContain("ANA");
    expect(texto).toContain("6/6");
    expect(texto).toContain("3/6");
    // BEATRIZ (100%) vem antes de ANA (50%) no texto bruto, já que o PDF
    // desenha linha por linha na ordem do ranking (melhor colocado primeiro).
    expect(texto.indexOf("BEATRIZ")).toBeLessThan(texto.indexOf("ANA"));
  });

  it("mostra uma mensagem quando não há nenhuma partida ainda, sem lançar erro", () => {
    const doc = gerarRankingPDF([]);
    const texto = textoDoPDF(doc.output("arraybuffer"));
    expect(texto).toContain("Nenhuma partida registrada");
  });

  it("quebra de página quando a lista não cabe numa página só", () => {
    const historico = Array.from({ length: 60 }, (_, i) =>
      partida({ id: String(i), nome: `JOGADOR ${i}`, acertos: i % 7, percentual: i })
    );
    const doc = gerarRankingPDF(historico);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    const texto = textoDoPDF(doc.output("arraybuffer"));
    expect(texto).toContain("JOGADOR 0");
    expect(texto).toContain("JOGADOR 59");
  });
});
