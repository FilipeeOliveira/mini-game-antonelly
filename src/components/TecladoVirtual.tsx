const LINHAS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
  ["Á", "É", "Í", "Ó", "Ú", "Ã"],
  ["À", "Â", "Ê", "Ô", "Õ", "Ç"],
];

type TecladoVirtualProps = {
  onTecla: (letra: string) => void;
  onBackspace: () => void;
};

// Teclado próprio na tela - não confia no teclado do sistema operacional
// (totem touch, sem teclado físico). Só letras, espaço e acentos básicos do
// PT-BR; entrada sempre em caixa alta (ver game/nome.ts).
export function TecladoVirtual({ onTecla, onBackspace }: TecladoVirtualProps) {
  return (
    <div className="teclado">
      {LINHAS.map((linha, i) => (
        <div className="teclado__linha" key={i}>
          {linha.map((letra) => (
            <button key={letra} type="button" className="tecla" onClick={() => onTecla(letra)}>
              {letra}
            </button>
          ))}
        </div>
      ))}
      <div className="teclado__linha">
        <button type="button" className="tecla tecla--espaco" onClick={() => onTecla(" ")}>
          ESPAÇO
        </button>
        <button type="button" className="tecla tecla--backspace" onClick={onBackspace} aria-label="Apagar">
          ⌫
        </button>
      </div>
    </div>
  );
}
