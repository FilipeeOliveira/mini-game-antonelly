# Evolução do Minigame "Desafio do Rio" — Design

**Data:** 2026-08-27
**Status:** Aprovado pelo usuário em brainstorming, pronto para plano de implementação.

## Contexto

O minigame "Desafio do Rio" (feira da Antonelly Construções, totem touch) hoje é
um único arquivo `mini-game-antonelly.html` — HTML/CSS/JS vanilla, zero build,
zero dependências, zero backend. Já implementa o fluxo completo dos requisitos
originais: banco de 30 perguntas, sorteio de 5 por partida, pontuação em %,
telas de abertura/jogo/resultado, painel de operador oculto, som via Web Audio,
wake lock, tela cheia, timeout de ociosidade, e identidade visual própria
("Encontro das Águas": paleta negro/água do Rio Negro + dourado do Solimões)
com o verde de marca da Antonelly aplicado nos pontos de ação (ver commit
inicial deste repositório).

Este documento cobre a **próxima fase**: evoluir animações, adicionar um
sistema de ranking/gamificação, e decidir a stack técnica — mantendo a
identidade visual e o conteúdo (perguntas, textos, fluxo) já validados.

## Decisões fundamentais (restrições confirmadas com o usuário)

- **Deploy:** o totem roda Windows; há capacidade de build — uma máquina de
  desenvolvimento gera um bundle estático (`dist/`) que é copiado pro totem.
  O totem não precisa de Node nem de servidor em runtime.
- **Offline-first:** assumir que não há internet confiável na feira. Tudo
  (fontes, bibliotecas, assets) precisa estar embutido no build.
- **Orientação de tela:** o totem de 55" pode rodar em **paisagem ou
  retrato** — o layout precisa ser responsivo a isso, não fixo numa
  orientação.
- **Ranking:** persistência **local** (no próprio totem), mas com
  **exportação** dos dados depois do evento (para análise e/ou premiação).
  Não há sincronização entre totens nem backend.
- **Identificação no ranking:** nome/apelido via teclado touch na tela, **só
  quando o jogador entra no Top 10** (sem fricção para quem não entra).

## Abordagem escolhida: "Meio-termo curado"

Duas alternativas consideradas e descartadas:

- **Mínimo viável** (só migração + confete + ranking simples): mais rápido,
  mas desperdiça a chance de ranking com pódio visual e combo, que agregam
  bastante à experiência de feira por pouco custo extra.
- **Suite completa de gamificação** (+ conquistas/badges, partículas de
  fundo, adoção ampla dos registries React): mais impactante no papel, mas
  risco real de ficar "carregado" numa tela de 55" e de virar uma pilha
  genérica de efeitos em vez de reforçar a identidade do rio.

A abordagem escolhida fica no meio: shadcn/ui + Motion + confete pontual,
ranking com pódio Top 5, um combo simples durante o jogo, e só as peças dos
registries (react-bits/cult-ui) que combinem com a estética do rio — nunca o
pacote inteiro.

**O que é o "combo simples":** um indicador visual de respostas certas
consecutivas dentro da mesma partida (ex: um contador/selo que cresce a cada
acerto seguido e reseta no primeiro erro) — puramente de **feedback visual**,
sem efeito na pontuação em %, que continua sendo só `acertos/5`. Serve para
dar uma sensação de "sequência" durante o jogo, sem introduzir uma segunda
regra de pontuação.

---

## 1. Stack e arquitetura de projeto

**Stack:** React 18 + Vite + TypeScript, Tailwind CSS, shadcn/ui como base de
componentes primitivos (Radix por baixo). Build gera bundle estático que roda
offline, igual ao HTML único hoje — só que compilado a partir de componentes.

**TypeScript** porque o banco de perguntas, o estado de partida e o ranking
são estruturas de dados com forma fixa — tipar evita bugs bobos (índice
errado, campo faltando) fáceis de introduzir num arquivo solto grande.

**Estrutura de pastas (rascunho, ajustável na fase de plano):**

