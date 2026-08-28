# Fundação e Migração para React - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o minigame "Desafio do Rio" do arquivo HTML único atual para
uma base React + Vite + TypeScript com paridade de funcionalidade - mesmo
conteúdo, mesmo fluxo, mesma identidade visual - pronta para receber o
sistema de ranking (próximo plano) e o polimento de animação/UX (plano
seguinte).

**Architecture:** Lógica pura do jogo (`game/engine.ts`) separada dos
componentes React (`screens/`, `components/`). Estado das telas vive em
`App.tsx` via `useState`, sem lib de state management. CSS existente
(design tokens, animações, layout responsivo por `vmin`/`aspect-ratio`) é
portado quase literal para `src/theme.css`; Tailwind + shadcn/ui entram como
ferramentas disponíveis para o que vier depois (ranking, novos componentes),
não para reescrever o que já está visualmente validado.

**Tech Stack:** React 18, Vite, TypeScript, Vitest + React Testing Library,
Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui (base Radix), fontes
Archivo/Space Mono auto-hospedadas via `@fontsource`.

**Spec:** [docs/superpowers/specs/2026-08-27-evolucao-minigame-design.md](../specs/2026-08-27-evolucao-minigame-design.md)

## Global Constraints

- **Offline-first:** nenhuma dependência de rede em runtime (sem CDN de
  fontes ou bibliotecas) - tudo embutido no build.
- **Conteúdo intocado:** as 30 perguntas, seus textos e a regra de
  pontuação em porcentagem (`acertos/total`) não mudam nesta migração.
- **Responsivo por aspect-ratio:** manter `clamp()`/`vmin` + media query por
  `aspect-ratio` (não largura fixa) - precisa funcionar em paisagem e
  retrato.
- **`prefers-reduced-motion` respeitado** em toda animação portada.
- **Sem dependências fora do combinado na spec** (Seção 5): React, Vite,
  TypeScript, Tailwind, shadcn/ui, lucide-react, Vitest/RTL nesta fase. Motion
  e canvas-confetti entram só no plano de animação (fora de escopo aqui).

---

## Task 1: Scaffolding do projeto (Vite + TS + Tailwind + shadcn + Vitest)

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`,
  `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`,
  `src/App.tsx`, `src/App.test.tsx`, `src/index.css`, `src/test/setup.ts`

**Interfaces:**
- Produces: `App` (componente React default de `src/App.tsx`, sem props) -
  será totalmente substituído na Task 11, mas precisa existir e renderizar
  algo real agora para provar que o pipeline (dev/build/test) funciona.

- [ ] **Step 1: Atualizar `package.json`** (o arquivo já existe com
  `{"devDependencies": {"shadcn": "^4.19.0"}}` - preservar essa linha)

```json
{
  "name": "mini-game-antonelly",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {},
  "devDependencies": {
    "shadcn": "^4.19.0"
  }
}
```

- [ ] **Step 2: Instalar dependências**

```bash
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node
npm install -D tailwindcss @tailwindcss/vite
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Criar os arquivos de configuração**

`vite.config.ts`:
```ts
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

`vitest.config.ts`:
```ts
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

`index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    />
    <title>Desafio do Rio - Antonelly Construções</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@import "tailwindcss";
```

`src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Escrever o teste de fumaça (falhando)**

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "./App";

describe("App (fundação)", () => {
  it("renderiza sem quebrar", () => {
    render(<App />);
    expect(screen.getByText("Desafio do Rio")).toBeInTheDocument();
  });
});
```

Run: `npm test`
Expected: FAIL - `./App` não existe ainda.

- [ ] **Step 5: Criar o `App.tsx` mínimo**

`src/App.tsx`:
```tsx
export function App() {
  return <p>Desafio do Rio</p>;
}
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: Confirmar que o build de produção funciona**

Run: `npm run build`
Expected: sucesso, gera a pasta `dist/`

- [ ] **Step 8: Inicializar o shadcn/ui**

```bash
npx shadcn@latest init --template vite --base radix -y
```

Expected: cria `components.json` na raiz do projeto e ajusta `src/index.css`
(adiciona bloco `@theme`/variáveis do shadcn). Rodar `npm run build`
novamente e confirmar que ainda passa.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffolding do projeto React/Vite/TS com Tailwind e shadcn"
```

---

## Task 2: Tipos e banco de perguntas

**Files:**
- Create: `src/game/types.ts`, `src/data/perguntas.ts`,
  `src/data/perguntas.test.ts`

**Interfaces:**
- Produces: `type Pergunta = { pergunta: string; alternativas: [string,string,string,string]; correta: 0|1|2|3; fato: string }`,
  `type Alternativa = { texto: string; certa: boolean }`,
  `type ItemPartida = { pergunta: string; fato: string; alternativas: Alternativa[] }`,
  `type ResultadoPartida = { acertos: number; total: number; percentual: number; tempoTotalMs: number; tempoRespostasMs: number[] }`,
  `BANCO_PERGUNTAS: Pergunta[]` (as 30 perguntas, ordem e conteúdo idênticos
  ao `BANCO` do HTML original)

- [ ] **Step 1: Escrever `src/game/types.ts`**

```ts
export type Pergunta = {
  pergunta: string;
  alternativas: [string, string, string, string];
  correta: 0 | 1 | 2 | 3;
  fato: string;
};

export type Alternativa = {
  texto: string;
  certa: boolean;
};

export type ItemPartida = {
  pergunta: string;
  fato: string;
  alternativas: Alternativa[];
};

export type ResultadoPartida = {
  acertos: number;
  total: number;
  percentual: number;
  tempoTotalMs: number;
  tempoRespostasMs: number[];
};
```

- [ ] **Step 2: Escrever o teste de integridade do banco (falhando)**

`src/data/perguntas.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { BANCO_PERGUNTAS } from "./perguntas";

describe("BANCO_PERGUNTAS", () => {
  it("tem exatamente 30 perguntas", () => {
    expect(BANCO_PERGUNTAS).toHaveLength(30);
  });

  it("cada pergunta tem exatamente 4 alternativas", () => {
    for (const p of BANCO_PERGUNTAS) {
      expect(p.alternativas).toHaveLength(4);
    }
  });

  it("cada pergunta tem um índice de resposta correta válido (0-3)", () => {
    for (const p of BANCO_PERGUNTAS) {
      expect([0, 1, 2, 3]).toContain(p.correta);
    }
  });

  it("cada pergunta tem um fato não vazio", () => {
    for (const p of BANCO_PERGUNTAS) {
      expect(p.fato.length).toBeGreaterThan(0);
    }
  });

  it("não há perguntas com texto duplicado", () => {
    const textos = BANCO_PERGUNTAS.map((p) => p.pergunta);
    expect(new Set(textos).size).toBe(textos.length);
  });
});
```

Run: `npm test -- perguntas`
Expected: FAIL - `./perguntas` não existe ainda.

- [ ] **Step 3: Escrever `src/data/perguntas.ts`** com as 30 perguntas,
  transcritas do `BANCO` em `mini-game-antonelly.html` (linhas 415-579 do
  arquivo original) sem alterar texto, ordem ou resposta correta:

