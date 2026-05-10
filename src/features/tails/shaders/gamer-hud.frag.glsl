#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float mx = abs(v_uv.x);
    float my = abs(v_uv.y);
    
    if (mx > 1.0 || my > 1.0) discard;
    
    // Digital bracket logic: Render only the outer edges and only off-center segments
    float edgeThickness = 0.2;
    bool isCorner = (mx > 1.0 - edgeThickness || my > 1.0 - edgeThickness) && (mx > 0.4 && my > 0.4);
    
    if (!isCorner) discard;
    
    outColor = vec4(v_color.rgb * v_color.a * u_opacityMultiplier, v_color.a * u_opacityMultiplier);
}
