import { FAIXAS_PREMIO, type FaixaPremio } from "@/config/premios";
import { calcularPercentual } from "@/game/engine";

// Ordena defensivamente por min desc a cada chamada: mesmo que a config seja
// editada fora de ordem, o resultado continua correto (nunca cai num "vão"
// silencioso). O array de config em si já vem ordenado - isto é só uma rede
// de segurança barata.
export function calcularPremio(percentual: number, faixas: FaixaPremio[] = FAIXAS_PREMIO): string | null {
  const ordenadas = [...faixas].sort((a, b) => b.min - a.min);
  const faixa = ordenadas.find((f) => percentual >= f.min);
  return faixa?.premio ?? null;
}

// Loga acertos -> % -> prêmio pra toda pontuação possível numa partida, pra
// conferência do cliente/operador. Chamado uma vez no boot do App.
export function logMapaPremios(totalPerguntas: number, faixas: FaixaPremio[] = FAIXAS_PREMIO) {
  const linhas = Array.from({ length: totalPerguntas + 1 }, (_, acertos) => {
    const percentual = calcularPercentual(acertos, totalPerguntas);
    return `${acertos}/${totalPerguntas} -> ${percentual}% -> ${calcularPremio(percentual, faixas) ?? "sem prêmio"}`;
  });
  console.log("[premiação] mapa de faixas:\n" + linhas.join("\n"));
}
