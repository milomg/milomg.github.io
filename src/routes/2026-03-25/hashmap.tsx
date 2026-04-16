import { Title } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";
import { MDXComponents } from "mdx/types";
import MDXComponent from "~/blogs/hashmap.mdx";
import { MDXDefault } from "~/components/mdx-default";
import { Globals } from "~/components/global";
import { CuckooInsert } from "~/components/hm/CuckooInsert";
import { InteractiveChain } from "~/components/hm/InteractiveChain";
import { ProbingDemo } from "~/components/hm/ProbingDemo";
import { RSQFInsert } from "~/components/hm/RSQFInsert";
import { RobinHoodPslInsert } from "~/components/hm/RobinHoodPslInsert";
import { SwissSplatCompare } from "~/components/hm/SwissSplatCompare";
import { HashmapConfigBenchmarks, HashmapLoadBenchmarks } from "~/components/hm/HashmapBenchmarks";

import { Nav } from "~/components/nav";
import "../blog.css";
import "./hashmap.css";

const Giscus = clientOnly(() => import("~/components/giscus"));

const MDXProps: MDXComponents = {
  ...MDXDefault,
  InteractiveChain,
  ProbingDemo,
  RobinHoodPslInsert,
  RSQFInsert,
  SwissSplatCompare,
  CuckooInsert,
  HashmapConfigBenchmarks,
  HashmapLoadBenchmarks,
};

export default function Page() {
  return (
    <Globals>
      <Title>High Performance Hashmaps · milomg.dev</Title>
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
