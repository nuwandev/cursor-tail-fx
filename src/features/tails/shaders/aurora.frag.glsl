#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_hueShift;

uniform float u_opacityMultiplier;

out vec4 outColor;

// --- Inline RGB ↔ HSV conversion for hue rotation ---

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),  vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;

    // Hue-rotate the particle color — produces the shifting aurora spectrum
    vec3 hsv = rgb2hsv(v_color.rgb);
    hsv.x = fract(hsv.x + v_hueShift / 6.28318); // normalise radian shift to [0,1]
    vec3 shiftedRgb = hsv2rgb(hsv);

    // Soft radial glow (wide falloff to keep aurora look diffuse, not sharp)
    float glow = exp(-dist * 2.0);

    float a = v_color.a * glow * u_opacityMultiplier;

    // Premultiplied alpha output (matches blendFunc ONE / ONE_MINUS_SRC_ALPHA)
    outColor = vec4(shiftedRgb * a, a);
}