```ts
import type { Pergunta } from "@/game/types";

export const BANCO_PERGUNTAS: Pergunta[] = [
  {
    pergunta: "O que é uma poita?",
    alternativas: [
      "Um peso de concreto ou ferro que ancora o flutuante no leito do rio",
      "Uma ferramenta usada para misturar concreto",
      "O nome da rampa que liga o porto à margem",
      "Um tipo de embarcação de pequeno porte",
    ],
    correta: 0,
    fato: "As poitas ficam no fundo do rio e seguram o porto flutuante no lugar o ano inteiro.",
  },
  {
    pergunta: "A sigla IP4 significa:",
    alternativas: [
      "Instalação Portuária Pública de Pequeno Porte",
      "Índice de Produtividade em 4 etapas",
      "Inspeção Periódica de Portos, nível 4",
      "Instalação de Passageiros com 4 rampas",
    ],
    correta: 0,
    fato: "A Antonelly cuida da manutenção e conservação de IP4s em mais de 49 municípios do Norte.",
  },
  {
    pergunta: "Por que os portos da Amazônia costumam ser flutuantes?",
    alternativas: [
      "Porque o nível do rio sobe e desce vários metros ao longo do ano",
      "Porque a lei proíbe portos fixos em rios",
      "Porque não existe terreno firme na região",
      "Porque flutuantes dispensam manutenção",
    ],
    correta: 0,
    fato: "O flutuante acompanha a água: na cheia sobe, na seca desce, e o porto segue operando.",
  },
  {
    pergunta: "Entre a cheia e a seca, quanto o rio pode variar em Manaus?",
    alternativas: ["Cerca de 15 metros", "Cerca de 2 metros", "Cerca de 5 metros", "Cerca de 40 metros"],
    correta: 0,
    fato: "A cota do rio é medida todos os dias no porto de Manaus há mais de um século.",
  },
  {
    pergunta: "No Encontro das Águas, quais rios correm lado a lado sem se misturar de imediato?",
    alternativas: ["Negro e Solimões", "Negro e Madeira", "Amazonas e Tapajós", "Solimões e Purus"],
    correta: 0,
    fato: "Temperatura, densidade e velocidade diferentes mantêm as águas separadas por quilômetros.",
  },
  {
    pergunta: "O que é dragagem?",
    alternativas: [
      "A retirada de sedimentos do fundo do rio para manter a profundidade",
      "A pintura anticorrosiva do casco das embarcações",
      "A amarração das balsas no cais",
      "A limpeza da vegetação das margens",
    ],
    correta: 0,
    fato: "Sem dragagem, o assoreamento pode fechar o acesso das embarcações ao porto.",
  },
  {
    pergunta: "O calado de uma embarcação é:",
    alternativas: ["A parte do casco que fica submersa", "A altura do mastro", "A largura máxima do convés", "O peso total da carga"],
    correta: 0,
    fato: "É o calado que decide se a embarcação passa ou não em determinado trecho do rio.",
  },
  {
    pergunta: "Para que serve a régua de nível instalada no porto?",
    alternativas: [
      "Para medir a cota do rio, ou seja, a altura da água",
      "Para medir a velocidade da correnteza",
      "Para calcular o peso das balsas",
      "Para marcar a distância até a outra margem",
    ],
    correta: 0,
    fato: "A leitura diária da régua orienta a operação do porto durante todo o ano.",
  },
  {
    pergunta: "Qual EPI não pode faltar em serviços realizados sobre a água?",
    alternativas: ["Colete salva-vidas", "Protetor auricular", "Máscara de solda", "Perneira de raspa"],
    correta: 0,
    fato: "Trabalho sobre lâmina d'água exige colete, sinalização e equipe de resgate a postos.",
  },
  {
    pergunta: "O que é enrocamento?",
    alternativas: [
      "Uma camada de pedras que protege a margem contra a erosão",
      "Uma mistura de cimento e areia para reboco",
      "Uma escavação para fundação profunda",
      "Uma estrutura de madeira para andaimes",
    ],
    correta: 0,
    fato: "É uma das defesas mais usadas contra o desgaste das margens pela correnteza.",
  },
  {
    pergunta: 'Na Amazônia, o fenômeno das "terras caídas" é:',
    alternativas: [
      "O desmoronamento de trechos da margem do rio",
      "Uma chuva forte de fim de tarde",
      "O período mais seco do ano",
      "Um tipo de solo argiloso avermelhado",
    ],
    correta: 0,
    fato: "Costuma acontecer na vazante, quando a água baixa e a margem perde sustentação.",
  },
  {
    pergunta: "Qual material do concreto reage com a água e faz a mistura endurecer?",
    alternativas: ["O cimento", "A areia", "A brita", "O aditivo plastificante"],
    correta: 0,
    fato: "A reação se chama hidratação e continua acontecendo por semanas depois da concretagem.",
  },
  {
    pergunta: "O fck do concreto indica:",
    alternativas: ["A resistência do concreto à compressão", "O tempo de cura em dias", "A quantidade de água da mistura", "A cor final da peça"],
    correta: 0,
    fato: "É medido em corpos de prova rompidos em laboratório, normalmente aos 28 dias.",
  },
  {
    pergunta: "O que é uma balsa?",
    alternativas: [
      "Uma embarcação de fundo chato usada para transportar carga",
      "Um flutuante fixo usado como porto",
      "Um tipo de guindaste sobre trilhos",
      "Uma boia grande de sinalização",
    ],
    correta: 0,
    fato: "Fundo chato significa pouco calado, ideal para rios que mudam de profundidade.",
  },
  {
    pergunta: "O empurrador é a embarcação que:",
    alternativas: ["Impulsiona balsas e comboios pelo rio", "Transporta apenas passageiros", "Faz a dragagem do canal", "Mede a profundidade do leito"],
    correta: 0,
    fato: "Um único empurrador pode conduzir um comboio com milhares de toneladas.",
  },
  {
    pergunta: "Em quais estados a Antonelly atua?",
    alternativas: ["Amazonas, Rondônia e Roraima", "Apenas no Amazonas", "Amazonas e Pará", "Em todos os estados do país"],
    correta: 0,
    fato: "São mais de 49 municípios atendidos na Região Norte.",
  },
  {
    pergunta: "Em que ano a Antonelly foi fundada?",
    alternativas: ["2001", "1985", "2012", "2019"],
    correta: 0,
    fato: "Mais de duas décadas de atuação em obras e serviços na Região Norte.",
  },
  {
    pergunta: "Para as comunidades do interior do Amazonas, o principal caminho de transporte é:",
    alternativas: ["O rio", "A rodovia", "A ferrovia", "O transporte aéreo"],
    correta: 0,
    fato: "Por isso um porto de pequeno porte muda a rotina de uma comunidade inteira.",
  },
  {
    pergunta: "Os cabeços de amarração servem para:",
    alternativas: ["Prender os cabos das embarcações ao cais", "Sustentar a cobertura do porto", "Marcar o nível da água", "Iluminar a rampa de acesso"],
    correta: 0,
    fato: "São peças que recebem esforço constante e entram na rotina de inspeção do porto.",
  },
  {
    pergunta: "O que significa manutenção preventiva?",
    alternativas: [
      "O serviço feito antes de o problema aparecer",
      "O reparo feito depois da quebra",
      "A troca completa da estrutura",
      "A limpeza obrigatória no fim do ano",
    ],
    correta: 0,
    fato: "Prevenir custa uma fração do que custa recuperar uma estrutura já comprometida.",
  },
  {
    pergunta: "As boias coloridas ao longo do rio indicam:",
    alternativas: ["Os limites do canal seguro de navegação", "Os melhores pontos de pesca", "Os locais de embarque de passageiros", "A divisa entre municípios"],
    correta: 0,
    fato: "A sinalização náutica segue um padrão de cores reconhecido internacionalmente.",
  },
  {
    pergunta: "O DDS, Diálogo Diário de Segurança, acontece:",
    alternativas: ["Antes do início dos trabalhos, todos os dias", "Uma vez por mês", "Somente depois de um acidente", "Apenas na assinatura do contrato"],
    correta: 0,
    fato: "São poucos minutos por dia que mudam a estatística de acidentes de uma obra.",
  },
  {
    pergunta: "A NR-35 trata de:",
    alternativas: ["Trabalho em altura", "Espaço confinado", "Máquinas e equipamentos", "Instalações elétricas"],
    correta: 0,
    fato: "Ela vale para qualquer atividade acima de dois metros com risco de queda.",
  },
  {
    pergunta: "O que é aterro hidráulico?",
    alternativas: [
      "O preenchimento de uma área com material bombeado junto com água",
      "Um aterro feito apenas na época da cheia",
      "Uma barragem para geração de energia",
      "Uma escavação feita debaixo d'água",
    ],
    correta: 0,
    fato: "Muitas vezes o material vem da própria dragagem, aproveitando o sedimento retirado.",
  },
  {
    pergunta: "Qual equipamento mede ângulos e distâncias em levantamentos topográficos?",
    alternativas: ["A estação total", "O paquímetro", "A trena de bolso", "O prumo de pedreiro"],
    correta: 0,
    fato: "É a partir desse levantamento que a obra é locada no terreno com precisão.",
  },
  {
    pergunta: "Numa embarcação, bombordo é o lado:",
    alternativas: ["Esquerdo, para quem olha para a frente", "Direito, para quem olha para a frente", "De trás", "O fundo do casco"],
    correta: 0,
    fato: "O lado direito é boreste. Os nomes evitam confusão a bordo, seja qual for a direção.",
  },
  {
    pergunta: "A proa de uma embarcação é:",
    alternativas: ["A parte da frente", "A parte de trás", "O piso interno", "A cabine de comando"],
    correta: 0,
    fato: "A parte de trás é a popa, e é lá que normalmente ficam o leme e os propulsores.",
  },
  {
    pergunta: "O famoso porto flutuante de Manaus foi inaugurado em:",
    alternativas: ["1902", "1850", "1967", "2004"],
    correta: 0,
    fato: "Ele sobe e desce com a cota do rio há mais de 120 anos, e ainda é referência de engenharia.",
  },
  {
    pergunta: "O que é o canteiro de obras?",
    alternativas: [
      "A área da obra com as instalações de apoio",
      "O escritório central da empresa",
      "O depósito de entulho",
      "A área verde plantada ao redor da obra",
    ],
    correta: 0,
    fato: "Um canteiro bem organizado é o primeiro indicador de uma obra segura.",
  },
  {
    pergunta: "A ponte metálica articulada de um porto flutuante serve para:",
    alternativas: [
      "Ligar a margem ao flutuante acompanhando a variação do nível",
      "Sustentar o guindaste do pátio",
      "Proteger a carga contra a chuva",
      "Funcionar como quebra-mar",
    ],
    correta: 0,
    fato: "A articulação é o que permite a passagem continuar segura na cheia e na seca.",
  },
];
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test -- perguntas`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/data/
git commit -m "feat: tipos do jogo e banco de 30 perguntas tipado"
```

---

## Task 3: Motor do jogo (`engine.ts`)

**Files:**
- Create: `src/game/engine.ts`, `src/game/engine.test.ts`

**Interfaces:**
- Consumes: `Pergunta`, `Alternativa`, `ItemPartida` de `@/game/types`
  (Task 2)
- Produces: `embaralhar<T>(lista: T[]): T[]`,
  `sortearPerguntas(banco: Pergunta[], sacola: number[], quantidade: number, embaralharAlternativas: boolean): { itens: ItemPartida[]; sacolaRestante: number[] }`,
  `calcularPercentual(acertos: number, total: number): number`,
  `mensagemResultado(percentual: number): string`

- [ ] **Step 1: Escrever os testes (falhando)**

`src/game/engine.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { embaralhar, sortearPerguntas, calcularPercentual, mensagemResultado } from "./engine";
import type { Pergunta } from "./types";

