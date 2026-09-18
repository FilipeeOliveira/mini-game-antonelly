let contextoAudio: AudioContext | null = null;

function garantirContexto(): AudioContext {
  const AudioContextClasse =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  contextoAudio = contextoAudio ?? new AudioContextClasse();
  if (contextoAudio.state === "suspended") contextoAudio.resume();
  return contextoAudio;
}

function bip(freqs: number[], duracao = 0.12, tipo: OscillatorType = "sine", volume = 0.16) {
  try {
    const ctx = garantirContexto();

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * duracao * 0.85;
      ganho.gain.setValueAtTime(0, t0);
      ganho.gain.linearRampToValueAtTime(volume, t0 + 0.015);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
      osc.connect(ganho);
      ganho.connect(ctx.destination);
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

// -----------------------------------------------------------------------
// Música de fundo - loop 16-bit estilo arcade de 15s, sintetizado via
// Web Audio (osciladores) em vez de um arquivo de áudio, pra ficar no
// mesmo espírito "sem asset externo" dos bips acima e não pesar o totem
// com download/licenciamento de trilha. 8 compassos de 16 semicolcheias =
// 128 passos, cada um com PASSO segundos, fecham em exatos 15s.
// -----------------------------------------------------------------------
const DURACAO_LOOP_MUSICA = 15;
const PASSOS_POR_COMPASSO = 16;
const COMPASSOS = 8;
const PASSO = DURACAO_LOOP_MUSICA / (PASSOS_POR_COMPASSO * COMPASSOS);

// Progressão Am-F-C-G (2 compassos por acorde) - clássica de fase de
// arcade. Baixo = fundamental de cada compasso; arpejo = tríade + oitava
// do mesmo acorde, percorrida nota a nota a cada semicolcheia.
const BAIXO_POR_COMPASSO = [110.0, 110.0, 87.31, 87.31, 130.81, 130.81, 98.0, 98.0];
const ARPEJO_POR_COMPASSO: number[][] = [
  [220.0, 261.63, 329.63, 440.0], // Am: A3 C4 E4 A4
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 220.0, 261.63, 349.23], // F: F3 A3 C4 F4
  [174.61, 220.0, 261.63, 349.23],
  [261.63, 329.63, 392.0, 523.25], // C: C4 E4 G4 C5
  [261.63, 329.63, 392.0, 523.25],
  [196.0, 246.94, 293.66, 392.0], // G: G3 B3 D4 G4
  [196.0, 246.94, 293.66, 392.0],
];

function notaMusica(
  ctx: AudioContext,
  destino: AudioNode,
  freq: number,
  inicio: number,
  duracao: number,
  tipo: OscillatorType,
  pico: number
) {
  const osc = ctx.createOscillator();
  const ganho = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  ganho.gain.setValueAtTime(0, inicio);
  ganho.gain.linearRampToValueAtTime(pico, inicio + duracao * 0.12);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
  osc.connect(ganho);
  ganho.connect(destino);
  osc.start(inicio);
  osc.stop(inicio + duracao + 0.02);
}

function agendarCompassosMusica(ctx: AudioContext, destino: AudioNode, inicioLoop: number) {
  for (let compasso = 0; compasso < COMPASSOS; compasso++) {
    const inicioCompasso = inicioLoop + compasso * PASSOS_POR_COMPASSO * PASSO;

    // baixo: 4 semínimas por compasso, onda triangular (grave, 16-bit)
    for (let batida = 0; batida < 4; batida++) {
      notaMusica(
        ctx,
        destino,
        BAIXO_POR_COMPASSO[compasso],
        inicioCompasso + batida * 4 * PASSO,
        PASSO * 3.4,
        "triangle",
        0.09
      );
    }

    // arpejo: 16 semicolcheias por compasso, onda quadrada (o "lead" chiptune)
    const acorde = ARPEJO_POR_COMPASSO[compasso];
    for (let passo = 0; passo < PASSOS_POR_COMPASSO; passo++) {
      notaMusica(ctx, destino, acorde[passo % 4], inicioCompasso + passo * PASSO, PASSO * 0.72, "square", 0.05);
    }
  }
}

let ganhoMusica: GainNode | null = null;
let musicaAgendada = false;
let timeoutMusica: ReturnType<typeof setTimeout> | null = null;

function agendarLoopMusica(ctx: AudioContext, destino: GainNode, inicioLoop: number) {
  agendarCompassosMusica(ctx, destino, inicioLoop);
  if (!musicaAgendada) return;
  // Agenda a próxima iteração um pouco antes do fim do loop atual: como as
  // notas em si usam o relógio do AudioContext (preciso por amostra), uma
  // folga do setTimeout (via wall clock, sujeito a jitter) não causa
  // gap/click audível - só precisa disparar a tempo de agendar a próxima
  // leva de notas antes de inicioLoop + DURACAO_LOOP_MUSICA chegar.
  const atrasoMs = Math.max(0, (DURACAO_LOOP_MUSICA - 0.3) * 1000);
  timeoutMusica = setTimeout(() => {
    if (!musicaAgendada || !contextoAudio || !ganhoMusica) return;
    agendarLoopMusica(contextoAudio, ganhoMusica, inicioLoop + DURACAO_LOOP_MUSICA);
  }, atrasoMs);
}

export const musica = {
  /** Liga o loop uma única vez (chamado no primeiro toque do totem, que
   * também serve pra desbloquear o AudioContext). Chamadas seguintes são
   * no-op - o volume depois é controlado só por `setVolume`. */
  iniciar(ligado: boolean) {
    if (musicaAgendada) return;
    try {
      const ctx = garantirContexto();
      ganhoMusica = ctx.createGain();
      ganhoMusica.gain.value = ligado ? 1 : 0;
      ganhoMusica.connect(ctx.destination);
      musicaAgendada = true;
      agendarLoopMusica(ctx, ganhoMusica, ctx.currentTime + 0.05);
    } catch {
      // música é opcional - se o navegador bloquear/não suportar AudioContext, o jogo segue sem som
    }
  },
  /** Silencia/religa via ganho, em vez de parar e reagendar o loop -
   * mutar no painel do operador não desalinha o compasso ao religar. */
  setVolume(ligado: boolean) {
    if (!ganhoMusica || !contextoAudio) return;
    ganhoMusica.gain.linearRampToValueAtTime(ligado ? 1 : 0, contextoAudio.currentTime + 0.15);
  },
  parar() {
    musicaAgendada = false;
    if (timeoutMusica) clearTimeout(timeoutMusica);
  },
};
