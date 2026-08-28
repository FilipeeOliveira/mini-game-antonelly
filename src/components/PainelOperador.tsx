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