```
mini-game-antonelly/
  src/
    data/
      perguntas.ts          # banco de 30 perguntas (tipado)
    game/
      engine.ts             # sorteio, cálculo de pontuação — lógica pura, sem UI
      types.ts
    ranking/
      storage.ts            # persistência local (ver seção 2)
      types.ts
    screens/
      Abertura.tsx
      Jogo.tsx
      Resultado.tsx
      Ranking.tsx            # tela nova: Top 10 / Top 5
    components/
      ui/                    # shadcn — não editar diretamente
      RioNivel.tsx            # o rio-assinatura, migrado do CSS atual
      PainelOperador.tsx
    App.tsx                  # máquina de estados das telas
  public/
    antonelly-logo.svg
  vite.config.ts
```

A lógica do jogo (`engine.ts`) fica separada da UI — testável sem renderizar
nada — e reaproveita as funções que já existem hoje (`sortearPerguntas`,
`mensagem`), só tipadas.

**Máquina de estados:** telas controladas por `useState`/`useReducer`
tipado — não é uma lib de state machine dedicada (XState etc.), o fluxo é
linear demais para justificar isso.

---

## 2. Dados e sistema de ranking

**Fonte única de verdade:** um **histórico de partidas** persistido em
`localStorage`. Estatísticas do painel do operador (partidas jogadas, média)
e o ranking são **calculados** a partir desse histórico — não há contadores
paralelos que possam dessincronizar (o `sessão` atual, que reseta a cada
reload, é substituído por isso).

**Modelo de dado por partida:**

```ts
type Partida = {
  id: string;
  timestamp: number;
  acertos: number;        // 0–5
  percentual: number;      // 0/20/40/60/80/100
  tempoTotalMs: number;    // soma do tempo de resposta das 5 perguntas
  nome: string | null;     // preenchido só se entrou no Top 10
};
```

**Critério de desempate:** com só 6 valores possíveis de porcentagem, empate
é a regra, não a exceção. Desempata por `tempoTotalMs` (menor tempo total
ganha) — não muda a regra de pontuação em % pedida originalmente, só decide
ordem em empate. Requer que `engine.ts` passe a registrar o tempo de resposta
de cada pergunta (hoje só existe uma barra visual, sem valor armazenado).

