precision highp float;
precision mediump sampler2D;

varying vec2 coords;
uniform vec2 texelSize;
uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D image;

void main() {
    vec2 velOffset = 0.1 * texture2D(velocity, coords).xy * texelSize;
    vec2 pos = (vec2(-24.0,-24.0) + vec2(coords.x, 1.0 - coords.y) / texelSize) / 80.0;
    vec4 logo = texture2D(image, pos+velOffset);
    gl_FragColor = vec4(texture2D(density, coords).rgb * (1.0 - logo.a) + logo.rgb * logo.a, 1.0);
}
