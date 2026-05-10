#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_heat;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;

    // Elongated needle shape along x — sparks are little streaks, not circles
    // We use the uv directly: compress x axis to make horizontal needle
    float needle = length(vec2(v_uv.x * 0.35, v_uv.y));
    if (needle > 1.0) discard;

    // Overbright burning core
    float core = exp(-needle * 9.0) * 3.0;

    // Soft outer halo
    float halo = exp(-dist * 3.5) * 0.5;

    float glow = core + halo;

    // Near-black rim when cool, white-gold when hot
    vec3 finalColor = mix(v_color.rgb * 0.6, vec3(1.0, 0.92, 0.5), v_heat * v_heat);

    float a = v_color.a * u_opacityMultiplier;
    outColor = vec4(finalColor * glow * a, glow * a);
}
