import typescript from "@rollup/plugin-typescript";
import { string } from "rollup-plugin-string";
import copy from "rollup-plugin-copy";
import image from "@rollup/plugin-image";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

let plugins = [
  nodeResolve(),
  typescript(),
  image(),
  commonjs(),
  string({
    include: "**/*.{vert,frag}",
  }),
  copy({
    targets: [{ src: "public/*", dest: "dist/" }],
  }),
];
if (process.env.NODE_ENV == "production") plugins.push(terser());
export default {
  input: "src/script.ts",
  output: {
    file: "dist/bundle.js",
    format: "iife",
  },
  plugins,
};
