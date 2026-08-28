let contextoAudio: AudioContext | null = null;
let classeAudioContextAtual: typeof AudioContext | null = null;

function criarContextoAudio(Classe: typeof AudioContext): AudioContext {
  try {
    return new Classe();
  } catch {
    // Alguns mocks de teste (ex.: vi.fn com implementação arrow) não podem ser
    // chamados com `new`; nesses casos a chamada direta ainda produz o objeto
    // esperado. Em navegadores reais o `new Classe()` acima nunca lança.
    return (Classe as unknown as () => AudioContext)();
  }
}

function bip(freqs: number[], duracao = 0.12, tipo: OscillatorType = "sine", volume = 0.16) {
  try {
    const AudioContextClasse =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    // Reaproveita o contexto entre chamadas (evita esbarrar no limite de
    // AudioContexts do navegador). Só recria se o construtor mudou — o que só
    // acontece em testes, que trocam o mock a cada `beforeEach`; num navegador
    // real `window.AudioContext` nunca muda durante a sessão.
    if (!contextoAudio || classeAudioContextAtual !== AudioContextClasse) {
      contextoAudio = criarContextoAudio(AudioContextClasse);
      classeAudioContextAtual = AudioContextClasse;
    }
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
    // som é opcional — se o navegador bloquear/não suportar AudioContext, o jogo segue sem som
  }
}

export const sons = {
  toque: () => bip([520], 0.06, "triangle", 0.1),
  certo: () => bip([660, 880, 1180], 0.13),
  errado: () => bip([190, 140], 0.19, "sawtooth", 0.12),
  fim: () => bip([523, 659, 784, 1046], 0.15),
};
