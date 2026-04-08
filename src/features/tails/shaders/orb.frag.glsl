#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_life;
in float v_pulse;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;

    // Volumetric core — bright inner sphere
    float core = exp(-dist * 4.0) * 1.8;

    // Chromatic rim ring that brightens with pulse — the orb "edge"
    float rim = exp(-abs(dist - 0.72) * 12.0) * v_pulse * 1.4;

    // Outer atmospheric haze
    float haze = exp(-dist * 1.4) * 0.35;

    float glow = core + rim + haze;

    // Core is near-white, rim picks up the theme color, haze is softer
    vec3 coreColor  = mix(v_color.rgb, vec3(1.0), (1.0 - dist) * 0.5);
    vec3 rimColor   = mix(v_color.rgb, v_color.bgr, v_pulse * 0.3); // slight chromatic shift on pulse
    vec3 finalColor = mix(rimColor, coreColor, exp(-dist * 5.0));

    float a = v_color.a * u_opacityMultiplier;
    outColor = vec4(finalColor * glow * a, glow * a);
}
