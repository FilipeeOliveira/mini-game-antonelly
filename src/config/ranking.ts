export type JanelaRanking = "dia" | "evento";

// 'dia': só partidas de hoje. 'evento': histórico inteiro. Trocar este valor
// muda o ranking exibido sem nenhuma outra alteração de código.
export const RANKING_JANELA: JanelaRanking = "dia";
