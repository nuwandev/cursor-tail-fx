#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
flat in int v_id;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;
    
    // Rotate the entire particle locally based on instance ID mathematically
    float angle = float(v_id) * 0.5;
    float c = cos(angle), s = sin(angle);
    vec2 rv = vec2(
        v_uv.x * c - v_uv.y * s,
        v_uv.x * s + v_uv.y * c
    );
    
    // Geometric shape building
    float ring = smoothstep(0.4, 0.5, dist) - smoothstep(0.6, 0.7, dist);
    float crossOut = step(abs(rv.x), 0.15) + step(abs(rv.y), 0.15);
    
    // Boolean merge ring + cross segment logic
    float mask = clamp(ring + crossOut * step(dist, 0.8), 0.0, 1.0);
    if (mask <= 0.0) discard;
    
    outColor = vec4(v_color.rgb * v_color.a * u_opacityMultiplier * mask, v_color.a * u_opacityMultiplier * mask);
}
