import { regl } from "./surfaces";
import { fullscreen, update, createSplat } from "./shaders";

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

const pointers = new Map<number, { x: number; y: number; dx: number; dy: number }>();

document.addEventListener("mousemove", (e) => {
  let pointer = pointers.get(-1);
  if (!pointer) {
    pointers.set(
      -1,
      (pointer = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        dx: 0,
        dy: 0,
      })
    );
  }
  pointer.dx = e.clientX - pointer.x;
  pointer.dy = e.clientY - pointer.y;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});
document.addEventListener("touchstart", (e) => {
  for (const touch of e.changedTouches) {
    pointers.set(touch.identifier, {
      x: touch.clientX,
      y: touch.clientX,
      dx: 0,
      dy: 0,
    });
  }
});
document.addEventListener("touchend", (e) => {
  for (const touch of e.changedTouches) {
    pointers.delete(touch.identifier);
  }
});
document.addEventListener("touchmove", (e) => {
  for (const touch of e.changedTouches) {
    let pointer = pointers.get(touch.identifier);
    if (!pointer) {
      pointers.set(
        touch.identifier,
        (pointer = {
          x: touch.clientX,
          y: touch.clientX,
          dx: 0,
          dy: 0,
        })
      );
    }
    pointer.dx = touch.clientX - pointer.x;
    pointer.dy = touch.clientY - pointer.y;
    pointer.x = touch.clientX;
    pointer.y = touch.clientY;
  }
});

window.onhashchange = () => {
  document.querySelector(window.location.hash)?.scrollIntoView();
};

console.log("%cHi! Nice to see you there", "font-size: x-large");
console.log("%cEaster egg #2", "font-size: xx-small; color: black; background: black;");
console.log("If you are wondering how I made this, the source code is at https://github.com/modderme123/modderme123.github.io");
console.log("The fluid simulation was made with https://regl.party and is inspired by GPU Gems");
