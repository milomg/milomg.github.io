import { onMount } from "solid-js";
const mermaid = import("mermaid");

export const createMermaid = () =>
  onMount(async () => {
    const { default: m } = await mermaid;
    m.initialize({ startOnLoad: false });
    await m.run({
      nodes: document.querySelectorAll(".language-mermaid"),
    });
  });
