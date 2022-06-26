import type REGL from "regl";
import { regl } from "./canvas";
import { TEXTURE_DOWNSAMPLE } from "./config";
import { velocity, density, pressure, divergenceTex } from "./fbos";

import projectShader from "./shaders/project.vert?raw";
import splatShader from "./shaders/splat.frag?raw";
import advectShader from "./shaders/advect.frag?raw";
import divergenceShader from "./shaders/divergence.frag?raw";
import clearShader from "./shaders/clear.frag?raw";
import gradientShader from "./shaders/gradient.frag?raw";
import jacobiShader from "./shaders/jacobi.frag?raw";
import displayShader from "./shaders/display.frag?raw";
import vorticityShader from "./shaders/vorticity.frag?raw";

import imgURL from "/images/logo.png";

const texelSize: REGL.DynamicVariableFn<number[]> = ({ viewportWidth, viewportHeight }) => [1 / viewportWidth, 1 / viewportHeight];
const viewport: REGL.DynamicVariableFn<{
  x: number;
  y: number;
  width: number;
  height: number;
}> = ({ viewportWidth, viewportHeight }) => ({
  x: 0,
  y: 0,
  width: viewportWidth >> TEXTURE_DOWNSAMPLE,
  height: viewportHeight >> TEXTURE_DOWNSAMPLE,
});

export const fullscreen = regl({
  vert: projectShader,
  primitive: "triangle strip",
  attributes: {
    points: [-1, -1, -1, 1, 1, -1, 1, 1],
  },
  uniforms: {
    texelSize,
  },
  count: 4,
  viewport,
});

interface SplatProps {
  framebuffer: REGL.Framebuffer2D;
  x: REGL.Framebuffer2D;
  point: number[];
  color: number;
  radius: number;
}
const splat = regl({
  frag: splatShader,
  framebuffer: regl.prop<SplatProps, "framebuffer">("framebuffer"),
  uniforms: {
    x: regl.prop<SplatProps, "x">("x"),
    point: regl.prop<SplatProps, "point">("point"),
    color: regl.prop<SplatProps, "color">("color"),
    radius: regl.prop<SplatProps, "radius">("radius"),
  },
});

const img = new Image();
img.src = imgURL;
let display: undefined | REGL.DrawCommand;
img.onload = () =>
  (display = regl({
    frag: displayShader,
    uniforms: {
      density: density.read,
      velocity: velocity.read,
      image: regl.texture({ data: img, mag: "linear", min: "linear" }),
      texelSize
    },
    viewport: {},
  }));

const advectVelocity = regl({
  frag: advectShader,
  framebuffer: velocity.write,
  uniforms: {
    timestep: 0.017,
    dissipation: 0.98,
    color: [0, 0, 0, 1],
    x: velocity.read,
    velocity: velocity.read,
  },
});
const advectDensity = regl({
  frag: advectShader,
  framebuffer: density.write,
  uniforms: {
    timestep: 0.017,
    dissipation: 0.97,
    color: [38 / 255, 50 / 255, 56 / 255, 1],
    x: density.read,
    velocity: velocity.read,
  },
});
const divergence = regl({
  frag: divergenceShader,
  framebuffer: divergenceTex,
  uniforms: {
    velocity: velocity.read,
  },
});
const clearPressure = regl({
  frag: clearShader,
  framebuffer: pressure.write,
  uniforms: {
    pressure: pressure.read,
    dissipation: 0.8,
  },
});
const gradient = regl({
  frag: gradientShader,
  framebuffer: velocity.write,
  uniforms: {
    pressure: pressure.read,
    velocity: velocity.read,
  },
});
const jacobi = regl({
  frag: jacobiShader,
  framebuffer: pressure.write,
  uniforms: {
    pressure: pressure.read,
    divergence: divergenceTex,
  },
});
const vorticity = regl({
  frag: vorticityShader,
  framebuffer: velocity.write,
  uniforms: {
    velocity: velocity.read,
    timestep: 0.017,
    curl: 12,
  },
});

export function createSplat(x: number, y: number, dx: number, dy: number, color: number[], radius: number): void {
  splat({
    framebuffer: velocity.write(),
    x: velocity.read(),
    point: [x / window.innerWidth, 1 - y / window.innerHeight],
    radius,
    color: [dx, -dy, 1],
  });
  velocity.swap();

  splat({
    framebuffer: density.write(),
    x: density.read(),
    point: [x / window.innerWidth, 1 - y / window.innerHeight],
    radius,
    color,
  });
  density.swap();
}

export const update = (): void => {
  advectDensity();
  density.swap();

  advectVelocity();
  velocity.swap();

  divergence();

  clearPressure();
  pressure.swap();

  for (let i = 0; i < 25; i++) {
    jacobi();
    pressure.swap();
  }

  gradient();
  velocity.swap();

  vorticity();
  velocity.swap();

  if (display) {
    display();
  }
};
