import { onMount } from "solid-js";
const mermaid = import("mermaid");

export const createMermaid = () =>
  onMount(async () => {
    const { default: m } = await mermaid;
    m.initialize({ startOnLoad: false, flowchart: { padding: 5 } });
    document.querySelectorAll(".language-mermaid").forEach((el) => {
      el.innerHTML = (el as HTMLElement).innerText
        .trim()
        .replace("<br>", "\n")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\(\((\w+)\)\)/, '@\{ shape: circle, label: "&nbsp; $1 &nbsp;" }');
    });
    await m.run({
      nodes: document.querySelectorAll(".language-mermaid"),
    });
  });
