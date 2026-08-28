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

- [ ] **Barra de tempo não é animada.** No original (`iniciarCronometro`
      em `legacy/mini-game-antonelly.html`), a barra encolhe de 100% a
      0% ao longo dos 25s de cada pergunta e fica vermelha nos últimos
      6s. A versão React renderiza a barra estática (sem animação de
      encolhimento). **O timeout da pergunta continua funcionando
      normalmente** — só a representação visual do tempo passando é que
      não anima. Isso foi uma decisão de escopo sancionada (a animação
      fica para um plano futuro de polimento). QA: confirmar que a
      barra estática não parece quebrada ou enganosa para quem está
      jogando (ex.: não dar a impressão de que o cronômetro travou).
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

3. **Recomendado: servir `dist/` com um servidor estático local**, em
   vez de abrir `dist/index.html` direto via `file://`.

   **O que foi verificado:** o build usa `base: "./"` (ajustado na
   Task 12), então o `index.html`, o CSS e o JS do bundle referenciam
   os assets com caminho relativo (`./assets/...`). O logo da Antonelly
   também foi corrigido (fix round 1 da Task 12): antes ele era
   referenciado em `src/screens/Abertura.tsx` por um caminho absoluto
   hardcoded (`/antonelly-logo.svg`, servido da pasta `public/`), o que
   quebrava sob `file://` puro. Agora o logo mora em
   `src/assets/antonelly-logo.svg` e é importado como módulo
   (`import logoAntonelly from "@/assets/antonelly-logo.svg"`) — o Vite
   emite um arquivo com hash em `dist/assets/` e resolve a URL em
   runtime via `new URL(..., import.meta.url)`, que funciona tanto sob
   `file://` quanto atrás de um servidor. Verificado manualmente
   (resolução de URL simulada + checagem de que o arquivo existe no
   caminho resolvido) — ver relatório da Task 12 para o comando exato.

   Ainda assim, o servidor estático local continua sendo o caminho
   **recomendado** para o totem, não porque o logo quebre mais (não
   quebra), mas porque a Wake Lock API exige contexto seguro
   (`https://` ou `http://localhost`) — algo que `file://` nunca
   satisfaz, independente do logo. Ou seja: `file://` deve funcionar
   visualmente agora, mas ainda vai perder o wake lock.

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
