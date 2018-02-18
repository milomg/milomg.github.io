import '../css/main.css'
import fontawesome from '@fortawesome/fontawesome';
import solid from '@fortawesome/fontawesome-free-solid'

fontawesome.library.add(solid.faArrowDown);

import { regl } from './canvas';
import * as config from './config';
import { fullscreen, update, display, createSplat } from './shaders';

function letterM() {
	const color = [0.1, 0.1, 0.6];

	for (let i = 0.8; i > 0.2; i -= 0.05) {
		createSplat(0.3 * window.innerWidth, i * window.innerHeight, 0, 0, color, config.SPLAT_RADIUS);
		createSplat(0.7 * window.innerWidth, i * window.innerHeight, 0, 0, color, config.SPLAT_RADIUS);
	}

	for (let i = -0.1; i <= 0.1; i += 0.0125) {
		createSplat((i + 0.4) * window.innerWidth, (i * 2 + 0.4) * window.innerHeight, 0, 0, color, config.SPLAT_RADIUS);
		createSplat((i + 0.6) * window.innerWidth, (-i * 2 + 0.4) * window.innerHeight, 0, 0, color, config.SPLAT_RADIUS);
	}
}

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
document.addEventListener('mousedown', () => {
	pointer.color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
});
