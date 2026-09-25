import { TelaFundo } from "@/components/TelaFundo";
import { BotaoCta } from "@/components/BotaoCta";
import { Tela } from "@/components/Tela";
import { FUNDO_APRESENTACAO } from "@/config/backgrounds";

type ApresentacaoProps = {
  onContinuar: () => void;
};

// Entre a tela de nome e as perguntas. Só apresenta a empresa - o sorteio e
// o cronômetro começam no onContinuar (iniciarPartida em App.tsx), não aqui.
export function Apresentacao({ onContinuar }: ApresentacaoProps) {
  return (
    <Tela className="apresentacao">
      <TelaFundo src={FUNDO_APRESENTACAO} />
      <h1 className="apresentacao__titulo">Olá, somos a Antonelly!</h1>
      <p className="apresentacao__texto">
        Há mais de 20 anos, atuamos na construção civil e naval e na conservação de patrimônios públicos,
        contribuindo para o desenvolvimento da Região Norte. Com uma equipe qualificada, entrega soluções com qualidade,
        segurança e durabilidade, valorizando as comunidades locais em mais de 50 municípios e o respeito ao meio
        ambiente.
      </p>
      <BotaoCta onClick={onContinuar}>Continuar</BotaoCta>
    </Tela>
  );
}
