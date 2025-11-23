import { visit } from "unist-util-visit";
import { parser } from "@lezer/javascript";
import { highlightTree, type Highlighter } from "@lezer/highlight";
import { h } from "hastscript";
import { defaultHighlightStyle } from "@codemirror/language";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import type { Tree } from "@lezer/common";
import type { Root, Element, Text } from "hast";

function highlight(code: string, tree: Tree, style: Highlighter): (Text | Element)[] {
  const children: (Text | Element)[] = [];
  let lastEnd = 0;
  highlightTree(tree, style, (from, to, classes) => {
    if (from > lastEnd) {
      children.push({
        type: "text",
        value: code.slice(lastEnd, from),
      });
    }
    children.push(h("span", { class: classes }, code.slice(from, to)));
    lastEnd = to;
  });
  if (lastEnd < code.length) {
    children.push({ type: "text", value: code.slice(lastEnd) });
  }
  return children;
}

export const rehypeLezer = () => (tree: Root) =>
  visit(tree, { tagName: "pre" }, (node: Element) => {
    const codeNode = node.children.find((child): child is Element => child.type === "element" && child.tagName === "code");
    if (!codeNode) {
      return;
    }

    const code = (codeNode.children[0] as Text).value;
    const tree = parser.parse(code);

    const lightChildren = highlight(code, tree, defaultHighlightStyle);
    const darkChildren = highlight(code, tree, oneDarkHighlightStyle);

    codeNode.children = [h("div", { class: "light-theme" }, ...lightChildren), h("div", { class: "dark-theme" }, ...darkChildren)];
  });
