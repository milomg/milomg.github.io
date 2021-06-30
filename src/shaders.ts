import type REGL from "regl";
import { regl } from "./canvas";
import { TEXTURE_DOWNSAMPLE, VORTICITY_AMOUNT } from "./config";
import {
  velocity,
  density,
  pressure,
  divergenceTex,
  vorticityTex,
} from "./fbos";

import projectShader from "../shaders/project.vert";
import splatShader from "../shaders/splat.frag";
import logoShader from "../shaders/logo.frag";
import advectShader from "../shaders/advect.frag";
import divergenceShader from "../shaders/divergence.frag";
import clearShader from "../shaders/clear.frag";
import gradientSubtractShader from "../shaders/gradientSubtract.frag";
import jacobiShader from "../shaders/jacobi.frag";
import displayShader from "../shaders/display.frag";
import vorticityShader from "../shaders/vorticity.frag";
import vortForceShader from "../shaders/vortForce.frag";

import imgURL from "../public/images/logo.png";

const texelSize: REGL.DynamicVariableFn<number[]> = ({
  viewportWidth,
  viewportHeight,
}) => [1 / viewportWidth, 1 / viewportHeight];
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
  attributes: {
    points: [1, 1, 1, -1, -1, -1, 1, 1, -1, -1, -1, 1],
  },
  count: 6,
});
interface SplatProps {
  framebuffer: REGL.Framebuffer2D;
  uTarget: REGL.Framebuffer2D;
  point: number[];
  color: number;
  radius: number;
}
const splat = regl({
  frag: splatShader,
  framebuffer: regl.prop<SplatProps, "framebuffer">("framebuffer"),
  uniforms: {
    uTarget: regl.prop<SplatProps, "uTarget">("uTarget"),
    aspectRatio: ({ viewportWidth, viewportHeight }) =>
      viewportWidth / viewportHeight,
    point: regl.prop<SplatProps, "point">("point"),
    color: regl.prop<SplatProps, "color">("color"),
    radius: regl.prop<SplatProps, "radius">("radius"),
  },
  viewport,
});

const img = new Image();
img.src = imgURL;
interface LogoProps {
  logo: boolean;
}
let display: undefined | REGL.DrawCommand;
img.onload = () =>
  (display = regl({
    frag: displayShader,
    uniforms: {
      density: () => density.read,
      velocity: () => velocity.read,
      ratio: ({ viewportWidth: vw, viewportHeight: vh }) => [
        vw / Math.min(vw, vh),
        vh / Math.min(vw, vh),
      ],
      image: regl.texture({ data: img, mag: "linear", min: "linear" }),
      texelSize,
      logo: regl.prop<LogoProps, "logo">("logo")
    },
    // viewport,
  }));

interface AdvectProps {
  framebuffer: REGL.Framebuffer2D;
  color: number[];
  dissipation: number;
  x: REGL.Framebuffer2D;
}
const advect = regl({
  frag: advectShader,
  framebuffer: regl.prop<AdvectProps, "framebuffer">("framebuffer"),
  uniforms: {
    timestep: 0.017,
    dissipation: regl.prop<AdvectProps, "dissipation">("dissipation"),
    color: regl.prop<AdvectProps, "color">("color"),
    x: regl.prop<AdvectProps, "x">("x"),
    velocity: () => velocity.read,
    texelSize,
  },
  viewport,
});
const divergence = regl({
  frag: divergenceShader,
  framebuffer: divergenceTex,
  uniforms: {
    velocity: () => velocity.read,
    texelSize,
  },
  viewport,
});
const clear = regl({
  frag: clearShader,
  framebuffer: () => pressure.write,
  uniforms: {
    pressure: () => pressure.read,
    dissipation: regl.prop<LogoProps, "dissipation">("dissipation"),
  },
  viewport,
});
const gradientSubtract = regl({
  frag: gradientSubtractShader,
  framebuffer: () => velocity.write,
  uniforms: {
    pressure: () => pressure.read,
    velocity: () => velocity.read,
    texelSize,
  },
  viewport,
});
const jacobi = regl({
  frag: jacobiShader,
  framebuffer: () => pressure.write,
  uniforms: {
    pressure: () => pressure.read,
    divergence: () => divergenceTex,
    texelSize,
  },
  viewport,
});

export const vorticity = regl({
  frag: vorticityShader,
  framebuffer: vorticityTex,
  uniforms: {
    velocity: () => velocity.read,
    texelSize,
  },
});
export const vorticityForce = regl({
  frag: vortForceShader,
  framebuffer: () => velocity.write,
  uniforms: {
    velocity: () => velocity.read,
    vorticity: vorticityTex,
    texelSize,
    timestep: 0.017,
    curl: VORTICITY_AMOUNT,
  },
});
export function createSplat(
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: number[],
  radius: number
): void {
  splat({
    framebuffer: velocity.write,
    uTarget: velocity.read,
    point: [x / window.innerWidth, 1 - y / window.innerHeight],
    radius,
    color: [dx, -dy, 1],
  });
  velocity.swap();

  splat({
    framebuffer: density.write,
    uTarget: density.read,
    point: [x / window.innerWidth, 1 - y / window.innerHeight],
    radius,
    color,
  });
  density.swap();
}
export function displayMain(logo:boolean): void {
  if (display) {
    display({logo});
  }
}
export const update = (config: {
  VELOCITY_DISSIPATION: number;
  DENSITY_DISSIPATION: number;
  PRESSURE_ITERATIONS: number;
  PRESSURE_DISSIPATION: number;
}): void => {
  vorticity();

  vorticityForce();
  velocity.swap();

  divergence();

  clear({
    dissipation: config.PRESSURE_DISSIPATION,
  });
  pressure.swap();

  for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
    jacobi();
    pressure.swap();
  }

  gradientSubtract();
  velocity.swap();

  advect({
    framebuffer: velocity.write,
    x: velocity.read,
    dissipation: config.VELOCITY_DISSIPATION,
    color: [0, 0, 0, 0],
  });
  velocity.swap();

  advect({
    framebuffer: density.write,
    x: density.read,
    dissipation: config.DENSITY_DISSIPATION,
    color: [0.12, 0.2, 0.22, 1],
  });
  density.swap();
};
