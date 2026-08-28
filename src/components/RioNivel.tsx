import type { CSSProperties } from "react";

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
      <div className="rio" style={{ "--nivel": `${nivelPercent}%` } as CSSProperties}>
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
