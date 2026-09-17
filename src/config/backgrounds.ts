// Fundo fixo da tela de abertura: cena do colaborador de uniforme Antonelly
// caminhando na embarcação, com a equipe ao fundo - confirmado visualmente
// contra docs/imagens_painel/exemplo_de_como_deve_ficar/tela_incial_exemplo.png.
// Nunca entra no sorteio das perguntas.
import fundoAbertura from "../../docs/imagens_painel/tela_inicial.svg";

import balsaPorDoSol from "../../docs/imagens_painel/balsa_por_do_sol.svg";
import chegadaEmbarcacao from "../../docs/imagens_painel/chegada_embarcacao.svg";
import equipeNoBarco from "../../docs/imagens_painel/equipe_no_barco.svg";
import operacaoPortuaria from "../../docs/imagens_painel/operacao_portuaria.svg";
import orlaRibeirinha from "../../docs/imagens_painel/orla_ribeirinha.svg";
import vistaAerea from "../../docs/imagens_painel/vista_aerea.svg";

export const FUNDO_ABERTURA = fundoAbertura;

// Fundo fixo da tela de resultado - sempre o mesmo, por pedido do cliente.
export const FUNDO_RESULTADO = balsaPorDoSol;

// Pool sorteado sem repetição a cada partida (ver embaralhar() em game/engine.ts).
export const FUNDOS_PERGUNTA = [
  balsaPorDoSol,
  chegadaEmbarcacao,
  equipeNoBarco,
  operacaoPortuaria,
  orlaRibeirinha,
  vistaAerea,
];

export const TODOS_FUNDOS = [FUNDO_ABERTURA, ...FUNDOS_PERGUNTA];

// Cor sólida de fallback se um SVG falhar ao carregar.
export const FUNDO_COR_FALLBACK = "#1D3F61";
