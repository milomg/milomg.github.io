import { Title } from "@solidjs/meta";
import { Globals } from "~/components/global";
import MDXComponent from "~/blogs/reactivity.mdx";
import { clientOnly } from "@solidjs/start";
import "../blog.css";
import { Mermaid } from "~/components/mermaid";

const Giscus = clientOnly(() => import("~/components/giscus"));

export default function Page() {
  return (
    <Globals>
      <Title>Super Charging Fine-Grained Reactive Performance · milomg.dev</Title>
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
              th: (props) => <th {...props} />,
              td: (props) => <td {...props} />,
              Mermaid,
            }}
          />
          <Giscus />
        </div>
      </div>
    </Globals>
  );
}
