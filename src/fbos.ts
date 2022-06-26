import { regl } from "./canvas";
import * as config from "./config";
import type REGL from "regl";

function doubleFbo(filter: REGL.TextureMagFilterType, downsample = config.TEXTURE_DOWNSAMPLE) {
  const fbos = [createFbo(filter, downsample), createFbo(filter, downsample)];
  return {
    read() {
      return fbos[0];
    },
    write() {
      return fbos[1];
    },
    swap() {
      fbos.reverse();
    },
  };
}

function createFbo(filter: REGL.TextureMagFilterType, downsample = config.TEXTURE_DOWNSAMPLE) {
  const tex = regl.texture({
    width: window.innerWidth >> downsample,
    height: window.innerHeight >> downsample,
    min: filter,
    mag: filter,
    type: "half float",
  });
  const framebuffer = regl.framebuffer({
    color: tex,
    depthStencil: false,
  });
  window.addEventListener("resize", () => {
    tex.resize(window.innerWidth >> downsample, window.innerHeight >> downsample);
    framebuffer.resize(window.innerWidth >> downsample, window.innerHeight >> downsample);
  });
  return framebuffer;
}

export const density = doubleFbo("linear");
export const velocity = doubleFbo("linear");
export const pressure = doubleFbo("nearest");
export const divergenceTex = createFbo("nearest");

function densityColor() {
  regl.clear({
    framebuffer: density.write(),
    color: [38 / 255, 50 / 255, 56 / 255, 1],
  });
  regl.clear({
    framebuffer: density.read(),
    color: [38 / 255, 50 / 255, 56 / 255, 1],
  });
}
window.addEventListener("resize", densityColor);
densityColor();
