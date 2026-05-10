#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_twinkle;
in float v_life;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;

    // 4-pointed star shape: min of two "diamond" distances at 0° and 45°
    vec2 uv45 = vec2(v_uv.x + v_uv.y, v_uv.x - v_uv.y) * 0.7071;
    float star = min(max(abs(v_uv.x), abs(v_uv.y)),
                     max(abs(uv45.x),  abs(uv45.y)));

    // Glow layers: needle-sharp cross arms + wide radial halo
    float arms = exp(-star  * 8.0) * 2.5;
    float halo = exp(-dist  * 3.0) * 0.6;
    float glow = arms + halo;

    // White-hot core when twinkle peaks, colored otherwise
    vec3 col = mix(v_color.rgb, vec3(1.0, 1.0, 0.92), (1.0 - dist) * v_twinkle * 0.5);

    float a = v_color.a * u_opacityMultiplier;
    outColor = vec4(col * glow * a, glow * a);
}
