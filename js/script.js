import "zenscroll";
import fontawesome from "@fortawesome/fontawesome";
import { faChevronDown } from "@fortawesome/fontawesome-free-solid"

fontawesome.library.add(faChevronDown);

import { regl } from "./canvas";
import * as config from "./config";
import { fullscreen, update, display, letterM, createSplat } from "./shaders";

regl.frame(() => {
	fullscreen(() => {
		letterM();
		if (pointer.moved) {
			createSplat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color, config.SPLAT_RADIUS);
			pointer.moved = false;
		}
		update(config);	  
		display();
	});
});

let pointer = {
	x: 0,
	y: 0,
	dx: 0,
	dy: 0,
	moved: false,
	color: [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2]
};
document.addEventListener("mousemove", (e) => {
	pointer.moved = true;
	pointer.dx = (e.clientX - pointer.x) * 10;
	pointer.dy = (e.clientY - pointer.y) * 10;
	pointer.x = e.clientX;
	pointer.y = e.clientY;
});
document.addEventListener("mousedown", () => {
	pointer.color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
});
