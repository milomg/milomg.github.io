import { Title } from "@solidjs/meta";
import { Globals } from "~/components/global";
import MDXComponent from "~/blogs/async.mdx";
import { clientOnly } from "@solidjs/start";
import { MDXDefault } from "~/components/mdx-default";
import "../blog.css";
import { Nav } from "~/components/nav";

const Giscus = clientOnly(() => import("~/components/giscus"));

export default function Page() {
  return (
    <Globals>
      <Title>Async in Standard Signals · milomg.dev</Title>
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
