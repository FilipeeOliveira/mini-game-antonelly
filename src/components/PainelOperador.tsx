import { useEffect, useRef, useState } from "react";

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
  // Seção "Dados" - números vêm do histórico persistido (game/historico.ts),
  // calculados em App.tsx sempre que o painel abre.
  partidasHoje: number;
  partidasEvento: number;
  brindesPorTipo: Record<string, number>;
  onExportarCSV: () => void;
  onZerarRankingDia: () => void;
  onZerarTudo: () => void;
};

const MS_JANELA_CONFIRMACAO = 4000;

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
  partidasHoje,
  partidasEvento,
  brindesPorTipo,
  onExportarCSV,
  onZerarRankingDia,
  onZerarTudo,
}: PainelOperadorProps) {
  // Ações destrutivas (zerar ranking do dia / zerar tudo) pedem um segundo
  // toque dentro de MS_JANELA_CONFIRMACAO pra executar - a proteção real é a
  // confirmação dupla, não um gesto escondido difícil de descobrir.
  const [confirmando, setConfirmando] = useState<"dia" | "tudo" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aberto) setConfirmando(null);
  }, [aberto]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function clicarAcaoDestrutiva(tipo: "dia" | "tudo", acao: () => void) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (confirmando === tipo) {
      setConfirmando(null);
      acao();
      return;
    }
    setConfirmando(tipo);
    timeoutRef.current = setTimeout(() => setConfirmando(null), MS_JANELA_CONFIRMACAO);
  }

  if (!aberto) return null;

  const brindes = Object.entries(brindesPorTipo);

  return (
    <div className="painel painel--aberto">
      <div className="painel__caixa">
        <h2>Painel do operador</h2>

        <h3 className="painel__secao">Sessão</h3>
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
        </div>

        <h3 className="painel__secao">Dados</h3>
        <div className="painel__linha">
          Partidas hoje <b>{partidasHoje}</b>
        </div>
        <div className="painel__linha">
          Partidas no evento <b>{partidasEvento}</b>
        </div>
        <div className="painel__linha">
          Brindes entregues <b>{brindes.length ? brindes.map(([tipo, qtd]) => `${tipo}: ${qtd}`).join(" · ") : "-"}</b>
        </div>
        <div className="painel__botoes">
          <button className="mini" type="button" onClick={onExportarCSV}>
            Exportar CSV
          </button>
          <button className="mini" type="button" onClick={() => clicarAcaoDestrutiva("dia", onZerarRankingDia)}>
            {confirmando === "dia" ? "Confirmar zerar hoje?" : "Zerar ranking do dia"}
          </button>
          <button className="mini" type="button" onClick={() => clicarAcaoDestrutiva("tudo", onZerarTudo)}>
            {confirmando === "tudo" ? "Confirmar zerar tudo?" : "Zerar tudo"}
          </button>
        </div>

        <button className="mini mini--destaque" type="button" onClick={onFechar}>
          Fechar
        </button>
        <p style={{ fontFamily: "var(--dado)", fontSize: 12, color: "var(--areia-dim)", lineHeight: 1.5 }}>
          Para abrir este painel: mantenha o dedo 2 segundos sobre o nome no topo da tela.
        </p>
      </div>
    </div>
  );
}
