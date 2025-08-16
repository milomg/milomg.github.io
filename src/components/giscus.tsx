import { JSX, onMount, useContext } from "solid-js";
import { ThemeContext } from "./global";

let importedGiscus = false;

const Giscus = (): JSX.Element => {
  const theme = useContext(ThemeContext);

  onMount(() => {
    if (importedGiscus) return;
    importedGiscus = true;
    import("giscus");
  });

  return (
    <giscus-widget
      repo="milomg/milomg.github.io"
      repoId="MDEwOlJlcG9zaXRvcnk0NjYzMzMzNA=="
      category="Comments"
      categoryId="DIC_kwDOAseRds4CoP1g"
      mapping="pathname"
      strict="1"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      theme={theme.dark() ? "dark" : "light"}
      lang="en"
    />
  );
};
export default Giscus;
