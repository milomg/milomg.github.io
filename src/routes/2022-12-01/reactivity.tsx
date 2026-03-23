import { Title } from "@solidjs/meta";
import { Globals } from "~/components/global";
import { clientOnly } from "@solidjs/start";
import { MDXComponents } from "mdx/types";
import { MDXDefault } from "~/components/mdx-default";
import { Mermaid } from "~/components/mermaid";
import MDXComponent from "~/blogs/reactivity.mdx";
import "../blog.css";
import { Nav } from "~/components/nav";

const Giscus = clientOnly(() => import("~/components/giscus"));

const MDXProps: MDXComponents = {
  ...MDXDefault,
  Mermaid,
};

export default function Page() {
  return (
    <Globals>
      <Title>Super Charging Fine-Grained Reactive Performance · milomg.dev</Title>
      <Nav />
      <div id="scroller">
        <div class="column">
          <MDXComponent components={MDXProps} />
          <Giscus />
        </div>
      </div>
    </Globals>
  );
}