describe("embaralhar", () => {
  it("retorna todos os itens originais, sem repetir nem perder nenhum", () => {
    const original = [1, 2, 3, 4, 5];
    const resultado = embaralhar(original);
    expect([...resultado].sort()).toEqual([...original].sort());
  });

  it("não modifica o array original", () => {
    const original = [1, 2, 3];
    embaralhar(original);
    expect(original).toEqual([1, 2, 3]);
  });
});

function bancoFalso(tamanho: number): Pergunta[] {
  return Array.from({ length: tamanho }, (_, i) => ({
    pergunta: `Pergunta ${i}`,
    alternativas: ["A", "B", "C", "D"] as [string, string, string, string],
    correta: 0 as const,
    fato: `Fato ${i}`,
  }));
}

describe("sortearPerguntas", () => {
  it("sorteia a quantidade pedida de perguntas", () => {
    const banco = bancoFalso(30);
    const { itens } = sortearPerguntas(banco, [], 5, false);
    expect(itens).toHaveLength(5);
  });

  it("reabastece a sacola quando ela não tem itens suficientes", () => {
    const banco = bancoFalso(6);
    const { sacolaRestante } = sortearPerguntas(banco, [0, 1], 5, false);
    expect(sacolaRestante).toHaveLength(1);
  });

  it("marca certa=true só na alternativa do índice correto", () => {
    const banco: Pergunta[] = [
      { pergunta: "P1", alternativas: ["a", "b", "c", "d"], correta: 2, fato: "f" },
    ];
    const { itens } = sortearPerguntas(banco, [], 1, false);
    const certas = itens[0].alternativas.filter((a) => a.certa);
    expect(certas).toHaveLength(1);
    expect(certas[0].texto).toBe("c");
  });
});

describe("calcularPercentual", () => {
  it.each([
    [5, 5, 100],
    [4, 5, 80],
    [3, 5, 60],
    [2, 5, 40],
    [1, 5, 20],
    [0, 5, 0],
  ])("acertos=%i de total=%i -> %i%%", (acertos, total, esperado) => {
    expect(calcularPercentual(acertos, total)).toBe(esperado);
  });
});

describe("mensagemResultado", () => {
  it.each([
    [100, "Cheia máxima! Você conhece o rio de ponta a ponta"],
    [80, "Quase lá em cima: só faltou um palmo de água"],
    [60, "Boa navegação - o canal está aberto"],
    [40, "Águas médias: dá para melhorar na próxima"],
    [20, "Vazante. Passe no estande e a gente te conta o resto"],
    [0, "Seca total - mas todo mundo começa por aqui"],
  ])("percentual=%i -> mensagem certa", (pct, esperado) => {
    expect(mensagemResultado(pct)).toBe(esperado);
  });
});
```

Run: `npm test -- engine`
Expected: FAIL - `./engine` não existe ainda.

- [ ] **Step 2: Escrever `src/game/engine.ts`**

```ts
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
  if (percentual >= 60) return "Boa navegação - o canal está aberto";
  if (percentual >= 40) return "Águas médias: dá para melhorar na próxima";
  if (percentual >= 20) return "Vazante. Passe no estande e a gente te conta o resto";
  return "Seca total - mas todo mundo começa por aqui";
}
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `npm test -- engine`
Expected: PASS (9 testes)

- [ ] **Step 4: Commit**

```bash
git add src/game/engine.ts src/game/engine.test.ts
git commit -m "feat: motor puro do jogo (sorteio, pontuação, mensagens)"
```

---

## Task 4: Áudio (bips via Web Audio)

**Files:**
- Create: `src/game/audio.ts`, `src/game/audio.test.ts`

**Interfaces:**
- Produces: `sons.toque(): void`, `sons.certo(): void`, `sons.errado(): void`,
  `sons.fim(): void`

- [ ] **Step 1: Escrever o teste (falhando)**

`src/game/audio.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sons } from "./audio";

describe("sons", () => {
  let criarOscilador: ReturnType<typeof vi.fn>;
  let criarGanho: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const osc = {
      type: "",
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const ganho = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    criarOscilador = vi.fn(() => osc);
    criarGanho = vi.fn(() => ganho);

    // @ts-expect-error mock mínimo de AudioContext para o teste
    window.AudioContext = vi.fn(() => ({
      state: "running",
      currentTime: 0,
      destination: {},
      createOscillator: criarOscilador,
      createGain: criarGanho,
      resume: vi.fn(),
    }));
  });

  it("sons.toque cria um oscilador", () => {
    sons.toque();
    expect(criarOscilador).toHaveBeenCalledTimes(1);
  });

  it("sons.certo cria três osciladores (um acorde)", () => {
    sons.certo();
    expect(criarOscilador).toHaveBeenCalledTimes(3);
  });

  it("não lança erro se AudioContext não existir no navegador", () => {
    // @ts-expect-error remove o mock para simular navegador sem suporte
    delete window.AudioContext;
    expect(() => sons.errado()).not.toThrow();
  });
});
```

Run: `npm test -- audio`
Expected: FAIL - `./audio` não existe ainda.

- [ ] **Step 2: Escrever `src/game/audio.ts`**

```ts
let contextoAudio: AudioContext | null = null;

function bip(freqs: number[], duracao = 0.12, tipo: OscillatorType = "sine", volume = 0.16) {
  try {
    const AudioContextClasse =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    contextoAudio = contextoAudio ?? new AudioContextClasse();
    if (contextoAudio.state === "suspended") contextoAudio.resume();

    freqs.forEach((freq, i) => {
      const osc = contextoAudio!.createOscillator();
      const ganho = contextoAudio!.createGain();
      osc.type = tipo;
      osc.frequency.value = freq;
      const t0 = contextoAudio!.currentTime + i * duracao * 0.85;
      ganho.gain.setValueAtTime(0, t0);
      ganho.gain.linearRampToValueAtTime(volume, t0 + 0.015);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
      osc.connect(ganho);
      ganho.connect(contextoAudio!.destination);
      osc.start(t0);
      osc.stop(t0 + duracao + 0.02);
    });
  } catch {
    // som é opcional - se o navegador bloquear/não suportar AudioContext, o jogo segue sem som
  }
}

export const sons = {
  toque: () => bip([520], 0.06, "triangle", 0.1),
  certo: () => bip([660, 880, 1180], 0.13),
  errado: () => bip([190, 140], 0.19, "sawtooth", 0.12),
  fim: () => bip([523, 659, 784, 1046], 0.15),
};
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `npm test -- audio`
Expected: PASS (3 testes)

- [ ] **Step 4: Commit**

```bash
git add src/game/audio.ts src/game/audio.test.ts
git commit -m "feat: efeitos sonoros via Web Audio"
```

---

## Task 5: Fontes auto-hospedadas e tema visual (CSS)

**Files:**
- Modify: `src/index.css`
- Create: `src/theme.css`

**Interfaces:**
- Produces: variáveis CSS globais (`--negro`, `--agua`, `--solimoes`,
  `--areia`, `--verde`, `--vermelho`, `--marca`, `--marca-2`, `--marca-rgb`,
  `--marca-texto`, `--raio`, `--nivel`, `--display`, `--dado`) e as classes
  usadas pelos componentes das próximas tasks (`.tela`, `.marca`, `.rio`,
  `.regua`, `.alt`, `.veredito`, `.botao`, `.painel`, etc.)

- [ ] **Step 1: Instalar as fontes auto-hospedadas**

```bash
npm install @fontsource-variable/archivo @fontsource/space-mono
```

- [ ] **Step 2: Criar `src/theme.css`** - portado quase literal do
  `<style>` do `mini-game-antonelly.html` original (linhas 18-319), com os
  tokens de verde de marca já ajustados (`--verde`, `--marca*`) para os
  valores validados na sessão anterior:

```css
@import "@fontsource-variable/archivo";
@import "@fontsource/space-mono/400.css";
@import "@fontsource/space-mono/700.css";

:root {
  --negro: #08151e;
  --negro-2: #0e2231;
  --agua: #123b52;
  --agua-2: #0d2b3d;
  --solimoes: #e0a94b;
  --solimoes-2: #b87a28;
  --areia: #f4ebda;
  --areia-dim: rgba(244, 235, 218, 0.58);
  --verde: #2fa84f;
  --vermelho: #e04a31;

  --marca: #2fa84f;
  --marca-2: #268f42;
  --marca-rgb: 47, 168, 79;
  --marca-texto: #0b2a12;

  --raio: 14px;
  --nivel: 10%;

  --display: "Archivo Variable", "Arial Narrow", system-ui, sans-serif;
  --dado: "Space Mono", ui-monospace, "Courier New", monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  background: var(--negro);
  color: var(--areia);
  font-family: var(--display);
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

body {
  background: radial-gradient(120% 80% at 50% -10%, var(--negro-2) 0%, var(--negro) 62%);
}

.rio {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--nivel);
  z-index: 0;
  pointer-events: none;
  transition: height 1000ms cubic-bezier(0.25, 0.9, 0.25, 1);
}
.rio__corpo {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--agua) 0%, var(--agua-2) 100%);
}
.rio__onda {
  position: absolute;
  left: 0;
  right: 0;
  top: -16px;
  height: 22px;
  background-repeat: repeat-x;
  background-size: 260px 22px;
}
.rio__onda--a {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 22' preserveAspectRatio='none'%3E%3Cpath d='M0 12 C 15 2, 25 22, 40 12 S 65 2, 80 12 S 105 22, 120 12 V22 H0 Z' fill='%23123B52'/%3E%3C/svg%3E");
  animation: correnteza 13s linear infinite;
}
.rio__onda--b {
  top: -9px;
  opacity: 0.5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 22' preserveAspectRatio='none'%3E%3Cpath d='M0 12 C 20 22, 30 2, 50 12 S 80 22, 100 12 S 115 6, 120 12 V22 H0 Z' fill='%23E0A94B'/%3E%3C/svg%3E");
  animation: correnteza 9s linear infinite reverse;
}
@keyframes correnteza {
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: 260px;
  }
}

