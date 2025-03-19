import { onMount } from "solid-js";
const mermaid = import("mermaid");

export const createMermaid = () =>
  onMount(async () => {
    const { default: m } = await mermaid;
    m.initialize({ startOnLoad: false });
    document.querySelectorAll(".language-mermaid").forEach((el) => {
      el.innerHTML = (el as HTMLElement).innerText.trim().replace("<br>", "\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    });
    await m.run({
      nodes: document.querySelectorAll(".language-mermaid"),
    });
  });
