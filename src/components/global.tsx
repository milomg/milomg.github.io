import { createContext, createSignal, onCleanup, onMount } from "solid-js";
import { StyleModule } from "style-mod";
import { defaultHighlightStyle } from "@codemirror/language";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";

export const ThemeContext = createContext<{ dark: () => boolean }>({
  dark: () => false,
});

export function Globals(props: { children: any }) {
  const [dark, setDark] = createSignal(false);

  onMount(() => {
    StyleModule.mount(document, defaultHighlightStyle.module!);
    StyleModule.mount(document, oneDarkHighlightStyle.module!);

    function tripleClick(evt: MouseEvent) {
      if (evt.detail === 3) {
        setDark((prev) => !prev);
        document.body.classList.toggle("light", !dark());
      }
    }
    window.addEventListener("click", tripleClick);
    onCleanup(() => window.removeEventListener("click", tripleClick));

    function hashchange() {
      document.querySelector(window.location.hash)?.scrollIntoView();
    }
    window.addEventListener("hashchange", hashchange);
    onCleanup(() => window.removeEventListener("hashchange", hashchange));
  });

  return <ThemeContext.Provider value={{ dark }}>{props.children}</ThemeContext.Provider>;
}
