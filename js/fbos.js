import { regl } from "./canvas";
import * as config from "./config";

function doubleFbo(filter) {
	let fbos = [createFbo(filter), createFbo(filter)];
	return {
		get read() {
			return fbos[0];
		},
		get write() {
			return fbos[1];
		},
		swap() {
			fbos.reverse();
		}
	};
}

function createFbo(filter) {
	let tex = regl.texture({
		width: window.innerWidth >> config.TEXTURE_DOWNSAMPLE,
		height: window.innerHeight >> config.TEXTURE_DOWNSAMPLE,
		min: filter,
		mag: filter,
		type: "half float"
	});
	window.addEventListener("resize", () => {
		tex.resize(
			window.innerWidth >> config.TEXTURE_DOWNSAMPLE,
			window.innerHeight >> config.TEXTURE_DOWNSAMPLE
		);
	});
	return regl.framebuffer({
		color: tex,
		depthStencil: false
	});
}

export const velocity = doubleFbo("linear");
export const density = doubleFbo("linear");
export const pressure = doubleFbo("nearest");
export const divergenceTex = createFbo("nearest");
