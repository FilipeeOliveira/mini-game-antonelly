# Refinamento visual — Abertura e Resultado

Rascunho pra organizar o pedido antes de mexer em código. Junta o brief de
UI que você mandou com uma resposta direta à sugestão de stack (o segundo
texto colado) — inclusive onde eu discordo dela pro contexto deste projeto.

## Regra de ouro (repetindo o que você pediu, pra não perder de vista)

Só composição visual: espaçamento, proporção, consistência entre botões.
**Nada de**: mudar lógica, textos, navegação, cores principais, estilo
pixel art, ou remover elementos.

## 1. Estado atual (o que já existe, pra não reinventar)

O projeto **não** usa Tailwind/shadcn nos componentes — é tudo CSS próprio
em `src/theme.css` (~1200 linhas, BEM-ish), com um punhado de tokens em
`:root`: `--cta` (verde botão), `--marca` (verde Antonelly), `--negro`,
`--areia`, `--solimoes` (dourado do ranking), fontes `--display`
(Archivo) e `--dado` (Space Mono, usado em textos técnicos/monoespaçados).
`components.json` na raiz não é shadcn/ui clássico — é a CLI `shadcn`
usada só como puxador de componentes avulsos de registries próprios
(`@react-bits`, `@animate-ui`), foi assim que `ClickSpark.tsx` e o
degradê de `TituloAbertura.tsx` entraram no projeto. Vale saber que essa
porta já existe, caso um componente pontual valha a pena depois.

**O sistema de botão já é parcialmente compartilhado**, o que muda o
diagnóstico do pedido:

```
.botao-cta            → base: padding 26px 48px, font-size 40px,
                          border-radius 28px, inline-flex, gap 14px
.botao-cta--fantasma   → variante vidro escuro ("Próximo jogador")
.botao-cta--ranking    → variante vidro escuro + anel dourado (Ranking)
```

`Abertura.tsx` e `Resultado.tsx` **já usam a mesma classe base** pro
"Vamos começar!"/"Jogar de novo" e pro Ranking. Altura, radius, padding e
fonte já são o mesmo valor nos três. O que quebra a leitura de "mesmo
sistema" não é ausência de padronização — é:

1. **Largura**: nenhum botão tem largura mínima/fixa, então o tamanho
   segue o texto (`align-self: flex-start`). "Vamos começar!" fica bem
   mais largo que "Ranking", e os dois lado a lado parecem de famílias
   diferentes mesmo sendo a mesma peça.
2. **Agrupamento**: em `Resultado.tsx`, "Jogar de novo" e "Próximo
   jogador" ficam num `<div className="acoes">` (flex, gap 20px) —
   Ranking fica **fora** desse grupo, com `margin-top: 24px` próprio.
   Visualmente lê como um elemento à parte, não como a 3ª ação do mesmo
   grupo.
3. **Hierarquia vertical da Abertura**: logo → título → subtítulo → CTA
   → Ranking não tem uma escala de espaçamento pensada, são valores soltos
   (`margin-bottom: 60px` na marca, `margin-top/bottom: 40px` no
   subtítulo, `margin-top: 24px` no Ranking) sem relação entre si.

Ou seja: o consertos é mexer em **largura + agrupamento + escala de
espaçamento** dentro do sistema que já existe, não criar um novo.

### Sobre responsividade e o `Canvas1080`

O jogo inteiro roda num design fixo de **1080×1920px**
(`Canvas1080.tsx`), escalado com `transform: scale()` pra caber no
viewport real e centralizado com barras pretas nas laterais/topo (ver
`.canvas1080-moldura`). Isso já resolve boa parte do pedido de
responsividade "de graça": a composição nunca reflui nem quebra em
celulares menores/maiores/proporções diferentes, porque tudo escala
junto, na mesma proporção — não tem breakpoint pra manter. Cobre também a
área segura, pois as barras pretas fixas já empurram o conteúdo pra
longe de notch/status bar em qualquer proporção de tela.

O que essa arquitetura **não** resolve sozinha, e o brief pede: margens
internas nunca ficarem zero mesmo em telas muito estreitas dentro do
design de 1080px (ex.: `.abertura` usa `padding: 70px 108px 96px`, já dá
uma margem lateral generosa, mas vale conferir se `.veredito-final`
justificado (`text-align: justify`) não deixa buracos feios de espaço
entre palavras em alguma quebra de linha específica).

## 2. Sobre a stack sugerida (segundo texto)

Respondendo direto, porque a sugestão parte de um projeto **Next.js**, e
este aqui é **Vite + React puro**, sem Tailwind em uso e sem Radix:

