import "zenscroll";
import { regl } from "./canvas";
import * as config from "./config";
import { fullscreen, update, displayMain as display, createSplat } from "./shaders";

let t = 0;
regl.frame(() => {
  fullscreen(() => {
    // if ()
      // drawLogo(1.0 - config.DENSITY_DISSIPATION);
    const red = Math.sin(t + 0) + 1;
    const green = Math.sin(t + 2) + 1;
    const blue = Math.sin(t + 4) + 1;
    t+=0.1;
    createSplat(
      pointer.x,
      pointer.y,
      pointer.dx * 10,
      pointer.dy * 10,
      [red, green, blue],
      config.SPLAT_RADIUS
    );
    pointer.dx *= 0.5;
    pointer.dy *= 0.5;

    for (let i = 0; i<10; i++) {
      const x = Math.cos(i/10*2*Math.PI);
      const y = Math.sin(i/10*2*Math.PI);
      createSplat(
        x*400+window.innerWidth/2,
        y*400+window.innerHeight/2,
        x * 300,
        y * 300,
        [red, green, blue],
        0.00002
      );
    }
    update(config);
    display(window.scrollY < window.innerHeight / 2);
  });
});

const pointer = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
};
document.addEventListener("mousemove", (e) => {
  pointer.dx = (e.clientX - pointer.x) * 10;
  pointer.dy = (e.clientY - pointer.y) * 10;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});

console.log("%cHi! Nice to see you there", "font-size: x-large");
console.log(
  "If you are wondering how I made this, the source code is at https://github.com/modderme123/modderme123.github.io"
);
console.log(
  "The fluid simulation was made with https://regl.party and is inspired by a GPU Gems chapter"
);
