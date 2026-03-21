import { defineConfig } from "vite";
import { rollup as mdx } from "./mdx";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { rehypeLezer } from "./rehypeLezer";
import { nodeTypes } from "@mdx-js/mdx";
import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/vite-plugin-nitro-2";

export default defineConfig({
  plugins: [
    mdx({
      include: /\.mdx?$/,
      jsx: true,
      jsxImportSource: "solid-js",
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypeRaw, { passThrough: nodeTypes }], rehypeLezer],
    }),
    solidStart({ extensions: ["md", "mdx"] }),
    nitroV2Plugin({
      static: true,
      compressPublicAssets: { gzip: false, brotli: false },
      prerender: {
        autoSubfolderIndex: false,
        crawlLinks: true,
        routes: ["/", "/404"],
      },
    }),
  ],
});
