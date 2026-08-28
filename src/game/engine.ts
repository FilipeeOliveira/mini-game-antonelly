import type { Pergunta, ItemPartida, Alternativa } from "./types";

export function embaralhar<T>(lista: T[]): T[] {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function sortearPerguntas(
  banco: Pergunta[],
  sacola: number[],
  quantidade: number,
  embaralharAlternativas: boolean
): { itens: ItemPartida[]; sacolaRestante: number[] } {
  let bolsa = sacola;
  if (bolsa.length < quantidade) {
    bolsa = embaralhar(banco.map((_, i) => i));
  }
  const ids = bolsa.slice(0, quantidade);
  const sacolaRestante = bolsa.slice(quantidade);

  const itens: ItemPartida[] = ids.map((i) => {
    const q = banco[i];
    let alternativas: Alternativa[] = q.alternativas.map((texto, idx) => ({
      texto,
      certa: idx === q.correta,
    }));
    if (embaralharAlternativas) alternativas = embaralhar(alternativas);
    return { pergunta: q.pergunta, fato: q.fato, alternativas };
  });

  return { itens, sacolaRestante };
}

export function calcularPercentual(acertos: number, total: number): number {
  return Math.round((acertos / total) * 100);
}

export function mensagemResultado(percentual: number): string {
  if (percentual === 100) return "Cheia máxima! Você conhece o rio de ponta a ponta";
  if (percentual >= 80) return "Quase lá em cima: só faltou um palmo de água";
  if (percentual >= 60) return "Boa navegação — o canal está aberto";
  if (percentual >= 40) return "Águas médias: dá para melhorar na próxima";
  if (percentual >= 20) return "Vazante. Passe no estande e a gente te conta o resto";
  return "Seca total — mas todo mundo começa por aqui";
}
