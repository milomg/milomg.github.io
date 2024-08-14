import { onCleanup, onMount } from "solid-js";
import { createSim, toggleBaseColor } from "~/components/sim/shaders";
import { createPointers } from "~/components/sim/pointers";
import { A } from "@solidjs/router";
import "./index.css";
import { createGlobals } from "~/components/global";
import { Title } from "@solidjs/meta";

const App = () => {
  onMount(() => {
    console.log("%cHi! Nice to see you there", "font-size: x-large");
    console.log("%cEaster egg #2", "font-size: xx-small; color: black; background: black;");
    console.log("If you are wondering how I made this, the source code is at https://github.com/modderme123/modderme123.github.io");
    console.log("The fluid simulation was made with https://regl.party and is inspired by GPU Gems");
  });

  createGlobals();

  let c: HTMLCanvasElement;
  onMount(() => {
    function resize() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    onCleanup(() => window.removeEventListener("resize", resize));
    resize();

    try {
      // we create pointers inside onMount so that it doesn't run on the server
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

  return (
    <>
      <Title>Milo's Homepage · milomg.dev</Title>
      <canvas ref={c!} id="c"></canvas>
      <nav>
        <div>
          <a href="#top" id="logo">
            <div id="logo-placeholder" role="img" aria-label="logo"></div>
          </a>
        </div>
        <ol class="links">
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#work">Projects</a>
          </li>
          <li>
            <a href="#fun">Fun</a>
          </li>
        </ol>
      </nav>
      <div id="scroller">
        <section id="top">
          <div class="header">
            <h1>I'm Milo, a software engineer and a consultant with expertise in reactivity and web development</h1>
            <h1>
              <span class="nice">⠓⠑⠇⠇⠕ ⠺⠕⠗⠇⠙</span>
            </h1>
          </div>
        </section>
        <section id="about">
          <hr />
          <h2 title="Nice to meet you! I'm the hover text, what's your name?">about me</h2>
          <p>
            As a member of the Solid core team, a modern web development framework, I'm designing the reactivity core for Solid 2.0 and leading work
            on the Solid Playground. I'm also working with the technical comittee TC39 on standardizing Signals into JavaScript.
          </p>
          <p>
            I've helped companies modernize large TypeScript, React, Node, and C# projects, developing everything from data visualization to AWS
            infrastructure.
          </p>
          <p>
            In addition to loving cutting edge performance, I enjoy programming language theory and design. I've programmed in Typescript, Scala,
            Java, Rust, C#, Lean 4, Zig, Python, Haskell, Swift, C, Go, Koka, and Racket.
          </p>
          <p>
            In my free time, I have been experimenting with new programming ideas, cooking <span title="八宝粥">Chinese porridge</span>, and learning
            to boulder.
          </p>
        </section>
        <section id="work">
          <hr />
          <h2>projects</h2>
          <p></p>
          <div>
            <div class="item">
              <img src="/images/solidplayground.png" alt="solid playground" />
              <div>
                <a href="https://playground.solidjs.com">
                  <h2>Solid Playground</h2>
                </a>
                <p>
                  The Solid Playground is a web app that lets you write Solid code and see the results in real time. It uses Monaco and ESLint to
                  provide a developer experience that rivals a full local setup.
                </p>
              </div>
            </div>
            <div class="item">
              <div>
                <a href="https://github.com/cm-tech/timeviewer">
                  <h2>TimeViewer</h2>
                </a>
                <p>
                  TimeViewer is a web app that lets you view your daily activity in realtime with extreme precision. Its macOS window watcher was used
                  to rebuild ActivityWatch and is used by thousands of users daily.
                </p>
              </div>
              <img src="/images/timeviewer.png" alt="timeviewer" />
            </div>
            <div class="item">
              <img src="/images/bbchallenge.png" alt="busy beaver challenge" />
              <div>
                <a href="https://bbchallenge.org">
                  <h2>Busy Beaver Challenge</h2>
                </a>
                <p>
                  The Busy Beaver Challenge is working on a formal proof of the upper bound of BB(5). I added the interactive viewer of Turing
                  Machines that shows the simulations.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="sims">
          <hr />
          <h2>simulations</h2>
          <p>
            I have made over a hundred fun little simulation projects. I've put a few below and many more are available at{" "}
            <a href="https://cm-ht.ml">CM-Tech</a>, a name I use on projects that I build with my friend <a href="https://ckissane.github.io">Cole</a>
            .
          </p>
          <div>
            <div class="item">
              <img src="/images/img1.png" alt="brownian motion simulation" />
              <div>
                <a href="http://creative-coding.pages.dev/traffic-dots/">
                  <h2>Traffic dots</h2>
                </a>
                <p>
                  A fun project where dots move randomly semi locked to a grid. They bump into each other and you can click to repel or attract them,
                  depending on the setting.
                </p>
              </div>
            </div>
            <div class="item">
              <div>
                <a href="https://cm-tech.github.io/car-evolution/">
                  <h2>Car Evolution</h2>
                </a>
                <p>This project uses the planck.js physics engine to simulate and evolve cars to drive through a virtual course.</p>
              </div>
              <img src="/images/img2.png" alt="car simulation" />
            </div>
            <div class="item">
              <img src="/images/img3.png" alt="boids simulation" />
              <div>
                <a href="http://creative-coding.pages.dev/boids">
                  <h2>Boids</h2>
                </a>
                <p>
                  Boids is a term coined by Craig Reynolds that is used to describe objects which flock in groups. This project simulates boids shaped
                  like caterpillars.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="fun">
          <hr />
          <h2>more</h2>
          <ul>
            <li>
              I wrote a blog post on <A href="/2022-12-01/reactivity">reactivity algorithms</A>
            </li>
            <li>
              I have hidden a few <span title="Easter Egg 1">Easter eggs</span> in this site; see how many you can find.
            </li>
            <li>Triple click</li>
          </ul>
        </section>
        <div class="social">
          <a href="https://github.com/milomg">GitHub</a>
          <a href="mailto:milomg4@gmail.com">Email</a>
        </div>
      </div>
    </>
  );
};

export default App;