.regua {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 74px;
  z-index: 1;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.regua--visivel {
  opacity: 1;
}
.regua__marca {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  transform: translateY(50%);
  font-family: var(--dado);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--areia-dim);
  transition: color 0.3s ease, opacity 0.3s ease;
}
.regua__marca::after {
  content: "";
  width: 16px;
  height: 2px;
  background: currentColor;
  opacity: 0.6;
}
.regua__marca span {
  order: -1;
}
.regua__marca--ativa {
  color: var(--solimoes);
}
.regua__marca--ativa::after {
  width: 30px;
  opacity: 1;
  height: 3px;
}

.tela {
  position: fixed;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: clamp(20px, 3.4vmin, 46px);
  padding-right: calc(clamp(20px, 3.4vmin, 46px) + 62px);
  animation: entra 0.45s ease both;
}
@keyframes entra {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.marca {
  font-family: var(--dado);
  font-size: clamp(11px, 1.5vmin, 15px);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--solimoes);
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: default;
}
.marca::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: var(--marca);
  transform: rotate(45deg);
}
.marca--logo::before {
  display: none;
}
.marca__logo {
  display: block;
  height: clamp(26px, 3.8vmin, 42px);
  width: auto;
}

.tempo {
  height: 5px;
  margin-top: 14px;
  border-radius: 99px;
  background: rgba(244, 235, 218, 0.12);
  overflow: hidden;
}
.tempo__barra {
  height: 100%;
  width: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--solimoes-2), var(--solimoes));
  transform-origin: left center;
}
.tempo__barra--curta {
  background: linear-gradient(90deg, #c0392b, var(--vermelho));
}

.abertura {
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  gap: clamp(18px, 2.6vmin, 34px);
}
.abertura .marca {
  position: absolute;
  top: clamp(20px, 3.4vmin, 46px);
}
.olho {
  font-family: var(--dado);
  font-size: clamp(12px, 1.7vmin, 16px);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--areia-dim);
}
.titulao {
  font-size: clamp(56px, 13vmin, 190px);
  line-height: 0.86;
  text-transform: uppercase;
  font-variation-settings: "wdth" 118, "wght" 900;
  letter-spacing: -0.02em;
}
.titulao em {
  display: block;
  font-style: normal;
  color: var(--solimoes);
}
.chamada {
  font-size: clamp(19px, 2.9vmin, 34px);
  line-height: 1.35;
  max-width: 22ch;
  font-variation-settings: "wdth" 100, "wght" 500;
  color: var(--areia-dim);
}
.chamada b {
  color: var(--areia);
  font-variation-settings: "wdth" 100, "wght" 700;
}

.botao-gigante {
  margin-top: clamp(10px, 2vmin, 26px);
  border: none;
  border-radius: var(--raio);
  cursor: pointer;
  background: var(--marca);
  color: var(--marca-texto);
  font-family: var(--display);
  font-variation-settings: "wdth" 112, "wght" 800;
  font-size: clamp(22px, 3.6vmin, 46px);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: clamp(22px, 3.4vmin, 40px) clamp(34px, 5vmin, 72px);
  min-height: 96px;
  box-shadow: 0 0 0 0 rgba(var(--marca-rgb), 0.45);
  animation: pulsa 2.6s ease-in-out infinite;
  transition: transform 0.12s ease;
}
.botao-gigante:active {
  transform: scale(0.97);
}
@keyframes pulsa {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(var(--marca-rgb), 0.42);
  }
  70% {
    box-shadow: 0 0 0 34px rgba(var(--marca-rgb), 0);
  }
}
.rodape-abertura {
  position: absolute;
  bottom: clamp(20px, 3.4vmin, 46px);
  font-family: var(--dado);
  font-size: clamp(11px, 1.5vmin, 15px);
  color: var(--areia-dim);
  letter-spacing: 0.08em;
}

.jogo__corpo {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(18px, 3vmin, 40px);
  min-height: 0;
}
.pergunta {
  font-size: clamp(26px, 5.2vmin, 68px);
  line-height: 1.1;
  font-variation-settings: "wdth" 108, "wght" 800;
  max-width: 18ch;
}
.alternativas {
  display: grid;
  gap: clamp(12px, 1.8vmin, 20px);
  grid-template-columns: 1fr;
}
@media (min-aspect-ratio: 1/1) {
  .alternativas {
    grid-template-columns: 1fr 1fr;
  }
}

.alt {
  display: flex;
  align-items: center;
  gap: clamp(14px, 2vmin, 24px);
  text-align: left;
  cursor: pointer;
  min-height: clamp(96px, 13vmin, 150px);
  padding: clamp(16px, 2.2vmin, 26px) clamp(18px, 2.4vmin, 30px);
  border-radius: var(--raio);
  border: 2px solid rgba(244, 235, 218, 0.18);
  background: rgba(244, 235, 218, 0.055);
  color: var(--areia);
  font-family: var(--display);
  font-size: clamp(17px, 2.5vmin, 30px);
  line-height: 1.22;
  font-variation-settings: "wdth" 100, "wght" 600;
  transition: transform 0.12s ease, background 0.2s ease, border-color 0.2s ease, opacity 0.3s ease;
}
.alt:focus-visible {
  outline: 3px solid var(--solimoes);
  outline-offset: 4px;
}
.alt:active {
  transform: scale(0.985);
}
.alt__letra {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: clamp(44px, 5.4vmin, 68px);
  height: clamp(44px, 5.4vmin, 68px);
  border-radius: 10px;
  background: rgba(244, 235, 218, 0.1);
  font-family: var(--dado);
  font-weight: 700;
  font-size: clamp(16px, 2.2vmin, 26px);
  color: var(--solimoes);
  transition: background 0.2s ease, color 0.2s ease;
}
.alt--certa {
  background: rgba(var(--marca-rgb), 0.2);
  border-color: var(--verde);
}
.alt--certa .alt__letra {
  background: var(--verde);
  color: #06210f;
}
.alt--errada {
  background: rgba(224, 74, 49, 0.18);
  border-color: var(--vermelho);
}
.alt--errada .alt__letra {
  background: var(--vermelho);
  color: #2a0a04;
}
.alt--apagada {
  opacity: 0.34;
}
.alt[disabled] {
  cursor: default;
}

