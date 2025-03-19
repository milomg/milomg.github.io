import { HttpStatusCode } from "@solidjs/start";
import { Title } from "@solidjs/meta";
import { onCleanup, onMount } from "solid-js";
import { Globals } from "~/components/global";
import { createPointers } from "~/components/sim/pointers";
import { createSim, toggleBaseColor } from "~/components/sim/shaders";
import "./*404.css";

export default function NotFound() {
  let c!: HTMLCanvasElement;
  onMount(() => {
    function tripleClick(evt: MouseEvent) {
      if (evt.detail === 3) {
        document.body.classList.toggle("light");
        toggleBaseColor();
      }
    }
    window.addEventListener("click", tripleClick);
    onCleanup(() => window.removeEventListener("click", tripleClick));

    function hashchange() {
      document.querySelector(window.location.hash)?.scrollIntoView();
    }
    window.addEventListener("hashchange", hashchange);
    onCleanup(() => window.removeEventListener("hashchange", hashchange));

    function resize() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    onCleanup(() => window.removeEventListener("resize", resize));
    resize();

    try {
      const pointers = createPointers();
      const { regl, update, fullscreen, createSplat } = createSim(c);
      let t = 0;
      regl.frame(() => {
        fullscreen(() => {
          const red = Math.sin(t + 0) * 0.8 + 0.8;
          const green = Math.sin(t + 2) * 0.8 + 0.8;
          const blue = Math.sin(t + 4) * 0.8 + 0.8;
          t += 0.1;

          for (const [, pointer] of pointers) {
            createSplat(pointer.x, pointer.y, pointer.dx * 10, pointer.dy * 10, [red, green, blue], 0.0005);
            pointer.dx *= 0.5;
            pointer.dy *= 0.5;
          }

          update();
        });
      });

      function tripleClick(evt: MouseEvent) {
        if (evt.detail === 3) {
          toggleBaseColor();
        }
      }
      window.addEventListener("click", tripleClick);
      onCleanup(() => window.removeEventListener("click", tripleClick));
    } catch (e) {
      console.error(e);
      c.remove();
      document.querySelector("#logo-placeholder")!.id = "logo-img";
    }
  });

  return (<Globals>
    <div>
      <HttpStatusCode code={404} />
      <Title>Page not found · milomg.dev</Title>
      <canvas ref={c!} id="c"></canvas>
      <nav>
        <div>
          <a href="/#top" id="logo">
            <div id="logo-placeholder" role="img" aria-label="logo"></div>
          </a>
        </div>
        <ol class="links">
          <li>
            <a href="/#about">About</a>
          </li>
          <li>
            <a href="/#work">Projects</a>
          </li>
          <li>
            <a href="/#fun">Fun</a>
          </li>
        </ol>
      </nav>
      <section>
        <h1>Page not found</h1>
        <p>
          I can't find the page you're looking for. Maybe you've mistyped it, or maybe I broke something. In the meantime, enjoy some{" "}
          <a href="https://open.spotify.com/playlist/37i9dQZF1DX3bH0P2uDnWA">Electro Swing</a>
        </p>
      </section>
    </div>
    </Globals>
  );
}
