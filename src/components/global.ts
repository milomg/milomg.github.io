import { onCleanup, onMount } from "solid-js";
export function createGlobals() {
  onMount(() => {
    function tripleClick(evt: MouseEvent) {
      if (evt.detail === 3) {
        document.body.classList.toggle("light");
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
}
