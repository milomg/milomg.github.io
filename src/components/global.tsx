import { createContext, createSignal, onCleanup, onMount } from "solid-js";

export const ThemeContext = createContext<{ dark: () => boolean }>({
  dark: () => false,
});

export function Globals(props: { children: any }) {
  const [dark, setDark] = createSignal(false);
  onMount(() => {
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
