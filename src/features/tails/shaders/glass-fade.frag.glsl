#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;
    
    // Hollow out the core and keep only a highly specific edge rim
    float rim = smoothstep(0.85, 0.95, dist) - smoothstep(0.95, 1.0, dist);
    
    // Leave a bare whisper of tint inside
    float interior = (1.0 - smoothstep(0.0, 0.85, dist)) * 0.1;
    
    float mask = rim + interior;
    
    // Reflective neutrality shift
    vec3 glassColor = mix(vec3(1.0), v_color.rgb, 0.3);
    
    outColor = vec4(glassColor * v_color.a * mask * u_opacityMultiplier, v_color.a * mask * u_opacityMultiplier);
}
