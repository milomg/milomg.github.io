import MDXComponent from "~/blogs/reactivity.mdx";
import { createMermaid } from "~/components/mermaid";

export default function Page() {
  createMermaid();

  return (
    <>
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
        <MDXComponent
          components={{
            a: (props) => <a {...props} />,
            blockquote: (props) => <blockquote {...props} />,
            br: (props) => <br {...props} />,
            code: (props) => <code {...props} />,
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
            strong: (props) => <strong {...props} />,
            ul: (props) => <ul {...props} />,
            table: (props) => <table {...props} />,
            thead: (props) => <thead {...props} />,
            tbody: (props) => <tbody {...props} />,
            tr: (props) => <tr {...props} />,
            th: (props) => <th {...props} />,
            td: (props) => <td {...props} />,
          }}
        />
      </div>
    </>
  );
}
