precision highp float;
precision mediump sampler2D;

varying vec2 coords; // grid coordinates    
uniform sampler2D velocity;
uniform vec2 texelSize;

void main() {
  float L = texture2D(velocity, coords - vec2(texelSize.x, 0.0)).y;
  float R = texture2D(velocity, coords + vec2(texelSize.x, 0.0)).y;
  float B = texture2D(velocity, coords - vec2(0.0, texelSize.y)).x;
  float T = texture2D(velocity, coords + vec2(0.0, texelSize.y)).x;

  gl_FragColor = vec4(0.5*((R - L) - (T - B)),0.0,0.0,1.0);
} 
