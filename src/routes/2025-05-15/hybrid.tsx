import { Title } from "@solidjs/meta";
import { Globals } from "~/components/global";
import MDXComponent from "~/blogs/height.mdx";
import { clientOnly } from "@solidjs/start";
import "../blog.css";
import { JSX } from "solid-js";
import { Dagre } from "~/components/dagre";
import { Slideshow } from "~/components/slideshow";
import { Dagre2 } from "~/components/dagre2";
import { Slideshow2 } from "~/components/slideshow2";
import { Dagre3 } from "~/components/dagre3";
const Giscus = clientOnly(() => import("~/components/giscus"));

function fixPropsStyle<T>(props: JSX.HTMLAttributes<T>) {
  if ("style" in props) {
    props.style = Object.entries(props.style as Record<string, string>)
      .map(([k, v]) => {
        k = k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        return `${k}:${v}`;
      })
      .join(";") as any;
  }
  return props;
}

export default function Page() {
  return (
    <Globals>
      <Title>Super Charging Fine-Grained Reactive Performance 2 · milomg.dev</Title>
      <nav>
        <div>
          <a href="/#top" id="logo">
            <div id="logo-img"></div>
          </a>
        </div>
        <ol class="links">
          <li>
            <a href="/#about">About</a>
          </li>
          <li>
            <a href="/#work">Projects</a>
          </li>
          <li>
            <a href="/#fun">Fun</a>
          </li>
        </ol>
      </nav>
      <div id="scroller">
        <div class="column">
          <MDXComponent
            components={{
              a: (props) => <a {...props} />,
              blockquote: (props) => <blockquote {...props} />,
              br: (props) => <br {...props} />,
              code: (props) => <code {...props} />,
              div: (props) => <div {...props} />,
              em: (props) => <em {...props} />,
              h1: (props) => <h1 {...props} />,
              h2: (props) => <h2 {...props} />,
              h3: (props) => <h3 {...props} />,
              h4: (props) => <h4 {...props} />,
              h5: (props) => <h5 {...props} />,
              h6: (props) => <h6 {...props} />,
              hr: (props) => <hr {...props} />,
              img: (props) => <img {...props} />,
              li: (props) => <li {...props} />,
              ol: (props) => <ol {...props} />,
              p: (props) => <p {...props} />,
              pre: (props) => <pre {...props} />,
              span: (props) => <span {...props} />,
              strong: (props) => <strong {...props} />,
              ul: (props) => <ul {...props} />,
              table: (props) => <table {...props} />,
              thead: (props) => <thead {...props} />,
              tbody: (props) => <tbody {...props} />,
              tr: (props) => <tr {...props} />,
              th: (props) => <th {...fixPropsStyle(props)} />,
              td: (props) => <td {...fixPropsStyle(props)} />,
              Dagre: Dagre,
              Carousel: Slideshow,
              HeightGraph: Dagre2,
              Dynamic: Slideshow2,
              BadHeight: Dagre3,
            }}
          />
          <Giscus />
        </div>
      </div>
    </Globals>
  );
}
