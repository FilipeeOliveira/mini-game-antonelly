# Desafio do Rio - minigame de totem

Quiz interativo da **Antonelly Construções** para totem touch de feira. O
visitante encosta na tela, responde 6 perguntas sorteadas de um banco de 30 e
recebe a nota em porcentagem. Roda sozinho o dia inteiro: volta para a tela de
atração quando ninguém toca, e já se prepara para o próximo jogador.

Feito para rodar **sem internet**, em Windows, numa tela de 55" - em paisagem
ou em retrato.

---

## Rodando na sua máquina

Precisa de **Node.js 22+** (testado no 22.23) e npm.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173` (se a porta estiver ocupada, o Vite escolhe a
seguinte e avisa no terminal).

### Todos os comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento, com recarga automática |
| `npm run build` | Gera a pasta `dist/` pronta para o totem |
| `npm run preview` | Serve o `dist/` já buildado, para conferir antes de levar |
| `npm test` | Roda a suíte inteira uma vez (62 testes) |
| `npm run test:watch` | Roda os testes continuamente enquanto você edita |

---

## Levando para o totem

### Jeito simples (sem servidor, sem internet)

1. `npm run build:totem`
2. Copie a pasta **`Mini-game-antonelly/`** inteira (ou o `.zip` dela) para o totem
3. Dê duplo clique em **`iniciar-totem.bat`**: abre o jogo no Edge em tela
   cheia (quiosque). Para sair do quiosque: `Alt+F4`.

O `index.html` dessa pasta já traz JS, CSS e fontes embutidos; os fundos ficam
em `assets/`. Por isso ele abre direto do arquivo, sem precisar do Node nem de
servidor no totem.

### Jeito com servidor local

1. Numa máquina de desenvolvimento: `npm run build`
2. Copie a pasta **`dist/`** inteira para o totem (pendrive, rede, o que for)
3. No totem, sirva essa pasta por um **servidor estático local** e abra o
   endereço no Chrome em modo quiosque

> **Não adianta dar duplo clique no `index.html`.** A página carrega como
> módulo ES, que o navegador busca sob CORS - e um documento aberto por
> `file://` tem origem nula, então o Chrome bloqueia e você vê uma tela em
> branco. O servidor local também é o que garante o *secure context* de que o
> Wake Lock (manter a tela acesa) precisa.

O passo a passo detalhado da instalação, mais a checklist de conferência no
dia da feira, está em **[docs/QA-TOTEM.md](docs/QA-TOTEM.md)**. Dois pontos
que costumam passar batido:

- O **escalonamento de tela do Windows precisa estar em 100%**. Todo o
  dimensionamento usa `vmin`, então 125% ou 150% distorce o layout.
- Teste **nas duas orientações** que o totem for usar. O layout se adapta,
  mas vale ver com os próprios olhos.

---

## Como o jogo funciona

O fluxo tem três telas: **atração → perguntas → resultado**, e volta ao começo.

- **6 perguntas por partida**, sorteadas das 30 do banco. O sorteio usa uma
  "sacola": as perguntas saem sem repetir até a sacola esvaziar, então
  jogadores em sequência não pegam as mesmas. Como 30 ÷ 6 é exato, cada ciclo
  de 5 partidas cobre o banco inteiro.
- As alternativas de cada pergunta também são embaralhadas.
- **25 segundos por pergunta.** Se o tempo acabar, conta como erro e a tela
  mostra "Tempo esgotado".
- A nota é a porcentagem de acertos: 0, 17, 33, 50, 67, 83 ou 100%.
- **O rio no rodapé é o placar visual** - o nível sobe a cada pergunta
  respondida e, no fim, para na altura da nota, como a régua de cota de um
  porto.
- Sem toque nenhum, o jogo se recupera sozinho: 45 segundos abandonam uma
  partida em andamento, 25 segundos devolvem da tela de resultado.

### Painel do operador

Segure o dedo **2 segundos sobre o logo** na tela de atração. Abre um painel
com partidas jogadas na sessão, média de acerto, e botões para ligar/desligar
o som, entrar em tela cheia e zerar os contadores.

Ele abre apenas pela tela de atração - que reaparece a cada troca de jogador.
Se for aberto sem querer, fecha sozinho depois de 45 segundos sem toque, para
não deixar o totem travado atrás dele.

### Ajustando o jogo

Os números acima ficam todos juntos no `CONFIG`, no topo de
[`src/App.tsx`](src/App.tsx) - quantidade de perguntas, tempo por pergunta,
duração do feedback e dos timeouts de ociosidade.

### Trocando as perguntas

O banco inteiro está em [`src/data/perguntas.ts`](src/data/perguntas.ts). Cada
pergunta tem exatamente **3 alternativas** e o campo `correta` aponta qual
delas vale (`0` = primeira, `1` = segunda, `2` = terceira).

```ts
{
  pergunta: "O que significa a sigla IP4?",
  alternativas: [
    "Instalação Portuária Pública de Pequeno Porte",
    "Instituto de Portos Públicos do Interior",
    "Infraestrutura Portuária de Quarta Geração",
  ],
  correta: 0,
}
```

Se mexer nas alternativas, **rode `npm test`**. Existe um teste que trava as 30
respostas certas contra o gabarito oficial: reordenar uma alternativa sem
corrigir o `correta` faz a suíte falhar na hora, em vez de o erro aparecer na
frente do público.

---

## Estrutura

```
src/
  data/perguntas.ts      as 30 perguntas
  game/                  regras puras, sem interface
    engine.ts              sorteio, pontuação, mensagem final
    audio.ts               os bipes (Web Audio, sem arquivo de som)
    types.ts
  screens/               uma tela por arquivo
    Abertura.tsx  Jogo.tsx  Resultado.tsx
  components/
    RioNivel.tsx           o rio e a régua de cota
    PainelOperador.tsx
  App.tsx                decide qual tela aparece e cuida do quiosque
  theme.css              a identidade visual inteira

legacy/                  o protótipo original em HTML único, como referência
docs/QA-TOTEM.md         instalação no totem e checklist da feira
```

As regras do jogo em `game/` não dependem de React - dá para testá-las sem
renderizar nada, e é onde ficam as decisões que importam.

## Testes

```bash
npm test
```

62 testes. Cobrem as regras puras, a integridade do banco, cada tela e uma
partida completa de ponta a ponta. Vários existem por causa de bugs reais que
apareceram durante a migração - o comentário em cima de cada um explica o que
ele está protegendo.

---

## Stack

React 19 · Vite · TypeScript · Vitest + Testing Library. Fontes Archivo e Space
Mono empacotadas junto (`@fontsource`), sem CDN. Tailwind está instalado mas
ainda não é usado nos componentes: entra quando o ranking chegar, junto com o
shadcn/ui.
