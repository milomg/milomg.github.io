import { render } from "solid-js/web";
import { onMount } from "solid-js";
import { createSim, toggleBaseColor } from "~/components/sim/shaders";
import { createPointers } from "~/components/sim/pointers";

const App = () => {
  onMount(() => {
    console.log("%cHi! Nice to see you there", "font-size: x-large");
    console.log("%cEaster egg #2", "font-size: xx-small; color: black; background: black;");
    console.log("If you are wondering how I made this, the source code is at https://github.com/modderme123/modderme123.github.io");
    console.log("The fluid simulation was made with https://regl.party and is inspired by GPU Gems");
  });

  let c: HTMLCanvasElement;
  onMount(() => {
    function resize() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

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

    window.addEventListener("click", function (evt) {
      if (evt.detail === 3) {
        document.body.classList.toggle("light");
        toggleBaseColor();
      }
    });

    window.onhashchange = () => {
      document.querySelector(window.location.hash)?.scrollIntoView();
    };
  });

  return (
    <>
      <canvas ref={c!} id="c"></canvas>
      <nav>
        <div>
          <a href="#top" id="logo">
            <div id="logo-placeholder"></div>
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
            <h1>I'm Milo, a software mage</h1>
            <h1>working at Bubble, and studying at University of Toronto.</h1>
            <h1>
              <span class="nice">-----------------</span>
            </h1>
          </div>
        </section>
        <section id="about">
          <hr />
          <h2 title="Nice to meet you! I'm the hover text, what's your name?">about me</h2>
          <p>
            I'm a student at University of Toronto who loves to code. In my free time, I make graphical simulations, build frontend sites, and write
            the occasional Rust server. I carefully craft fast and clean code.
          </p>

          <div>
            <details open>
              <summary>TypeScript, HTML & CSS</summary>
              <p>
                I'm a core team member on SolidJS, where I research Solid 2.0 and lead the development of the Solid Playground. I've worked on
                multiple large TypeScript & React projects, and I love to keep up with the latest frontend trends. I'm currently working on
                standardizing Signals into JavaScript.
              </p>
            </details>
            <details open>
              <summary>Rust</summary>
              <p>
                In addition to loving cutting edge performance, I'm also a programming language polyglot. I've written several small WebGPU apps,
                networking servers, and even a compiler. I've even made a metasploit reverse shell payload.
              </p>
            </details>
            <details open>
              <summary>Scala & Java</summary>
              <p>
                I developed a massively multiplayer realtime browser game in Scala & ScalaJS called Snowy, a synthesis of my interest in graphics,
                physics, and networking. This project taught me about build tools, profiling, and functional programming.
              </p>
            </details>
            <details open>
              <summary>C#</summary>
              <p>
                I worked on a large microservices document management system used by thousands of lawyers. My work involved building an OAuth server
                for SSO and replacing a SQL Server ORM with native PostgreSQL.
              </p>
            </details>
            <details open>
              <summary>Others</summary>
              <p>
                I've also programmed in Typescript, Scala, Java, Rust, C#, Lean 4, Zig, Python, Haskell, Swift, C, Go, Koka, and Racket. I enjoy
                programming language theory and design.
              </p>
            </details>
          </div>
        </section>
        <section id="work">
          <hr />
          <h2>projects</h2>
          <p></p>
          <div>
            <div class="item">
              <img src="images/solidplayground.png" alt="solid playground" />
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
              <img src="images/timeviewer.png" alt="timeviewer" />
            </div>
            <div class="item">
              <img src="images/bbchallenge.png" alt="busy beaver challenge" />
              <div>
                <a href="https://bbchallenge.com">
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
              <img src="images/img1.png" alt="brownian motion simulation" />
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
              <img src="images/img2.png" alt="car simulation" />
            </div>
            <div class="item">
              <img src="images/img3.png" alt="boids simulation" />
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
          <h2>fun facts</h2>
          <ul>
            <li>
              My first blog post on reactivity algorithms is{" "}
              <a href="https://dev.to/modderme123/super-charging-fine-grained-reactive-performance-47ph">here</a>
            </li>
            <li>Before the pandemic I was learning to rock climb. My best was a V6.</li>
            <li>
              I have hidden a few <span title="Easter Egg 1">Easter eggs</span> in this site; see how many you can find.
            </li>
          </ul>
        </section>
        <div class="social">
          <a href="https://github.com/modderme123">GitHub</a>
          <a href="mailto:modderme123@gmail.com">Email</a>
        </div>
      </div>
    </>
  );
};

export default App;
