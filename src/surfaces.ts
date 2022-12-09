import REGL from "regl";

const c = document.getElementById("c") as HTMLCanvasElement;
function resize() {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

export const regl = REGL({
  attributes: {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
  },
  canvas: c,
  extensions: ["OES_texture_half_float", "OES_texture_half_float_linear"],
});

export const TEXTURE_DOWNSAMPLE = 3;

type Config = {
  filter: REGL.TextureMagFilterType;
  downsample?: number;
};
function doubleFbo(config: Config) {
  const fbos = [createFbo(config), createFbo(config)];
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

function createFbo({ filter, downsample = TEXTURE_DOWNSAMPLE }: Config) {
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
    colorType: "half float",
  });
  window.addEventListener("resize", () => {
    tex.resize(window.innerWidth >> downsample, window.innerHeight >> downsample);
    framebuffer.resize(window.innerWidth >> downsample, window.innerHeight >> downsample);
  });
  return framebuffer;
}

export const density = doubleFbo({ filter: "linear", downsample: 0 });
export const velocity = doubleFbo({ filter: "linear" });
export const pressure = doubleFbo({ filter: "nearest" });
export const divergenceTex = createFbo({ filter: "nearest" });
