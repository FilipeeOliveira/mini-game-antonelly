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

// Colapsa 3+ repetições seguidas da mesma letra ("PUUUTA" -> "PUTA") - o
// teclado virtual (ver components/TecladoVirtual.tsx) não tem números nem
// símbolos, então a forma real de tentar escapar do filtro aqui é
// martelando a mesma tecla, não leetspeak.
function colapsarRepetidas(token: string): string {
  return token.replace(/([A-Z])\1{2,}/g, "$1");
}

// Palavra bloqueada com menos de 4 letras só bate como token inteiro do
// nome (separado por espaço) - abaixo disso a checagem por substring pega
// nome real por coincidência (ex.: "CU" dentro de "MARCUS"). A partir de 4
// letras o palavrão já é distintivo o bastante pra manter substring, o que
// também pega a versão sem espaços do nome - cobre a tentativa de escapar
// digitando a palavra com espaço entre as letras (ex.: "P U T A").
const LIMITE_PALAVRA_INTEIRA = 4;

export function contemPalavraBloqueada(nomeNormalizado: string): boolean {
  const tokens = nomeNormalizado.split(" ").filter(Boolean).map(colapsarRepetidas);
  const semEspacos = colapsarRepetidas(nomeNormalizado.replace(/\s+/g, ""));

  return PALAVRAS_BLOQUEADAS.some((palavra) =>
    palavra.length < LIMITE_PALAVRA_INTEIRA ? tokens.includes(palavra) : semEspacos.includes(palavra)
  );
}
