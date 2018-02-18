const c = document.getElementById("c");
function resize() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

export const regl = require("regl")({
    attributes: {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false
    },
    canvas: c,
    extensions: ['OES_texture_half_float', 'OES_texture_half_float_linear']
});
