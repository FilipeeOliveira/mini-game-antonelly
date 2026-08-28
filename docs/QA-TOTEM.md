# QA manual — Desafio do Rio (totem)

Checklist para conferência humana no navegador/hardware real, antes da
feira. Nada aqui foi (ou pode ser) verificado a partir do terminal — são
itens que exigem olhos humanos e, idealmente, o equipamento real do totem.

Referência de fidelidade visual: `legacy/mini-game-antonelly.html` (o
protótipo HTML único original, arquivado — abra em uma aba ao lado da
versão React para comparar lado a lado).

Como usar este documento: marque cada item com [x] conforme testado,
anote observações na coluna/linha ao lado do item, e reporte qualquer
divergência para quem for revisar antes do evento.

---

## 1. Fluxo funcional (comparar com o legado)

- [ ] Tela de abertura mostra o logo real (SVG da Antonelly) e o CTA
      pulsando em verde
- [ ] Toque longo (2s) na marca abre o painel do operador; soltar antes
      de completar os 2s **não** abre o painel
- [ ] Uma partida completa mostra 5 perguntas em sequência, cada uma com
      4 alternativas
- [ ] Resposta certa: fundo/borda fica verde, texto "Isso mesmo!", fato
      exibido
- [ ] Resposta errada: a alternativa certa fica verde, a escolhida fica
      vermelha, texto "Não foi essa"
- [ ] O rio (`RioNivel`) sobe visivelmente a cada pergunta respondida
- [ ] Tela de resultado mostra a % de acerto, a mensagem correspondente
      à faixa de pontuação, e volta sozinha para a abertura após 25s
- [ ] "Jogar de novo" e "Próximo jogador" funcionam como esperado
- [ ] Testar em janela estreita (retrato) e larga (paisagem) — grid de
      alternativas muda de 1 para 2 colunas (media query por
      `aspect-ratio`)

## 2. Desvios conhecidos do protótipo original (decisões já tomadas — confirmar que não parecem bug)

- [ ] **Barra de tempo volta a ser animada (fix aplicado — item deixou
      de ser um desvio conhecido).** A barra encolhe de 100% a 0% ao
      longo dos `segundosPorPergunta` (via `animation` CSS em
      `.tempo__barra`, reiniciada a cada pergunta) e ganha a classe
      vermelha `tempo__barra--curta` nos últimos 6s, fiel ao
      `iniciarCronometro` do original. Ela congela (não continua
      drenando) assim que o jogador responde, durante a pausa de
      feedback. QA: confirmar visualmente o encolhimento e a mudança de
      cor no hardware real; confirmar também que, com
      "Reduzir movimento" ativado no SO, a barra fica estática (o
      `@media (prefers-reduced-motion: reduce)` do `theme.css`
      neutraliza a animação de propósito — isso é esperado, não é bug).
- [ ] **Painel do operador só abre pela tela de abertura** (toque longo
      de 2s no logo). No original, o toque longo funcionava nas três
      telas (abertura, jogo, resultado). Na versão React, só funciona na
      abertura. QA: confirmar que isso é operacionalmente viável na
      prática — a tela de abertura reaparece entre cada jogador, e o
      timeout de inatividade devolve para a abertura em até 45s durante
      uma partida parada, então o operador nunca fica "preso" sem
      acesso ao painel por muito tempo. Testar esse fluxo de acesso ao
      painel em condição real de uso (alguém jogando, operador
      precisando intervir).
- [ ] **Atalhos de teclado foram removidos** (o original tinha
      Enter/Espaço para iniciar e teclas 1-4 para responder). Tab+Enter
      nativo dos botões continua funcionando (acessibilidade via
      teclado não foi perdida, só os atalhos numéricos diretos).
      Irrelevante para um totem touch-only; item anotado por
      completude, não requer ação.
- [ ] **Escala de exibição do Windows deve estar em 100%.** O layout
      dimensiona tudo com `clamp()`/`vmin`. Um Windows configurado com
      125%/150% de escala de tela distorce esses cálculos (o `vmin`
      passa a refletir pixels lógicos redimensionados pelo SO, não os
      pixels físicos do monitor). Isto é uma checagem de configuração
      no setup da máquina do totem, não um problema de código — mas
      precisa ser conferida fisicamente na máquina do evento.
- [ ] **Testar em paisagem e retrato no hardware real do totem**, já
      que o grid de alternativas muda de 1 para 2 colunas via media
      query de `aspect-ratio` (ver item na seção 1) — confirme
      especificamente na orientação que o totem físico vai usar no dia
      do evento, não só numa janela de navegador redimensionada.
