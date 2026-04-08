#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;

uniform float u_opacityMultiplier;

out vec4 outColor;

void main() {
    float dist = length(v_uv);
    
    // Razor sharp edge: no blur, no exp() falloff. Absolute circle cutoff.
    if (dist > 1.0) discard;
    
    // Crisp pixel mask via step, completely distinct from circular glow
    float glow = step(dist, 0.95);
    if (glow <= 0.0) discard;
    
    outColor = vec4(v_color.rgb * v_color.a * u_opacityMultiplier, v_color.a * u_opacityMultiplier);
}
