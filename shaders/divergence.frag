precision highp float;
precision mediump sampler2D;

varying vec2 coords;        // grid coordinates
uniform vec2 texelSize;
uniform sampler2D velocity; // vector field

vec2 sampleVelocity(in vec2 uv) {
    vec2 mult = vec2(1.0, 1.0);
    if (uv.x < 0.0 || uv.x > 1.0) { mult.x = -1.0; }
    if (uv.y < 0.0 || uv.y > 1.0) { mult.y = -1.0; }
    return mult * texture2D(velocity, clamp(uv, 0.0, 1.0)).xy;
}

void main() {
  float L = sampleVelocity(coords - vec2(texelSize.x, 0.0)).x;
  float R = sampleVelocity(coords + vec2(texelSize.x, 0.0)).x;
  float T = sampleVelocity(coords + vec2(0.0, texelSize.y)).y;
  float B = sampleVelocity(coords - vec2(0.0, texelSize.y)).y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}