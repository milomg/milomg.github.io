precision highp float;
precision mediump sampler2D;

varying vec2 coords;
uniform float timestep;
uniform float dissipation;
uniform vec2 texelSize;      // 1 / grid scale 
uniform sampler2D velocity;  // input velocity
uniform sampler2D x;         // quantity to advect

void main() {
   vec2 pos = coords - timestep * texelSize * texture2D(velocity, coords).xy;

  gl_FragColor = dissipation * texture2D(x, pos);
}