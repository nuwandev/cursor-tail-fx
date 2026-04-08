#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;
    
    // Dense soft core volume visually mimicking thick liquid dynamics
    float glow = smoothstep(1.0, 0.0, dist);
    glow = pow(glow, 1.5);
    
    outColor = vec4(v_color.rgb * v_color.a * glow * u_opacityMultiplier, v_color.a * glow * u_opacityMultiplier);
}
