import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

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

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), preloadFontePerguntas()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
