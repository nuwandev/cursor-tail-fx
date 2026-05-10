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

    // Tight bright core — the fresh ink centre
    float core = exp(-dist * 6.0) * 2.0;

    // Wide soft halo — the ink bleeding into the medium
    float halo = exp(-dist * 1.0) * 0.4;

    float glow = core + halo;

    // Desaturate toward white as the drop ages — ink diluting effect
    vec3 finalColor = mix(v_color.rgb, vec3(1.0), v_life * 0.6);

    float a = v_color.a * u_opacityMultiplier;

    // Premultiplied alpha (ONE / ONE_MINUS_SRC_ALPHA blend)
    outColor = vec4(finalColor * glow * a, glow * a);
}
