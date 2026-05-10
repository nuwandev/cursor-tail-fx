#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_pulse;

uniform float u_opacityMultiplier;

out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;
    
    // Intense core and rim interaction driven by the traveling wave pulse
    float core = exp(-dist * 5.0) * mix(0.5, 2.5, v_pulse);
    float rim = exp(-abs(dist - 0.7) * 8.0) * mix(0.2, 2.0, v_pulse);
    
    float glow = core + rim;
    
    // Secondary color split (blue/green channel shift) that emerges further from center
    vec3 secondaryColor = mix(vec3(1.0), v_color.bgr, dist);
    vec3 finalRgb = mix(secondaryColor, v_color.rgb, core);
    
    outColor = vec4(finalRgb * v_color.a * glow * u_opacityMultiplier, v_color.a * glow * u_opacityMultiplier);
}