| Lib sugerida | Uso aqui | Motivo |
|---|---|---|
| **Motion** | ✅ já instalado (`motion@13`) e em uso (`AnimatePresence`, `TituloAbertura`) | Nada a adicionar, só usar mais |
| **Lucide React** | ✅ já instalado nesta sessão (botão de config) | Idem |
| **shadcn/ui** (Button/Card/Dialog/Progress/Tabs/Avatar...) | ❌ não | O projeto não usa Tailwind nos componentes nem Radix; a identidade pixel-art/game já é 100% CSS próprio. Trocar a base dos botões pra Radix é reescrever `theme.css` inteiro pra ganhar o que o brief pede pra **não** fazer ("não reinventar a interface") |
| **Magic UI** (Number Ticker, Confetti, Shimmer/Ripple Button, Particles...) | ❌ não agora | Pontual pode ser legal (ex.: confete no acerto perfeito), mas é fora do escopo deste pedido, que é só espaçamento/consistência de botão. Cada efeito novo é uma dependência + um risco de fugir da estética Antonelly (o próprio texto avisa disso) |
| **canvas-confetti** | ❌ não agora | Mesma razão — funcionalidade nova, não refinamento visual. Fica anotado como ideia futura |
| **Sonner, Embla, GSAP** | ❌ não | Sem caso de uso hoje (toasts, carrossel, animação complexa não pedidos) |

Resumo: a base de animação (Motion) e ícones (Lucide) **já está no
projeto** — é só usar mais. O resto do stack sugerido resolveria um
problema que este projeto não tem (falta de biblioteca de componentes);
o problema real é 3 valores de espaçamento/largura desalinhados dentro
de um CSS que já existe.

## 3. Plano de componentes (dentro do que já existe)

Em vez de `components/quiz/game-button.tsx` do zero, a menor mudança que
resolve "mesmo componente nas duas telas" é: **um wrapper React fino
em cima do CSS que já existe**, só pra garantir que as duas telas nunca
divirjam de novo (hoje cada tela escreve `className="botao-cta ..."` à
mão, e é fácil uma esquecer uma classe).

```
src/components/BotaoCta.tsx
  <BotaoCta variante="primario" | "secundario" | "ranking" ...props>
```

- `primario` → `botao-cta` (CTA verde: "Vamos começar!", "Jogar de novo")
- `secundario` → `botao-cta botao-cta--fantasma` ("Próximo jogador")
- `ranking` → `botao-cta botao-cta--ranking` + `<Crown />` fixo dentro do
  componente (garante que o ícone do Ranking nunca diverge entre telas —
  hoje já é o mesmo `IconeCoroa`, isso só formaliza)

CSS continua 100% em `theme.css`, só ganha a largura mínima/consistente e
o `.acoes` passa a envolver os 3 botões (CTA + secundário/ranking) nas
duas telas, em vez do Ranking ficar solto.

## 4. Ajustes concretos por tela

**Abertura** (`Abertura.tsx` + `.abertura` em `theme.css`):
- Botões: `min-width` compartilhado (ou `width: 100%` dentro de uma
  coluna com `max-width` fixo) pra "Vamos começar!" e "Ranking" lerem
  como o mesmo componente em tamanhos diferentes de conteúdo.
- Espaçamento vertical: definir uma escala (ex.: 4/8/16/24/40/64px) e
  aplicar nos `margin` soltos hoje (marca→título, título→subtítulo,
  subtítulo→CTA, CTA→Ranking) em vez de valores ad-hoc.

**Resultado** (`Resultado.tsx` + `.resultado` em `theme.css`):
- Unificar Ranking dentro do grupo `.acoes` (mesmo `gap`, mesma largura).
- `%` (`.nota`, 220px) continua o destaque — não mexe em tamanho/peso.
- `.veredito-final`: revisar `text-align: justify` + `max-width: 16ch` —
  o pedido é quebra "intencional", `justify` em 16ch pode estar causando
  esse espaçamento estranho entre palavras que o brief reclama.
- `.auto-volta`: já é visualmente discreto (chip pequeno, `font-size:
  15px`); manter, talvez baixar opacidade/posição um pouco mais.

## 5. Fora de escopo agora (anotado pra depois, não pra fazer já)

- Confete (`canvas-confetti`) no resultado perfeito.
- Ranking como `Dialog` com lista/pódio — hoje é uma tela própria
  (`Ranking.tsx`), trocar por modal é mudança de navegação, o brief
  pediu explicitamente pra não mexer nisso.
- Number Ticker no `%` do resultado (contar de 0 até o valor final) —
  é uma animação nova, não um refinamento de espaçamento; daria pra
  fazer só com Motion (`animate` de um número), sem lib nova, se/quando
  vocês quiserem.

## 6. Perguntas em aberto antes de eu começar a mexer no CSS

- Largura dos botões: prefere os três com a **mesma largura fixa** (mais
  "cartão de botões") ou só uma **largura mínima** (mais orgânico, cada
  um do tamanho do texto mas nunca menor que X)?
- Escala de espaçamento: uso os valores que já existem no `theme.css`
  como base (a maioria é múltiplo de 4) ou você tem uma escala em mente?