**Fluxo de captura de nome:** ao fim da partida, compara o resultado
(`percentual`, `tempoTotalMs`) contra o 10º colocado do **ranking derivado**
(as partidas do histórico filtradas por `nome !== null`, ordenadas por
`percentual` desc. e `tempoTotalMs` asc.) — não contra a 10ª partida bruta do
histórico, que inclui jogadas sem nome. Se qualifica,
insere um passo extra — teclado touch pedindo nome — só nesse caso. Se não
qualifica, segue direto pro fluxo normal ("Jogar de novo" / "Próximo
jogador"), mas a partida ainda é registrada no histórico (sem nome), para
fins de estatística/análise.

**Onde o ranking aparece:**

1. **Tela de abertura (modo atração):** faixa compacta "Top 5 do dia"
   sempre visível — isca antes mesmo de jogar.
2. **Tela de resultado:** se qualificou, mostra o momento de
   celebração (nome + confete) antes de seguir.
3. **Tela de ranking dedicada:** lista completa Top 10, Top 5 em
   tratamento visual de pódio.

**Exportação (painel do operador):** dois botões — **"Exportar ranking"**
(Top 10, CSV) e **"Exportar histórico completo"** (todas as partidas, CSV) —
gerados no navegador via Blob, sem servidor. Um botão destrutivo **"Apagar
ranking e histórico"** substitui o atual "Zerar contadores".

---

## 3. Estratégia de animação e performance

**CSS puro (sem mudança):** brilho pulsante do CTA, textura de "correnteza"
do rio, hover/active dos botões, anel de foco — loops simples ou transições
diretas, sem custo de orquestração via JS.

**Motion (motion.dev, sucessor do Framer Motion) para tudo com sequência ou
dependência entre elementos:**

- Entrada das 4 alternativas com stagger
- Transição pergunta→pergunta com crossfade+slide, incluindo a **saída**
  animada da tela anterior (`AnimatePresence` — hoje é troca abrupta de
  `display`, só a tela que entra anima)
- Veredito certo/errado (scale+fade coordenado com o "apagar" das outras
  alternativas)
- Contador do placar final subindo de 0% até o resultado
- Subida do nível do rio com física de mola (spring), no lugar da curva
  cúbica atual
- Entrada do pódio Top 5 com stagger

**Confete (`canvas-confetti`):** só em dois momentos — **100% de acerto** e
**entrar no Top 10**. Chamada imperativa pontual, não em toda resposta
certa.

**Regras de performance (tela de 55"):**

- Animar só `transform`/`opacity` — nunca `width`/`height`/`box-shadow`/
  `blur` direto
- `backdrop-blur` do painel do operador continua ok (estático, raro)
- `prefers-reduced-motion` continua respeitado, migrado pro Motion também
- Confete com contagem de partículas conservadora — mais pixels por frame
  numa tela grande custam mais
- **Testar em hardware o mais próximo possível do real antes da feira** —
  media players/mini-PCs que tocam telas de 55" costumam ter GPU mais fraca
  que uma máquina de desenvolvimento

---

## 4. UX para totem 55" (paisagem e retrato)

**Técnica mantida:** `clamp()` com `vmin` + media query por
**aspect-ratio** (não largura fixa) — já é a abordagem certa para
"funciona em paisagem e retrato" sem precisar de dois designs.

**Duas distâncias de leitura:** "modo atração" (título, CTA, Top 5
ambiente) precisa ser legível a uns 2-3m para puxar gente pelo corredor;
"modo jogo" (pergunta, alternativas) só precisa ser confortável a distância
de braço. O rascunho atual já acerta esse princípio — mantido e estendido
para as telas novas (ranking).

**Grade de alternativas por orientação:**

- Paisagem: grid 2x2 (`min-aspect-ratio: 1/1` → 2 colunas)
- Retrato: empilha em 1 coluna (comportamento *default* sem a media query)

**Régua de cota (rio lateral):** já é uma faixa vertical na borda direita,
funciona em ambas orientações sem mudança.

**"Não parecer site ampliado":**

- Sem scroll, nunca
- Um foco visual por tela — nada de layout denso multi-coluna (padrão certo
  pro sian-front, errado aqui)
- `cursor:none` explícito em modo quiosque
- Loop de atração ativo quando ocioso: hoje a tela fica parada; vai ganhar
  movimento ambiente sutil (rio continua fluindo, Top 5 rotaciona destaques)
- Feedback tátil (som + scale no toque) mantido

**Nota operacional (não é código):** o dimensionamento em `vmin` só funciona
certo com o **escalonamento de DPI do Windows em 100%** na tela do totem —
confirmar na instalação.

---

## 5. Bibliotecas e ferramentas

| Biblioteca | Entra? | Por quê |
|---|---|---|
| React + Vite + TypeScript | ✅ | Base da migração |
| Tailwind CSS | ✅ | Emparelha com shadcn |
| shadcn/ui (+ Radix) | ✅ | Componentes primitivos com acessibilidade de toque/teclado |
| lucide-react | ✅ | Ícones — mesmo padrão do sian-front |
| motion (motion/react) | ✅ | Única lib de animação orquestrada |
| canvas-confetti | ✅ | Só nos 2 momentos de destaque |
| @cult-ui / @react-bits (via registry shadcn) | ⚠️ Seletivo | Componente a componente (ex: efeito de água, contador numérico), nunca o pacote inteiro |
| GSAP | ❌ | Redundante com Motion |
| Zustand/Redux | ❌ | Fluxo linear de poucas telas, `useState`/`useReducer` basta |
| react-router | ❌ | Não são rotas — é uma máquina de estados de telas |
| date-fns | ❌ | Não há datas para formatar |
| Particle engine dedicado (tsParticles etc.) | ❌ por agora | Risco de performance na tela grande; preferir componente pontual do react-bits/cult-ui |

**Fontes (Archivo/Space Mono):** hoje vêm de CDN do Google Fonts — vira
**auto-hospedagem dos `.woff2` no build**, dado o requisito offline-first.

**shadcn MCP:** `.mcp.json` e `package.json` (com `shadcn` como
devDependency) já foram configurados pelo usuário via
`npx shadcn@latest mcp init --client claude`, incluindo os registries
`@cult-ui` e `@react-bits`. Isso será usado na fase de implementação para
buscar componentes específicos quando necessário — não para adoção em
massa.

## Fora de escopo

- Sistema de conquistas/badges separado do combo simples (avaliar como
  evolução futura, não nesta fase)
- Sincronização de ranking entre múltiplos totens (exigiria backend/rede,
  contradiz a premissa offline)
- Qualquer mudança no conteúdo das 30 perguntas ou na regra de pontuação em
  % (já validados, fora do escopo desta evolução)
