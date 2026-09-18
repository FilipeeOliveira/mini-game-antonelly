import { jsPDF } from "jspdf";
import type { Partida } from "@/game/types";
import { ordenarRanking } from "@/game/ranking";

// Relatório em PDF pro operador (Painel do operador -> "Baixar PDF"), com
// todo mundo que já jogou e quantas perguntas cada um acertou - pra
// imprimir/arquivar sem depender do totem ligado (mesmo espírito do
// "Exportar CSV" já existente, só que num formato pronto pra ler/imprimir
// direto). Desenhado à mão com as primitivas de texto/linha do jsPDF (sem
// jspdf-autotable) - a tabela é simples o bastante pra não precisar de mais
// uma dependência só por causa dela.
const MARGEM = 40;
const LARGURA_PAGINA_PT = 595.28; // A4 em pt
const COLUNAS = [
  { titulo: "#", x: MARGEM },
  { titulo: "Nome", x: MARGEM + 30 },
  { titulo: "Acertos", x: MARGEM + 260 },
  { titulo: "Aproveitamento", x: MARGEM + 340 },
  { titulo: "Prêmio", x: MARGEM + 440 },
];

function desenharCabecalhoTabela(doc: jsPDF, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  for (const coluna of COLUNAS) doc.text(coluna.titulo, coluna.x, y);
  const yLinha = y + 6;
  doc.setDrawColor(200);
  doc.line(MARGEM, yLinha, LARGURA_PAGINA_PT - MARGEM, yLinha);
  doc.setFont("helvetica", "normal");
  return yLinha + 14;
}

export function gerarRankingPDF(historico: Partida[]): jsPDF {
  const partidas = ordenarRanking(historico);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const alturaPagina = doc.internal.pageSize.getHeight();

  let y = 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Desafio Antonelly - Ranking", MARGEM, y);

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  const totalTexto = partidas.length === 1 ? "1 participante" : `${partidas.length} participantes`;
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} - ${totalTexto}`, MARGEM, y);
  doc.setTextColor(0);

  y += 30;
  y = desenharCabecalhoTabela(doc, y);

  if (partidas.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.text("Nenhuma partida registrada ainda.", MARGEM, y);
  }

  partidas.forEach((partida, indice) => {
    // Quebra de página: reserva 50pt de rodapé; reabre a tabela com
    // cabeçalho novo na página seguinte em vez de deixar linhas cortadas
    // na virada.
    if (y > alturaPagina - 50) {
      doc.addPage();
      y = 50;
      y = desenharCabecalhoTabela(doc, y);
    }
    doc.setFontSize(10);
    doc.text(String(indice + 1), COLUNAS[0].x, y);
    doc.text(partida.nome, COLUNAS[1].x, y);
    doc.text(`${partida.acertos}/${partida.total}`, COLUNAS[2].x, y);
    doc.text(`${partida.percentual}%`, COLUNAS[3].x, y);
    doc.text(partida.premio ?? "-", COLUNAS[4].x, y);
    y += 20;
  });

  return doc;
}

export function baixarRankingPDF(historico: Partida[]): void {
  const doc = gerarRankingPDF(historico);
  const dataArquivo = new Date().toISOString().slice(0, 10);
  doc.save(`desafio-antonelly-ranking-${dataArquivo}.pdf`);
}
