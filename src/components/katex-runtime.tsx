import { onMount } from "solid-js";
const katex = import("katex");

function renderMathCode(
  code: HTMLElement,
  displayMode: boolean,
  renderToString: (expr: string, options: { displayMode: boolean; throwOnError: boolean }) => string,
) {
  const source = (code.textContent ?? "").trim();
  if (!source) {
    return;
  }

  const html = renderToString(source, {
    displayMode,
    throwOnError: false,
  });

  if (displayMode) {
    const pre = code.closest("pre");
    if (pre) {
      pre.outerHTML = html;
      return;
    }
  }

  code.outerHTML = html;
}

export function createKatexRuntime() {
  onMount(async () => {
    const { default: k } = await katex;

    queueMicrotask(() => {
      document.querySelectorAll<HTMLElement>("code.language-math.math-display").forEach((el) => {
        renderMathCode(el, true, k.renderToString);
      });

      document.querySelectorAll<HTMLElement>("code.language-math.math-inline").forEach((el) => {
        renderMathCode(el, false, k.renderToString);
      });
    });
  });

  return null;
}