.veredito {
  min-height: clamp(78px, 11vmin, 120px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.veredito--visivel {
  opacity: 1;
}
.veredito__titulo {
  font-size: clamp(20px, 2.9vmin, 36px);
  text-transform: uppercase;
  font-variation-settings: "wdth" 112, "wght" 800;
  letter-spacing: 0.01em;
}
.veredito--ok .veredito__titulo {
  color: var(--verde);
}
.veredito--nao .veredito__titulo {
  color: var(--vermelho);
}
.veredito__fato {
  font-size: clamp(14px, 1.9vmin, 22px);
  line-height: 1.35;
  color: var(--areia-dim);
  max-width: 56ch;
  font-variation-settings: "wdth" 100, "wght" 400;
}

.resultado {
  justify-content: center;
  gap: clamp(14px, 2.2vmin, 28px);
}
.nota {
  font-size: clamp(96px, 24vmin, 340px);
  line-height: 0.82;
  font-variation-settings: "wdth" 122, "wght" 900;
  color: var(--solimoes);
  letter-spacing: -0.03em;
}
.nota sup {
  font-size: 0.34em;
  vertical-align: super;
  margin-left: 0.04em;
}
.veredito-final {
  font-size: clamp(26px, 4.6vmin, 60px);
  line-height: 1.06;
  text-transform: uppercase;
  font-variation-settings: "wdth" 112, "wght" 800;
  max-width: 16ch;
}
.acertos {
  font-family: var(--dado);
  font-size: clamp(14px, 2vmin, 24px);
  letter-spacing: 0.08em;
  color: var(--areia-dim);
}
.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: clamp(8px, 1.6vmin, 20px);
}
.botao {
  border: none;
  border-radius: var(--raio);
  cursor: pointer;
  font-family: var(--display);
  font-variation-settings: "wdth" 110, "wght" 800;
  font-size: clamp(18px, 2.6vmin, 32px);
  text-transform: uppercase;
  padding: clamp(20px, 2.8vmin, 32px) clamp(28px, 4vmin, 56px);
  min-height: 88px;
  transition: transform 0.12s ease;
}
.botao:active {
  transform: scale(0.97);
}
.botao:focus-visible {
  outline: 3px solid var(--solimoes);
  outline-offset: 4px;
}
.botao--primario {
  background: var(--marca);
  color: var(--marca-texto);
}
.botao--fantasma {
  background: transparent;
  color: var(--areia);
  border: 2px solid rgba(244, 235, 218, 0.3);
}
.auto-volta {
  font-family: var(--dado);
  font-size: clamp(11px, 1.5vmin, 15px);
  letter-spacing: 0.08em;
  color: var(--areia-dim);
  margin-top: 6px;
}

.painel {
  position: fixed;
  inset: 0;
  z-index: 9;
  display: none;
  place-items: center;
  background: rgba(4, 10, 14, 0.86);
  backdrop-filter: blur(6px);
}
.painel--aberto {
  display: grid;
}
.painel__caixa {
  width: min(560px, 88vw);
  background: var(--negro-2);
  border: 1px solid rgba(244, 235, 218, 0.16);
  border-radius: 18px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.painel h2 {
  font-size: 22px;
  text-transform: uppercase;
  font-variation-settings: "wdth" 110, "wght" 800;
}
.painel__linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-family: var(--dado);
  font-size: 15px;
  color: var(--areia-dim);
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(244, 235, 218, 0.1);
}
.painel__linha b {
  color: var(--areia);
  font-size: 20px;
}
.painel__botoes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.mini {
  border: 1px solid rgba(244, 235, 218, 0.3);
  background: transparent;
  color: var(--areia);
  border-radius: 10px;
  padding: 14px 18px;
  font-family: var(--dado);
  font-size: 14px;
  cursor: pointer;
  min-height: 52px;
}
.mini--destaque {
  background: var(--marca);
  color: var(--marca-texto);
  border-color: var(--marca);
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Importar o tema em `src/index.css`**

```css
@import "tailwindcss";
@import "./theme.css";
```

- [ ] **Step 4: Confirmar que não há mais referência a CDN de fontes**

Run: `grep -r "fonts.googleapis" src/ index.html`
Expected: nenhum resultado

- [ ] **Step 5: Confirmar que o build continua passando**

Run: `npm run build`
Expected: sucesso

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/theme.css package.json package-lock.json
git commit -m "feat: fontes auto-hospedadas e tema visual portado do HTML original"
```

---

## Task 6: Componente `RioNivel` (rio + régua de cota)

**Files:**
- Create: `src/components/RioNivel.tsx`, `src/components/RioNivel.test.tsx`

**Interfaces:**
- Produces: `type MarcaRegua = { valor: number; rotulo: string; posPercent: number; ativa: boolean }`,
  `<RioNivel nivelPercent={number} marcas={MarcaRegua[]} />`

- [ ] **Step 1: Escrever o teste (falhando)**

`src/components/RioNivel.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RioNivel } from "./RioNivel";

describe("RioNivel", () => {
  it("aplica o nível como variável CSS --nivel", () => {
    const { container } = render(<RioNivel nivelPercent={42} marcas={[]} />);
    const rio = container.querySelector(".rio") as HTMLElement;
    expect(rio.style.getPropertyValue("--nivel")).toBe("42%");
  });

  it("não mostra a régua quando não há marcas", () => {
    const { container } = render(<RioNivel nivelPercent={10} marcas={[]} />);
    expect(container.querySelector(".regua")).not.toHaveClass("regua--visivel");
  });

  it("renderiza uma marca por item, com a ativa destacada", () => {
    render(
      <RioNivel
        nivelPercent={20}
        marcas={[
          { valor: 0, rotulo: "00", posPercent: 8, ativa: false },
          { valor: 1, rotulo: "01", posPercent: 20, ativa: true },
        ]}
      />
    );
    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText("01").closest(".regua__marca")).toHaveClass("regua__marca--ativa");
  });
});
```

Run: `npm test -- RioNivel`
Expected: FAIL - `./RioNivel` não existe ainda.

- [ ] **Step 2: Escrever `src/components/RioNivel.tsx`**

```tsx
export type MarcaRegua = {
  valor: number;
  rotulo: string;
  posPercent: number;
  ativa: boolean;
};

type RioNivelProps = {
  nivelPercent: number;
  marcas: MarcaRegua[];
};

