precision highp float;
precision mediump sampler2D;

varying vec2 coords;
uniform bool logo;
uniform vec2 ratio;
uniform vec2 texelSize;
uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D image;

void main() {
    vec2 velOffset = 0.1 * texture2D(velocity, coords).xy * texelSize;
    vec2 pos = vec2(coords.x - 0.5, 0.5 - coords.y) * ratio * 2.0 + vec2(0.5, 0.5);
    vec4 base2 = texture2D(image, pos+velOffset);
    if (!logo) base2.a = 0.0;
    gl_FragColor = vec4(texture2D(density, coords).rgb * (1.0 - base2.a) + base2.rgb * base2.a, 1.0);
}
