import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Preload do woff2 do Archivo (latin, eixo wght - o usado em .pergunta e
// .alt__txt) direto no HTML do build: sem isto o navegador só descobre a
// fonte depois de baixar o CSS e montar a primeira tela. O nome tem hash,
// então precisa sair do bundle em vez de ficar fixo no index.html.
function preloadFontePerguntas(): Plugin {
  return {
    name: "preload-fonte-perguntas",
    apply: "build",
    transformIndexHtml(_html, ctx) {
      const arquivo = Object.keys(ctx.bundle ?? {}).find((f) => /archivo-latin-wght-normal-.*\.woff2$/.test(f));
      if (!arquivo) throw new Error("preload-fonte-perguntas: woff2 do Archivo não encontrado no bundle");
      return [
        {
          tag: "link",
          attrs: { rel: "preload", as: "font", type: "font/woff2", href: `./${arquivo}`, crossorigin: "" },
          injectTo: "head",
        },
      ];
    },
  };
}

// `--mode totem`: tudo (JS, CSS, fontes) dentro de um único index.html, que o
// Edge abre direto por file:// sem servidor. Os fundos SVG (~4 MB cada) ficam
// como arquivos em assets/ - <img>/url() por file:// não passa por CORS.
// A pasta totem/ (o .bat e o LEIA-ME) só entra neste build.
export default defineConfig(({ mode }) => {
  const totem = mode === "totem";
  return {
    base: "./",
    plugins: [react(), tailwindcss(), totem ? viteSingleFile({ useRecommendedBuildConfig: false }) : preloadFontePerguntas()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ...(totem && {
      publicDir: "totem",
      build: {
        outDir: "Mini-game-antonelly",
        assetsInlineLimit: (_arquivo: string, conteudo: Buffer) => conteudo.length < 1_000_000,
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
      // Com o JS embutido no HTML, import.meta.url passa a ser o index.html, não
      // assets/ - então o caminho dos fundos precisa ser relativo à página.
      experimental: { renderBuiltUrl: (arquivo: string) => `./${arquivo}` },
    }),
  };
});
