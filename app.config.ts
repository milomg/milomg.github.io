import { defineConfig } from "@solidjs/start/config";
import { rollup as mdx } from "./mdx";
import remarkGfm from "remark-gfm";
import remarkShikiTwoslash from "remark-shiki-twoslash";
import rehypeRaw from "rehype-raw";
import { nodeTypes } from "@mdx-js/mdx";
import type { Plugin } from "unified";

export default defineConfig({
  extensions: ["md", "mdx"],
  server: {
    static: true,
    compressPublicAssets: { gzip: false, brotli: false },
    prerender: {
      autoSubfolderIndex: false,
      crawlLinks: true,
      routes: ["/", "/404"],
    },
  },
  vite: {
    plugins: [
      mdx({
        include: /\.mdx?$/,
        jsx: true,
        jsxImportSource: "solid-js",
        remarkPlugins: [
          remarkGfm,
          [
            (remarkShikiTwoslash as unknown as { default: Plugin }).default,
            {
              lang: "typescript",
              themes: ["dark-plus", "light-plus"],
            },
          ],
        ],
        rehypePlugins: [[rehypeRaw, { passThrough: nodeTypes }]],
      }),
    ],
  },
});
