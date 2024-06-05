import { CompileOptions } from "@mdx-js/mdx";
import { createFormatAwareProcessors, FormatAwareProcessors } from "@mdx-js/mdx/internal-create-format-aware-processors";
import { createFilter, FilterPattern } from "@rollup/pluginutils";
import { SourceMapGenerator } from "source-map";
import { VFile } from "vfile";
import { Plugin } from "vinxi";

type ApplicableOptions = Omit<CompileOptions, "SourceMapGenerator">;
interface ExtraOptions {
  exclude?: FilterPattern | null | undefined;
  include?: FilterPattern | null | undefined;
}
type Options = ApplicableOptions & ExtraOptions;

/**
 * Plugin to compile MDX w/ rollup.
 */
export function rollup(options?: Readonly<Options> | null | undefined): Plugin {
  const { exclude, include, ...rest } = options || {};
  let formatAwareProcessors: FormatAwareProcessors;
  const filter = createFilter(include, exclude);

  return {
    name: "@mdx-js/rollup",
    enforce: "pre",
    config(config, env) {
      formatAwareProcessors = createFormatAwareProcessors({
        SourceMapGenerator,
        development: env.mode === "development",
        ...rest,
      });
    },
    async transform(value, path) {
      if (!formatAwareProcessors) {
        formatAwareProcessors = createFormatAwareProcessors({
          SourceMapGenerator,
          ...rest,
        });
      }

      // Strip the queryparameters that are part of the file extension
      path = path.split("?")[0];

      const file = new VFile({ path, value });

      if (file.extname && filter(file.path) && formatAwareProcessors.extnames.includes(file.extname)) {
        const compiled = await formatAwareProcessors.process(file);
        let code = String(compiled.value);

        const result = {
          code,
          map: compiled.map,
        };
        return result;
      }
    },
  };
}
