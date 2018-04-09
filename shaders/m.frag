precision mediump float;
precision mediump sampler2D;

varying vec2 coords;
uniform sampler2D density;

float drawLine(vec2 p1, vec2 p2) {
  vec2 uv = coords;

  float a = distance(p1, uv);
  float b = distance(p2, uv);
  float c = distance(p1, p2);

  if (a >= c || b >= c) return 0.0;

  float p = (a + b + c) * 0.5;

  float h = 2.0 / c * p * (p - a) * (p - b) * (p - c);

  return exp(-h * 1000000.0);
}

void main(void) {
  vec3 splat = (drawLine(vec2(0.3, 0.8), vec2(0.3, 0.2)) +
    drawLine(vec2(0.7, 0.8), vec2(0.7, 0.2)) +
    drawLine(vec2(0.3, 0.8), vec2(0.5, 0.5)) +
    drawLine(vec2(0.5, 0.5), vec2(0.7, 0.8))) * vec3(0.1, 0.1, 0.6);
  vec3 base = texture2D(density, coords).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}