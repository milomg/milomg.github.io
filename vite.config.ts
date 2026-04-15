import { defineConfig } from "vite";
import { rollup as mdx } from "./mdx";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { nodeTypes } from "@mdx-js/mdx";
import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/vite-plugin-nitro-2";
import rehypeShiki from "@shikijs/rehype";

export default defineConfig({
  plugins: [
    mdx({
      include: /\.mdx?$/,
      jsx: true,
      jsxImportSource: "solid-js",
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        [rehypeRaw, { passThrough: nodeTypes }],
        [
          rehypeShiki,
          {
            themes: {
              light: "github-light",
              dark: "github-dark",
            },
            defaultColor: false,
          },
        ],
      ],
    }),
    solidStart({ extensions: ["md", "mdx"] }),
    nitroV2Plugin({
      static: true,
      compressPublicAssets: { gzip: false, brotli: false },
      prerender: {
        autoSubfolderIndex: false,
        crawlLinks: true,
        routes: ["/", "/404", "/2026-03-25/hashmap"],
      },
    }),
  ],
});
