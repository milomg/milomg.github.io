import "zenscroll";
import { regl } from "./canvas";
import * as config from "./config";
import { fullscreen, update, display, drawLogo, createSplat } from "./shaders";

let t = 0;
regl.frame(() => {
  fullscreen(() => {
    if (window.scrollY < window.innerHeight / 2)
      drawLogo(1.0 - config.DENSITY_DISSIPATION);

    const frequency = 0.1;
    const red = Math.sin(frequency * t + 0) + 1;
    const green = Math.sin(frequency * t + 2) + 1;
    const blue = Math.sin(frequency * t + 4) + 1;
    t++;
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

    update(config);
    display();
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
