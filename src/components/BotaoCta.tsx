import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Crown } from "lucide-react";

type Variante = "primario" | "ranking";

const CLASSE_POR_VARIANTE: Record<Variante, string> = {
  primario: "botao-cta",
  ranking: "botao-cta botao-cta--ranking",
};

type BotaoCtaProps = {
  variante?: Variante;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type">;

// Wrapper fino em cima do sistema de botão que já existe em theme.css
// (.botao-cta + variantes) - existe só pra garantir que Abertura e
// Resultado nunca divirjam de novo (cada tela escrevia a className e o
// ícone do Ranking à mão). Nenhum CSS novo mora aqui, é tudo .botao-cta*.
export function BotaoCta({ variante = "primario", children, ...props }: BotaoCtaProps) {
  return (
    <button type="button" className={CLASSE_POR_VARIANTE[variante]} {...props}>
      {variante === "ranking" && <Crown size={34} fill="currentColor" />}
      {children}
    </button>
  );
}
