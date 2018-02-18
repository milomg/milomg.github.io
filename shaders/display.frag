precision highp float;
precision mediump sampler2D;

varying vec2 coords;
uniform sampler2D density;

void main () {
    gl_FragColor = texture2D(density, coords);
}