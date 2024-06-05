import { onMount } from "solid-js";
const mermaid = import("mermaid");

const Mermaid = () =>
  onMount(async () => {

    const { default: m } = await mermaid;
    m.initialize({ startOnLoad: false })
    await m.run({
      nodes: document.querySelectorAll(".language-mermaid"),
    });
  });

export default Mermaid;
