export type FaixaPremio = { min: number; premio: string | null };

// Ordenadas do maior para o menor. Só `min`: editar um valor nunca abre um
// vão silencioso entre faixas (ver game/premiacao.ts, que também ordena
// defensivamente por segurança). A última faixa, { min: 0, premio: null },
// é a consolação - garante que sempre existe uma faixa correspondente.
export const FAIXAS_PREMIO: FaixaPremio[] = [
  { min: 90, premio: "1 CHOPP" },
  { min: 70, premio: "1 SQUEEZE" },
  { min: 50, premio: "1 CANETA" },
  { min: 0, premio: null },
];
