#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    // Generate a perfect hard square out of the particle instead of a circle
    float mx = max(abs(v_uv.x), abs(v_uv.y));
    if (mx > 1.0) discard;
    
    outColor = vec4(v_color.rgb * v_color.a * u_opacityMultiplier, v_color.a * u_opacityMultiplier);
}
