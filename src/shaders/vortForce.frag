precision highp float;
precision mediump sampler2D;

varying vec2 coords; // grid coordinates    
uniform sampler2D vorticity;
uniform sampler2D velocity;
uniform vec2 texelSize;
uniform float timestep;
uniform float curl;

const float EPSILON = 2.4414e-4; // 2^-12

void main() {
  float L = texture2D(vorticity, coords - vec2(texelSize.x, 0.0)).y;
  float R = texture2D(vorticity, coords + vec2(texelSize.x, 0.0)).y;
  float B = texture2D(vorticity, coords - vec2(0.0, texelSize.y)).x;
  float T = texture2D(vorticity, coords + vec2(0.0, texelSize.y)).x;

  float vC = texture2D(vorticity, coords).r;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(L) - abs(R));
  force *= curl * vC / max(length(force), EPSILON);

  vec2 vel = texture2D(velocity, coords).xy;
  gl_FragColor = vec4(vel + timestep * force, 0.0, 1.0);
}
