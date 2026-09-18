// Ícone de coroa - usado no botão de RANKING (abertura e resultado) e no
// pódio do 1º lugar (Ranking.tsx), no mesmo estilo de SVG desenhado à mão
// dos outros ícones do projeto (IconeCheck em Jogo.tsx, IconeSelo em
// Resultado.tsx, IconeUsuario em Ranking.tsx). Compartilhado porque usam o
// mesmo ícone só em tamanhos diferentes.
export function IconeCoroa({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" fill="currentColor" />
    </svg>
  );
}
