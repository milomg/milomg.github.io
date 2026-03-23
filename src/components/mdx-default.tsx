import type { MDXComponents } from "mdx/types";
import type { JSX } from "solid-js";

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

export const MDXDefault: MDXComponents = {
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
};
