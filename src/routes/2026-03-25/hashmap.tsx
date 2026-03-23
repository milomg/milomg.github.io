import { Title } from "@solidjs/meta";
import { Globals } from "~/components/global";
import { Nav } from "~/components/nav";
import { clientOnly } from "@solidjs/start";
import { MDXDefault } from "~/components/mdx-default";
import MDXComponent from "~/blogs/hashmap.mdx";
import "../blog.css";

const Giscus = clientOnly(() => import("~/components/giscus"));

export default function Page() {
  return (
    <Globals>
      <Title>Super Charging Fine-Grained Reactive Performance 2 · milomg.dev</Title>
      <Nav />
      <div id="scroller">
        <div class="column">
          <MDXComponent components={MDXDefault} />
          <Giscus />
        </div>
      </div>
    </Globals>
  );
}
