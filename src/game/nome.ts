import { PALAVRAS_BLOQUEADAS } from "@/config/palavrasBloqueadas";

export const LIMITE_CARACTERES_NOME = 14;

// Maiúsculas + sem acento, pra comparar contra a lista de bloqueio e pra
// exibição no ranking (o teclado virtual já digita em caixa alta, mas o
// blocklist precisa comparar sem acento pra pegar variações como "Púta").
export function normalizarNome(bruto: string): string {
  return bruto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, LIMITE_CARACTERES_NOME);
}

export function contemPalavraBloqueada(nomeNormalizado: string): boolean {
  return PALAVRAS_BLOQUEADAS.some((palavra) => nomeNormalizado.includes(palavra));
}