export function RioNivel({ nivelPercent, marcas }: RioNivelProps) {
  return (
    <>
      <div className="rio" style={{ "--nivel": `${nivelPercent}%` } as React.CSSProperties}>
        <div className="rio__corpo" />
        <div className="rio__onda rio__onda--a" />
        <div className="rio__onda rio__onda--b" />
      </div>
      <div className={`regua ${marcas.length ? "regua--visivel" : ""}`} aria-hidden="true">
        {marcas.map((m) => (
          <div
            key={m.valor}
            className={`regua__marca ${m.ativa ? "regua__marca--ativa" : ""}`}
            style={{ bottom: `${m.posPercent}%` }}
          >
            <span>{m.rotulo}</span>
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `npm test -- RioNivel`
Expected: PASS (3 testes)

- [ ] **Step 4: Commit**

```bash
git add src/components/RioNivel.tsx src/components/RioNivel.test.tsx
git commit -m "feat: componente RioNivel (rio-assinatura + régua de cota)"
```

---

## Task 7: Tela de abertura

**Files:**
- Modify: `public/antonelly-logo.svg` (mover de `antonelly-logo.svg` na raiz)
- Create: `src/screens/Abertura.tsx`, `src/screens/Abertura.test.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores diretamente (é folha da árvore de UI)
- Produces: `<Abertura onComecar={() => void} onAbrirPainel={() => void} />`

- [ ] **Step 1: Mover o logo para `public/`**

```bash
mkdir -p public
git mv antonelly-logo.svg public/antonelly-logo.svg
```

- [ ] **Step 2: Escrever o teste (falhando)**

`src/screens/Abertura.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Abertura } from "./Abertura";

describe("Abertura", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mostra o botão de começar e o logo", () => {
    render(<Abertura onComecar={() => {}} onAbrirPainel={() => {}} />);
    expect(screen.getByRole("button", { name: /toque para começar/i })).toBeInTheDocument();
    expect(screen.getByAltText("Antonelly Construções")).toBeInTheDocument();
  });

  it("chama onComecar ao clicar no botão", () => {
    const onComecar = vi.fn();
    render(<Abertura onComecar={onComecar} onAbrirPainel={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    expect(onComecar).toHaveBeenCalledTimes(1);
  });

  it("abre o painel após 2s de toque longo na marca", () => {
    const onAbrirPainel = vi.fn();
    const { container } = render(<Abertura onComecar={() => {}} onAbrirPainel={onAbrirPainel} />);
    const marca = container.querySelector("[data-marca]") as HTMLElement;
    fireEvent.pointerDown(marca);
    vi.advanceTimersByTime(2000);
    expect(onAbrirPainel).toHaveBeenCalledTimes(1);
  });

  it("não abre o painel se soltar antes de 2s", () => {
    const onAbrirPainel = vi.fn();
    const { container } = render(<Abertura onComecar={() => {}} onAbrirPainel={onAbrirPainel} />);
    const marca = container.querySelector("[data-marca]") as HTMLElement;
    fireEvent.pointerDown(marca);
    vi.advanceTimersByTime(1000);
    fireEvent.pointerUp(marca);
    vi.advanceTimersByTime(2000);
    expect(onAbrirPainel).not.toHaveBeenCalled();
  });
});
```

Run: `npm test -- Abertura`
Expected: FAIL - `./Abertura` não existe ainda.

- [ ] **Step 3: Escrever `src/screens/Abertura.tsx`**

```tsx
import { useRef } from "react";

type AberturaProps = {
  onComecar: () => void;
  onAbrirPainel: () => void;
};

export function Abertura({ onComecar, onAbrirPainel }: AberturaProps) {
  const pressaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function iniciarPressao() {
    pressaoRef.current = setTimeout(onAbrirPainel, 2000);
  }
  function cancelarPressao() {
    if (pressaoRef.current) clearTimeout(pressaoRef.current);
  }

  return (
    <section className="tela tela--ativa abertura">
      <div
        className="marca marca--logo"
        data-marca
        onPointerDown={iniciarPressao}
        onPointerUp={cancelarPressao}
        onPointerLeave={cancelarPressao}
        onPointerCancel={cancelarPressao}
      >
        <img className="marca__logo" src="/antonelly-logo.svg" alt="Antonelly Construções" />
      </div>
      <p className="olho">Feira · Totem interativo</p>
      <h1 className="titulao">
        Desafio
        <em>do Rio</em>
      </h1>
      <p className="chamada">
        Cinco perguntas sobre o rio, o porto e a obra. <b>Quanto você sabe?</b>
      </p>
      <button className="botao-gigante" type="button" onClick={onComecar}>
        Toque para começar
      </button>
      <p className="rodape-abertura">Menos de 2 minutos · toque na tela</p>
    </section>
  );
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test -- Abertura`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add public/antonelly-logo.svg src/screens/Abertura.tsx src/screens/Abertura.test.tsx
git commit -m "feat: tela de abertura com logo real e toque longo pro painel"
```

---

## Task 8: Tela de jogo

**Files:**
- Create: `src/screens/Jogo.tsx`, `src/screens/Jogo.test.tsx`

**Interfaces:**
- Consumes: `ItemPartida`, `ResultadoPartida` de `@/game/types` (Task 2)
- Produces: `<Jogo itens={ItemPartida[]} segundosPorPergunta={number} msFeedbackCerto={number} msFeedbackErrado={number} mostrarFato={boolean} onTocar={(som: "toque"|"certo"|"errado") => void} onProgresso={(indiceAtual: number) => void} onFim={(resultado: ResultadoPartida) => void} />`
  - `onProgresso` é chamado com o número de perguntas já respondidas assim
  que o veredito de cada resposta é definido (usado pela Task 11 para
  atualizar o `RioNivel` em tempo real, do mesmo jeito que o
  `atualizarRegua` do HTML original).

- [ ] **Step 1: Escrever os testes (falhando)**

`src/screens/Jogo.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Jogo } from "./Jogo";
import type { ItemPartida } from "@/game/types";

function itemDeTeste(pergunta: string, certaIdx: number): ItemPartida {
  const textos = ["Alternativa 0", "Alternativa 1", "Alternativa 2", "Alternativa 3"];
  return {
    pergunta,
    fato: `Fato sobre ${pergunta}`,
    alternativas: textos.map((texto, i) => ({ texto, certa: i === certaIdx })),
  };
}

describe("Jogo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const itens = [itemDeTeste("Pergunta 1", 0), itemDeTeste("Pergunta 2", 1)];

  it("renderiza a primeira pergunta e suas 4 alternativas", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    expect(screen.getByText("Pergunta 1")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("responder certo mostra 'Isso mesmo!' e desabilita as alternativas", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0"));
    expect(screen.getByText("Isso mesmo!")).toBeInTheDocument();
    screen.getAllByRole("button").forEach((b) => expect(b).toBeDisabled());
  });

  it("responder errado mostra 'Não foi essa' e destaca a certa", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 1"));
    expect(screen.getByText("Não foi essa")).toBeInTheDocument();
    expect(screen.getByText("Alternativa 0").closest("button")).toHaveClass("alt--certa");
  });

  it("avança para a próxima pergunta após o tempo de feedback", () => {
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0"));
    vi.advanceTimersByTime(100);
    expect(screen.getByText("Pergunta 2")).toBeInTheDocument();
  });

  it("chama onFim com o resultado correto ao terminar todas as perguntas", () => {
    const onFim = vi.fn();
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onFim={onFim}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0")); // certa na pergunta 1
    vi.advanceTimersByTime(100);
    fireEvent.click(screen.getByText("Alternativa 1")); // certa na pergunta 2
    vi.advanceTimersByTime(100);

    expect(onFim).toHaveBeenCalledTimes(1);
    const resultado = onFim.mock.calls[0][0];
    expect(resultado.acertos).toBe(2);
    expect(resultado.total).toBe(2);
    expect(resultado.percentual).toBe(100);
    expect(resultado.tempoRespostasMs).toHaveLength(2);
  });

  it("chama onProgresso a cada resposta", () => {
    const onProgresso = vi.fn();
    render(
      <Jogo
        itens={itens}
        segundosPorPergunta={0}
        msFeedbackCerto={100}
        msFeedbackErrado={100}
        mostrarFato
        onProgresso={onProgresso}
        onFim={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Alternativa 0"));
    expect(onProgresso).toHaveBeenCalledWith(1);
  });
});
```

Run: `npm test -- Jogo`
Expected: FAIL - `./Jogo` não existe ainda.

- [ ] **Step 2: Escrever `src/screens/Jogo.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import type { ItemPartida, ResultadoPartida } from "@/game/types";

const LETRAS = ["A", "B", "C", "D"];

type JogoProps = {
  itens: ItemPartida[];
  segundosPorPergunta: number;
  msFeedbackCerto: number;
  msFeedbackErrado: number;
  mostrarFato: boolean;
  onTocar?: (som: "toque" | "certo" | "errado") => void;
  onProgresso?: (indiceAtual: number) => void;
  onFim: (resultado: ResultadoPartida) => void;
};

export function Jogo({
  itens,
  segundosPorPergunta,
  msFeedbackCerto,
  msFeedbackErrado,
  mostrarFato,
  onTocar,
  onProgresso,
  onFim,
}: JogoProps) {
  const [indice, setIndice] = useState(0);
  const [escolhaIdx, setEscolhaIdx] = useState<number | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [veredito, setVeredito] = useState<"certo" | "errado" | null>(null);
  const acertosRef = useRef(0);
  const temposRef = useRef<number[]>([]);
  const inicioPerguntaRef = useRef(Date.now());

  const item = itens[indice];
  const idxCerta = item.alternativas.findIndex((a) => a.certa);

  useEffect(() => {
    setEscolhaIdx(null);
    setBloqueado(false);
    setVeredito(null);
    inicioPerguntaRef.current = Date.now();

    if (!segundosPorPergunta) return;
    const cronometro = setTimeout(() => {
      responder(-1, false);
    }, segundosPorPergunta * 1000);
    return () => clearTimeout(cronometro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  function responder(idxEscolhido: number, certa: boolean) {
    if (bloqueado) return;
    setBloqueado(true);
    setEscolhaIdx(idxEscolhido);

    const tempo = Date.now() - inicioPerguntaRef.current;
    temposRef.current = [...temposRef.current, tempo];

    if (certa) {
      acertosRef.current += 1;
      setVeredito("certo");
      onTocar?.("certo");
    } else {
      setVeredito("errado");
      onTocar?.("errado");
    }

    onProgresso?.(indice + 1);

    const espera = certa ? msFeedbackCerto : msFeedbackErrado;
    setTimeout(() => {
      if (indice + 1 >= itens.length) {
        onFim({
          acertos: acertosRef.current,
          total: itens.length,
          percentual: Math.round((acertosRef.current / itens.length) * 100),
          tempoTotalMs: temposRef.current.reduce((a, b) => a + b, 0),
          tempoRespostasMs: temposRef.current,
        });
      } else {
        setIndice((i) => i + 1);
      }
    }, espera);
  }

  return (
    <section className="tela tela--ativa">
      <header className="topo">
        <div className="marca">
          Desafio do Rio
        </div>
        <div className="contador">
          <b>{indice + 1}</b> / {itens.length}
        </div>
      </header>
      <div className="tempo">
        <div className="tempo__barra" />
      </div>

      <div className="jogo__corpo">
        <h2 className="pergunta">{item.pergunta}</h2>
        <div className="alternativas">
          {item.alternativas.map((alt, i) => {
            const classes = ["alt"];
            if (bloqueado) {
              if (i === idxCerta) classes.push("alt--certa");
              else if (i === escolhaIdx) classes.push("alt--errada");
              else classes.push("alt--apagada");
            }
            return (
              <button
                key={alt.texto}
                type="button"
                className={classes.join(" ")}
                disabled={bloqueado}
                onClick={() => {
                  onTocar?.("toque");
                  responder(i, alt.certa);
                }}
              >
                <span className="alt__letra">{LETRAS[i]}</span>
                <span className="alt__txt">{alt.texto}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={[
          "veredito",
          veredito ? "veredito--visivel" : "",
          veredito === "certo" ? "veredito--ok" : "",
          veredito === "errado" ? "veredito--nao" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-live="polite"
      >
        <p className="veredito__titulo">
          {veredito === "certo" ? "Isso mesmo!" : veredito === "errado" ? "Não foi essa" : ""}
        </p>
        <p className="veredito__fato">{veredito && mostrarFato ? item.fato : ""}</p>
      </div>
    </section>
  );
}
```

> Nota: a barra de tempo visual (encolher em `segundosPorPergunta` segundos e
> ficar vermelha nos últimos 6s) é intencionalmente simplificada aqui - ela
> não afeta o resultado do jogo. Portar sua animação exata via CSS
> transition + classe `tempo__barra--curta` fica no checklist manual da
> Task 12.

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `npm test -- Jogo`
Expected: PASS (6 testes)

- [ ] **Step 4: Commit**

```bash
git add src/screens/Jogo.tsx src/screens/Jogo.test.tsx
git commit -m "feat: tela de jogo com fluxo de perguntas, veredito e captura de tempo"
```

---

## Task 9: Tela de resultado

**Files:**
- Create: `src/screens/Resultado.tsx`, `src/screens/Resultado.test.tsx`

**Interfaces:**
- Produces: `<Resultado percentual={number} acertos={number} total={number} mensagem={string} segundosAutoVolta={number} onJogarDeNovo={() => void} onProximoJogador={() => void} />`

- [ ] **Step 1: Escrever os testes (falhando)**

`src/screens/Resultado.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Resultado } from "./Resultado";

describe("Resultado", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function montar(props: Partial<React.ComponentProps<typeof Resultado>> = {}) {
    return render(
      <Resultado
        percentual={80}
        acertos={4}
        total={5}
        mensagem="Quase lá em cima: só faltou um palmo de água"
        segundosAutoVolta={25}
        onJogarDeNovo={() => {}}
        onProximoJogador={() => {}}
        {...props}
      />
    );
  }

  it("mostra a porcentagem, a mensagem e a contagem de acertos", () => {
    montar();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Quase lá em cima: só faltou um palmo de água")).toBeInTheDocument();
    expect(screen.getByText("4 de 5 perguntas certas")).toBeInTheDocument();
  });

  it("chama onJogarDeNovo ao clicar em 'Jogar de novo'", () => {
    const onJogarDeNovo = vi.fn();
    montar({ onJogarDeNovo });
    fireEvent.click(screen.getByRole("button", { name: /jogar de novo/i }));
    expect(onJogarDeNovo).toHaveBeenCalledTimes(1);
  });

  it("chama onProximoJogador ao clicar em 'Próximo jogador'", () => {
    const onProximoJogador = vi.fn();
    montar({ onProximoJogador });
    fireEvent.click(screen.getByRole("button", { name: /próximo jogador/i }));
    expect(onProximoJogador).toHaveBeenCalledTimes(1);
  });

  it("chama onProximoJogador automaticamente após segundosAutoVolta", () => {
    const onProximoJogador = vi.fn();
    montar({ segundosAutoVolta: 3, onProximoJogador });
    vi.advanceTimersByTime(3000);
    expect(onProximoJogador).toHaveBeenCalledTimes(1);
  });
});
```

Run: `npm test -- Resultado`
Expected: FAIL - `./Resultado` não existe ainda.

- [ ] **Step 2: Escrever `src/screens/Resultado.tsx`**

```tsx
import { useEffect, useState } from "react";

type ResultadoProps = {
  percentual: number;
  acertos: number;
  total: number;
  mensagem: string;
  segundosAutoVolta: number;
  onJogarDeNovo: () => void;
  onProximoJogador: () => void;
};

export function Resultado({
  percentual,
  acertos,
  total,
  mensagem,
  segundosAutoVolta,
  onJogarDeNovo,
  onProximoJogador,
}: ResultadoProps) {
  const [restante, setRestante] = useState(segundosAutoVolta);

  useEffect(() => {
    setRestante(segundosAutoVolta);
    const intervalo = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(intervalo);
          onProximoJogador();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosAutoVolta]);

  return (
    <section className="tela tela--ativa resultado">
      <div className="marca">
        <span aria-hidden="true" /> Desafio do Rio
      </div>
      <p className="olho" style={{ marginTop: "auto" }}>
        Sua cota
      </p>
      <p className="nota">
        {percentual}
        <sup>%</sup>
      </p>
      <h2 className="veredito-final">{mensagem}</h2>
      <p className="acertos">
        {acertos} de {total} perguntas certas
      </p>
      <div className="acoes">
        <button className="botao botao--primario" type="button" onClick={onJogarDeNovo}>
          Jogar de novo
        </button>
        <button className="botao botao--fantasma" type="button" onClick={onProximoJogador}>
          Próximo jogador
        </button>
      </div>
      <p className="auto-volta">Voltando à tela inicial em {restante}s</p>
      <div style={{ marginTop: "auto" }} />
    </section>
  );
}
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `npm test -- Resultado`
Expected: PASS (4 testes)

- [ ] **Step 4: Commit**

```bash
git add src/screens/Resultado.tsx src/screens/Resultado.test.tsx
git commit -m "feat: tela de resultado com contagem regressiva automática"
```

---

## Task 10: Painel do operador

**Files:**
- Create: `src/components/PainelOperador.tsx`, `src/components/PainelOperador.test.tsx`

**Interfaces:**
- Produces: `<PainelOperador aberto={boolean} partidas={number} mediaPercentual={number|null} tamanhoBanco={number} somLigado={boolean} onFechar={() => void} onAlternarSom={() => void} onZerar={() => void} onTelaCheia={() => void} />`

- [ ] **Step 1: Escrever os testes (falhando)**

`src/components/PainelOperador.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PainelOperador } from "./PainelOperador";

function propsPadrao() {
  return {
    aberto: true,
    partidas: 3,
    mediaPercentual: 60,
    tamanhoBanco: 30,
    somLigado: true,
    onFechar: vi.fn(),
    onAlternarSom: vi.fn(),
    onZerar: vi.fn(),
    onTelaCheia: vi.fn(),
  };
}

describe("PainelOperador", () => {
  it("não renderiza nada quando fechado", () => {
    const { container } = render(<PainelOperador {...propsPadrao()} aberto={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra as estatísticas quando aberto", () => {
    render(<PainelOperador {...propsPadrao()} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("mostra travessão quando não há média ainda", () => {
    render(<PainelOperador {...propsPadrao()} mediaPercentual={null} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("cada botão chama seu callback", () => {
    const props = propsPadrao();
    render(<PainelOperador {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /som:/i }));
    expect(props.onAlternarSom).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /tela cheia/i }));
    expect(props.onTelaCheia).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /zerar contadores/i }));
    expect(props.onZerar).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(props.onFechar).toHaveBeenCalledTimes(1);
  });
});
```

Run: `npm test -- PainelOperador`
Expected: FAIL - `./PainelOperador` não existe ainda.

- [ ] **Step 2: Escrever `src/components/PainelOperador.tsx`**

```tsx
type PainelOperadorProps = {
  aberto: boolean;
  partidas: number;
  mediaPercentual: number | null;
  tamanhoBanco: number;
  somLigado: boolean;
  onFechar: () => void;
  onAlternarSom: () => void;
  onZerar: () => void;
  onTelaCheia: () => void;
};

export function PainelOperador({
  aberto,
  partidas,
  mediaPercentual,
  tamanhoBanco,
  somLigado,
  onFechar,
  onAlternarSom,
  onZerar,
  onTelaCheia,
}: PainelOperadorProps) {
  if (!aberto) return null;

  return (
    <div className="painel painel--aberto">
      <div className="painel__caixa">
        <h2>Painel do operador</h2>
        <div className="painel__linha">
          Partidas nesta sessão <b>{partidas}</b>
        </div>
        <div className="painel__linha">
          Média de acerto <b>{mediaPercentual === null ? "-" : `${mediaPercentual}%`}</b>
        </div>
        <div className="painel__linha">
          Perguntas no banco <b>{tamanhoBanco}</b>
        </div>
        <div className="painel__botoes">
          <button className="mini" type="button" onClick={onAlternarSom}>
            Som: {somLigado ? "ligado" : "desligado"}
          </button>
          <button className="mini" type="button" onClick={onTelaCheia}>
            Tela cheia
          </button>
          <button className="mini" type="button" onClick={onZerar}>
            Zerar contadores
          </button>
          <button className="mini mini--destaque" type="button" onClick={onFechar}>
            Fechar
          </button>
        </div>
        <p style={{ fontFamily: "var(--dado)", fontSize: 12, color: "var(--areia-dim)", lineHeight: 1.5 }}>
          Para abrir este painel: mantenha o dedo 2 segundos sobre o nome no topo da tela.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `npm test -- PainelOperador`
Expected: PASS (4 testes)

- [ ] **Step 4: Commit**

```bash
git add src/components/PainelOperador.tsx src/components/PainelOperador.test.tsx
git commit -m "feat: painel do operador"
```

---

## Task 11: `App.tsx` - orquestração e comportamentos de quiosque

**Files:**
- Modify: `src/App.tsx` (substitui inteiramente a versão mínima da Task 1),
  `src/App.test.tsx` (substitui inteiramente o teste de fumaça da Task 1)

**Interfaces:**
- Consumes: `BANCO_PERGUNTAS` (Task 2), `sortearPerguntas`,
  `calcularPercentual`, `mensagemResultado` (Task 3), `sons` (Task 4),
  `RioNivel`/`MarcaRegua` (Task 6), `Abertura` (Task 7), `Jogo` (Task 8),
  `Resultado` (Task 9), `PainelOperador` (Task 10)

- [ ] **Step 1: Escrever o teste de integração (falhando)**

`src/App.test.tsx`:
```tsx
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";

describe("App - partida completa", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // random = 0.999999 faz o embaralhamento (Fisher-Yates) virar identidade:
    // a sacola sai na ordem original [0,1,2,...] e as alternativas de cada
    // pergunta também mantêm a ordem original do banco.
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("joga uma partida inteira acertando tudo e chega a 100% no resultado", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    expect(screen.getByText("1")).toBeInTheDocument();

    // com o shuffle virando identidade, a alternativa correta de toda
    // pergunta do banco cai sempre no índice 0 (ver Task 2: todo `correta: 0`)
    for (let i = 0; i < 5; i++) {
      const botoes = screen.getAllByRole("button").filter((b) => b.className.includes("alt"));
      act(() => {
        fireEvent.click(botoes[0]);
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("5 de 5 perguntas certas")).toBeInTheDocument();
  });

  it("'Jogar de novo' no resultado inicia uma nova partida", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /toque para começar/i }));
    for (let i = 0; i < 5; i++) {
      const botoes = screen.getAllByRole("button").filter((b) => b.className.includes("alt"));
      act(() => {
        fireEvent.click(botoes[0]);
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }
    fireEvent.click(screen.getByRole("button", { name: /jogar de novo/i }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
```

Run: `npm test -- App`
Expected: FAIL - o `App` da Task 1 só renderiza `<p>Desafio do Rio</p>`, não
tem fluxo de jogo.

- [ ] **Step 2: Reescrever `src/App.tsx` por completo**

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { BANCO_PERGUNTAS } from "@/data/perguntas";
import { sortearPerguntas, calcularPercentual, mensagemResultado } from "@/game/engine";
import type { ItemPartida, ResultadoPartida } from "@/game/types";
import { sons } from "@/game/audio";
import { RioNivel, type MarcaRegua } from "@/components/RioNivel";
import { PainelOperador } from "@/components/PainelOperador";
import { Abertura } from "@/screens/Abertura";
import { Jogo } from "@/screens/Jogo";
import { Resultado } from "@/screens/Resultado";

const CONFIG = {
  perguntasPorPartida: 5,
  segundosPorPergunta: 25,
  msFeedbackCerto: 2000,
  msFeedbackErrado: 2900,
  segundosOciosoJogo: 45,
  segundosOciosoResultado: 25,
  embaralharAlternativas: true,
  mostrarFato: true,
};

type Tela = "abertura" | "jogo" | "resultado";

export function App() {
  const [tela, setTela] = useState<Tela>("abertura");
  const [itens, setItens] = useState<ItemPartida[]>([]);
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [painelAberto, setPainelAberto] = useState(false);
  const [somLigado, setSomLigado] = useState(true);
  const [partidas, setPartidas] = useState(0);
  const [somaPercentual, setSomaPercentual] = useState(0);
  const sacolaRef = useRef<number[]>([]);
  const ociosoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tocar = useCallback(
    (som: "toque" | "certo" | "errado") => {
      if (!somLigado) return;
      sons[som]();
    },
    [somLigado]
  );

  function iniciarPartida() {
    const { itens: novosItens, sacolaRestante } = sortearPerguntas(
      BANCO_PERGUNTAS,
      sacolaRef.current,
      CONFIG.perguntasPorPartida,
      CONFIG.embaralharAlternativas
    );
    sacolaRef.current = sacolaRestante;
    setItens(novosItens);
    setIndiceAtual(0);
    setResultado(null);
    setTela("jogo");
  }

  function finalizarPartida(res: ResultadoPartida) {
    setResultado(res);
    setPartidas((p) => p + 1);
    setSomaPercentual((s) => s + res.percentual);
    tocar("certo");
    sons.fim();
    setTela("resultado");
  }

  function voltarAbertura() {
    setTela("abertura");
  }

  // comportamentos de quiosque: bloquear menu de contexto, arrastar e gestos
  useEffect(() => {
    const prevenir = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevenir);
    document.addEventListener("dragstart", prevenir);
    document.addEventListener("gesturestart", prevenir);
    return () => {
      document.removeEventListener("contextmenu", prevenir);
      document.removeEventListener("dragstart", prevenir);
      document.removeEventListener("gesturestart", prevenir);
    };
  }, []);

  // manter a tela sempre acesa
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function manterAcordado() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // wake lock é best-effort - pode não estar disponível no navegador/contexto
      }
    }
    function aoVisivel() {
      if (document.visibilityState === "visible") manterAcordado();
    }
    document.addEventListener("visibilitychange", aoVisivel);
    manterAcordado();
    return () => {
      document.removeEventListener("visibilitychange", aoVisivel);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  // timeout de ociosidade: volta pra abertura sem toque na tela
  useEffect(() => {
    function reiniciarOcioso() {
      if (ociosoRef.current) clearTimeout(ociosoRef.current);
      if (tela === "abertura") return;
      const segundos =
        tela === "resultado" ? CONFIG.segundosOciosoResultado + 5 : CONFIG.segundosOciosoJogo;
      ociosoRef.current = setTimeout(voltarAbertura, segundos * 1000);
    }
    reiniciarOcioso();
    document.addEventListener("pointerdown", reiniciarOcioso);
    return () => {
      document.removeEventListener("pointerdown", reiniciarOcioso);
      if (ociosoRef.current) clearTimeout(ociosoRef.current);
    };
  }, [tela]);

  const marcasRegua: MarcaRegua[] =
    tela === "jogo"
      ? Array.from({ length: itens.length + 1 }, (_, i) => ({
          valor: i,
          rotulo: String(i).padStart(2, "0"),
          posPercent: 8 + i * (26 / itens.length),
          ativa: i === indiceAtual,
        }))
      : tela === "resultado" && resultado
      ? [0, 25, 50, 75, 100].map((v) => ({
          valor: v,
          rotulo: `${v}%`,
          posPercent: 8 + v * 0.62,
          ativa: v === resultado.percentual,
        }))
      : [];

  const nivelPercent =
    tela === "jogo"
      ? 8 + indiceAtual * (26 / Math.max(itens.length, 1))
      : tela === "resultado" && resultado
      ? 8 + resultado.percentual * 0.62
      : 10;

  return (
    <>
      <RioNivel nivelPercent={nivelPercent} marcas={marcasRegua} />

      {tela === "abertura" && (
        <Abertura onComecar={iniciarPartida} onAbrirPainel={() => setPainelAberto(true)} />
      )}

      {tela === "jogo" && itens.length > 0 && (
        <Jogo
          itens={itens}
          segundosPorPergunta={CONFIG.segundosPorPergunta}
          msFeedbackCerto={CONFIG.msFeedbackCerto}
          msFeedbackErrado={CONFIG.msFeedbackErrado}
          mostrarFato={CONFIG.mostrarFato}
          onTocar={tocar}
          onProgresso={setIndiceAtual}
          onFim={finalizarPartida}
        />
      )}

      {tela === "resultado" && resultado && (
        <Resultado
          percentual={resultado.percentual}
          acertos={resultado.acertos}
          total={resultado.total}
          mensagem={mensagemResultado(resultado.percentual)}
          segundosAutoVolta={CONFIG.segundosOciosoResultado}
          onJogarDeNovo={iniciarPartida}
          onProximoJogador={voltarAbertura}
        />
      )}

      <PainelOperador
        aberto={painelAberto}
        partidas={partidas}
        mediaPercentual={partidas ? Math.round(somaPercentual / partidas) : null}
        tamanhoBanco={BANCO_PERGUNTAS.length}
        somLigado={somLigado}
        onFechar={() => setPainelAberto(false)}
        onAlternarSom={() => setSomLigado((s) => !s)}
        onZerar={() => {
          setPartidas(0);
          setSomaPercentual(0);
        }}
        onTelaCheia={() => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
          else document.exitFullscreen?.();
        }}
      />
    </>
  );
}
```

> Nota: `calcularPercentual` importado de `@/game/engine` não é chamado
> diretamente aqui porque `Jogo` já calcula `percentual` dentro do
> `ResultadoPartida` que devolve via `onFim` (Task 8). Ele fica disponível
> para o plano de ranking, que vai precisar recalcular/comparar percentuais
> fora do fluxo de uma partida em andamento.

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS - todos os testes de todas as tasks anteriores continuam
passando, mais os 2 novos testes de integração do `App`.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: App.tsx orquestra as telas e os comportamentos de quiosque"
```

---

## Task 12: Build de produção, verificação offline e QA manual

**Files:**
- Modify: nenhum (task de verificação)
- Move: `mini-game-antonelly.html` → `legacy/mini-game-antonelly.html`

- [ ] **Step 1: Gerar o build de produção**

Run: `npm run build`
Expected: sucesso, gera `dist/`

- [ ] **Step 2: Confirmar que o build não depende de nenhum CDN externo**

Run: `grep -rE "fonts\.googleapis|fonts\.gstatic|cdn\." dist/`
Expected: nenhum resultado - todo asset (fontes, JS, CSS) está em `dist/`,
sem `<link>`/`@import` externo.

- [ ] **Step 3: Rodar a suíte completa uma última vez**

Run: `npm test`
Expected: PASS - todos os testes de todas as tasks

- [ ] **Step 4: Arquivar o HTML original como referência**

```bash
mkdir -p legacy
git mv mini-game-antonelly.html legacy/mini-game-antonelly.html
git add legacy/
git commit -m "chore: arquiva o protótipo HTML único como referência (legacy/)"
```

- [ ] **Step 5: QA manual no navegador** (não automatizável - requer olhos
  humanos e/ou um agente com acesso a browser)

Rodar `npm run dev`, abrir no navegador, e conferir contra o comportamento
do `legacy/mini-game-antonelly.html`:

- [ ] Tela de abertura mostra o logo real e o CTA pulsando em verde
- [ ] Toque longo (2s) na marca abre o painel do operador; soltar antes não abre
- [ ] Uma partida completa mostra 5 perguntas em sequência, cada uma com 4
      alternativas
- [ ] Resposta certa: fundo/borda verde, "Isso mesmo!", fato exibido
- [ ] Resposta errada: a certa fica verde, a escolhida fica vermelha, "Não
      foi essa"
- [ ] O rio (`RioNivel`) sobe visivelmente a cada pergunta respondida
- [ ] Tela de resultado mostra a % correta, a mensagem certa pro faixa de
      pontuação, e volta sozinha pra abertura após 25s
- [ ] "Jogar de novo" e "Próximo jogador" funcionam
- [ ] Testar em janela estreita (retrato) e larga (paisagem) - grid de
      alternativas muda de 1 para 2 colunas
- [ ] Comparar a barra de tempo (`tempo__barra`) com o original - no HTML
      legado ela encolhe de 100% a 0% ao longo de `segundosPorPergunta` e
      fica vermelha nos últimos 6s (ver `iniciarCronometro` em
      `legacy/mini-game-antonelly.html`); se a versão React não replicar
      isso ainda (Task 8 simplificou essa parte), anotar como item pendente
      pro plano de animação
- [ ] Tela cheia (botão do painel) e wake lock - funcionam melhor num
      dispositivo/touch real; anotar qualquer limitação observada

- [ ] **Step 6: Commit final (se algo foi ajustado na QA manual)**

```bash
git add -A
git commit -m "fix: ajustes de paridade visual encontrados na QA manual"
```

---

## Cobertura da spec (auto-revisão)

- Stack (Seção 1): ✅ Task 1
- Estrutura de pastas (Seção 1): ✅ Tasks 2-11
- Dados/tipos do jogo, base para ranking (Seção 2): ✅ Task 2 (`Pergunta`,
  `ResultadoPartida` já carrega `tempoTotalMs`/`tempoRespostasMs` para o
  desempate do ranking, que o próximo plano vai consumir)
- Fontes auto-hospedadas, offline-first (Seção 3/5): ✅ Task 5, verificado
  na Task 12
- `prefers-reduced-motion` (Seção 3): ✅ portado em `theme.css` (Task 5)
- UX responsiva por aspect-ratio (Seção 4): ✅ portado em `theme.css`
  (Task 5), verificado manualmente na Task 12
- Bibliotecas da Seção 5 (React, Vite, TS, Tailwind, shadcn, lucide não usado
  ainda - entra quando algum componente novo precisar de ícone): ✅ Task 1
- Ranking, Motion, confete, combo: **fora de escopo deste plano** - ver
  Seções 2 e 3 da spec, cobertas pelos próximos dois planos
  (`ranking-e-persistencia` e `animacao-e-polimento-totem`, a escrever após
  este plano ser executado e revisado)
