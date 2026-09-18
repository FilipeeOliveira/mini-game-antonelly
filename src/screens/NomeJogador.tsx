import { useState } from "react";
import { FUNDO_ABERTURA } from "@/config/backgrounds";
import { TelaFundo } from "@/components/TelaFundo";
import { TecladoVirtual } from "@/components/TecladoVirtual";
import { normalizarNome, contemPalavraBloqueada, LIMITE_CARACTERES_NOME } from "@/game/nome";

type NomeJogadorProps = {
  onConfirmar: (nome: string) => void;
  onVoltar: () => void;
};

export function NomeJogador({ onConfirmar, onVoltar }: NomeJogadorProps) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function digitar(letra: string) {
    setErro(null);
    setTexto((atual) => (atual.length >= LIMITE_CARACTERES_NOME ? atual : atual + letra));
  }

  function apagar() {
    setErro(null);
    setTexto((atual) => atual.slice(0, -1));
  }

  function confirmar() {
    const normalizado = normalizarNome(texto);
    if (normalizado.length === 0) {
      setErro("Digite seu nome para continuar");
      return;
    }
    if (contemPalavraBloqueada(normalizado)) {
      setErro("Escolha outro nome");
      setTexto("");
      return;
    }
    onConfirmar(normalizado);
  }

  return (
    <section className="tela tela--ativa nome-jogador">
      <TelaFundo src={FUNDO_ABERTURA} />
      <h1 className="nome-jogador__titulo">Qual seu nome?</h1>
      <div className="nome-jogador__campo" aria-live="polite">
        {texto.length > 0 ? texto : <span className="nome-jogador__placeholder">SEU NOME</span>}
      </div>
      {erro && (
        <p className="nome-jogador__erro" role="alert">
          {erro}
        </p>
      )}
      <TecladoVirtual onTecla={digitar} onBackspace={apagar} />
      <div className="nome-jogador__acoes">
        <button className="botao-cta botao-cta--fantasma" type="button" onClick={onVoltar}>
          Voltar
        </button>
        <button className="botao-cta" type="button" onClick={confirmar}>
          Confirmar
        </button>
      </div>
    </section>
  );
}
