#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_life;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;

    // Triple-layer glow: warm core, mid diffusion, far-field nebula bloom
    float core   = exp(-dist * 5.0) * 1.2;
    float mid    = exp(-dist * 2.2) * 0.6;
    float nebula = exp(-dist * 0.8) * 0.25;

    float glow = core + mid + nebula;

    // Core brightens to near-white; outer edge stays fully colored
    vec3 warmCore = mix(v_color.rgb, vec3(1.0, 0.97, 0.93), (1.0 - dist) * 0.55);

    float a = v_color.a * u_opacityMultiplier;
    outColor = vec4(warmCore * glow * a, glow * a);
}
