import { regl } from "./canvas";
import { TEXTURE_DOWNSAMPLE } from "./config";
import { velocity, density, pressure, divergenceTex } from "./fbos";

const texelSize = ({ viewportWidth, viewportHeight }) => [
	1 / viewportWidth,
	1 / viewportHeight
];
const viewport = ({ viewportWidth, viewportHeight }) => ({
	x: 0,
	y: 0,
	width: viewportWidth >> TEXTURE_DOWNSAMPLE,
	height: viewportHeight >> TEXTURE_DOWNSAMPLE
});

export const fullscreen = regl({
	vert: require("../shaders/project.vert"),
	attributes: {
		points: [1, 1, 1, -1, -1, -1, 1, 1, -1, -1, -1, 1]
	},
	count: 6
});

const splat = regl({
	frag: require("../shaders/splat.frag"),
	framebuffer: regl.prop("framebuffer"),
	uniforms: {
		uTarget: regl.prop("uTarget"),
		aspectRatio: ({ viewportWidth, viewportHeight }) =>
			viewportWidth / viewportHeight,
		point: regl.prop("point"),
		color: regl.prop("color"),
		radius: regl.prop("radius")
	},
	viewport
});

const img = new Image();
img.src = require("../images/logo.png");
let logo;
img.onload = () =>
	(logo = regl({
		frag: require("../shaders/logo.frag"),
		framebuffer: () => density.write,
		uniforms: {
			density: () => density.read,
			image: regl.texture(img),
			ratio: ({ viewportWidth, viewportHeight }) => {
				return viewportWidth > viewportHeight
					? [viewportWidth / viewportHeight, 1.0]
					: [1.0, viewportHeight / viewportWidth];
			},
			dissipation: regl.prop("dissipation")
		},
		viewport
	}));

const advect = regl({
	frag: require("../shaders/advect.frag"),
	framebuffer: regl.prop("framebuffer"),
	uniforms: {
		timestep: 0.017,
		dissipation: regl.prop("dissipation"),
		color: regl.prop("color"),
		x: regl.prop("x"),
		velocity: () => velocity.read,
		texelSize
	},
	viewport
});
const divergence = regl({
	frag: require("../shaders/divergence.frag"),
	framebuffer: divergenceTex,
	uniforms: {
		velocity: () => velocity.read,
		texelSize
	},
	viewport
});
const clear = regl({
	frag: require("../shaders/clear.frag"),
	framebuffer: () => pressure.write,
	uniforms: {
		pressure: () => pressure.read,
		dissipation: regl.prop("dissipation")
	},
	viewport
});
const gradientSubtract = regl({
	frag: require("../shaders/gradientSubtract.frag"),
	framebuffer: () => velocity.write,
	uniforms: {
		pressure: () => pressure.read,
		velocity: () => velocity.read,
		texelSize
	},
	viewport
});
const jacobi = regl({
	frag: require("../shaders/jacobi.frag"),
	framebuffer: () => pressure.write,
	uniforms: {
		pressure: () => pressure.read,
		divergence: () => divergenceTex,
		texelSize
	},
	viewport
});
export const display = regl({
	frag: require("../shaders/display.frag"),
	uniforms: {
		density: () => density.read
	}
});

export function createSplat(x, y, dx, dy, color, radius) {
	splat({
		framebuffer: velocity.write,
		uTarget: velocity.read,
		point: [x / window.innerWidth, 1 - y / window.innerHeight],
		radius,
		color: [dx, -dy, 1]
	});
	velocity.swap();

	splat({
		framebuffer: density.write,
		uTarget: density.read,
		point: [x / window.innerWidth, 1 - y / window.innerHeight],
		radius,
		color
	});
	density.swap();
}
export function drawLogo(dissipation) {
	if (logo) {
		logo({ dissipation });
		density.swap();
	}
}
export const update = config => {
	advect({
		framebuffer: velocity.write,
		x: velocity.read,
		dissipation: config.VELOCITY_DISSIPATION,
		color: [0, 0, 0, 0]
	});
	velocity.swap();

	advect({
		framebuffer: density.write,
		x: density.read,
		dissipation: config.DENSITY_DISSIPATION,
		color: [0.12, 0.2, 0.22, 1]
	});
	density.swap();

	divergence();

	clear({
		dissipation: config.PRESSURE_DISSIPATION
	});
	pressure.swap();

	for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
		jacobi();
		pressure.swap();
	}

	gradientSubtract();
	velocity.swap();
};