- [ ] **Som, tela cheia e wake lock funcionam melhor em hardware touch
      real.** Navegadores bloqueiam áudio até haver um gesto do
      usuário, e a Wake Lock API exige contexto seguro (HTTPS ou
      `localhost`) — testar num laptop de desenvolvimento pode mascarar
      comportamentos que só aparecem na máquina/navegador real do
      totem. QA: confirmar explicitamente na máquina do evento:
  - [ ] Áudio dos acertos/erros toca normalmente após o primeiro toque
        do usuário
  - [ ] Botão de tela cheia do painel do operador funciona e mantém o
        totem em fullscreen
  - [ ] Wake lock impede a tela de apagar/dormir durante o uso
        (confirmar contexto seguro — ver seção "Como servir" abaixo)

## 3. Registro de observações

Use esta seção para anotar qualquer divergência encontrada durante a
QA que não esteja coberta pelos itens acima (bugs visuais, problemas de
performance, etc.), com a data e o nome de quem testou.

| Data | Testado por | Observação |
|------|-------------|------------|
|      |             |            |

---

## Como implantar no totem

1. **Build numa máquina de desenvolvimento:**
   ```bash
   npm install
   npm run build
   ```
   Isso gera a pasta `dist/` com todo o app (HTML, JS, CSS, fontes,
   logo) — nenhuma dependência externa é buscada em tempo de execução
   (ver auditoria offline no relatório da Task 12).

2. **Copiar a pasta `dist/` inteira** para a máquina Windows do totem
   (pendrive, rede local, etc.). Não é necessário copiar `node_modules`
   nem o restante do repositório — só o conteúdo de `dist/`.

3. **Obrigatório: servir `dist/` com um servidor estático local.**
   Abrir `dist/index.html` direto via `file://` **não é uma opção
   degradada — não funciona, ponto**: a tela fica em branco.

   **Por quê:** o `index.html` gerado carrega o bundle como
   `<script type="module" crossorigin src="./assets/index-….js">`
   (confirme com `cat dist/index.html` após o build — o `type="module"`
   e o `crossorigin` estão sempre lá, é como o Vite emite o entrypoint).
   Scripts de módulo ES são sempre buscados em modo CORS pelo
   navegador, e um documento aberto via `file://` tem origem `null` —
   o Chrome recusa a requisição antes mesmo de tentar ler o arquivo
   (erro típico no console: "Cross origin requests are only supported
   for protocol schemes: http, data, chrome, chrome-extension, ...").
   O `<link rel="stylesheet" crossorigin>` do CSS do bundle tem o mesmo
   problema. Ou seja, sob `file://` tanto o JS quanto o CSS falham ao
   carregar: o React nunca monta, a `<div id="root">` fica vazia, e não
   sobra estilo nenhum aplicado — não é "funciona mas sem wake lock", é
   uma tela em branco, sem nenhum conteúdo visível.

   Isto não tem relação com o fix do logo (Task 12, round 1): o logo
   hoje é importado como módulo e resolve certo tanto sob `file://`
   quanto atrás de um servidor — mas isso é irrelevante se o próprio
   script do bundle nunca chega a rodar. Não gaste tempo debugando o
   logo se a tela estiver em branco sob `file://`: é o CORS do
   `<script type="module">`, não o asset.

   Por isso o servidor estático local não é uma recomendação — é o
   único caminho que funciona. Ele também resolve a Wake Lock API, que
   exige contexto seguro (`https://` ou `http://localhost`) e nunca
   funcionaria sob `file://` de qualquer forma.

   ```bash
   # na máquina Windows, dentro da pasta dist/
   npx --yes serve -l 8080
   # ou qualquer outro servidor estático local equivalente
   ```

   Depois, aponte o Chrome em modo kiosk para `http://localhost:8080`:
   ```
   chrome.exe --kiosk http://localhost:8080
   ```

4. **Wake lock e contexto seguro:** a Wake Lock API do navegador só
   funciona em contexto seguro — `https://` ou `http://localhost`
   (loopback). Servir via `http://localhost:PORTA` na própria máquina
   do totem atende a esse requisito. Se o totem acessar `dist/` por um
   IP de rede local em vez de `localhost`, o wake lock pode não
   funcionar — testar essa combinação especificamente se for o caso de
   uso real.
