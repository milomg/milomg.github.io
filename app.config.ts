import { defineConfig } from "@solidjs/start/config";
import { rollup as mdx } from "./mdx";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { rehypeLezer } from "./rehypeLezer";
import { nodeTypes } from "@mdx-js/mdx";

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
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypeRaw, { passThrough: nodeTypes }], rehypeLezer],
      }),
    ],
  },
});
