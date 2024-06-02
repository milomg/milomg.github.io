import { defineConfig } from "@solidjs/start/config";
/* @ts-ignore */
import pkg from "@vinxi/plugin-mdx";

const { default: mdx } = pkg;

export default defineConfig({
  extensions: ["mdx", "md"],
  server: {
    static: true,
    compressPublicAssets: {gzip: false, brotli: false},
    prerender: {
          crawlLinks: true
        },
  },
  vite: {
    plugins: [
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx"
      })
    ]
  }
});
