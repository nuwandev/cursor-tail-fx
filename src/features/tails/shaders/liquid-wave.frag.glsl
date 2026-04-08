#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_life;
in float v_flow;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;

    // Thick, dense liquid body with a strong centre mass
    float body = smoothstep(1.0, 0.0, dist);
    body = pow(body, 1.2);

    // Bright specular highlight — simulates light reflecting off liquid surface
    float specular = exp(-pow(dist - 0.18, 2.0) * 40.0) * 1.8;

    // Soft iridescent edge — slight color shift toward complementary on rim
    float rim = exp(-abs(dist - 0.82) * 10.0) * 0.6;

    float glow = body + specular + rim;

    // Iridescent color: tip toward blue-shifted complement on one side of wave
    vec3 iridescentShift = vec3(-v_color.b * 0.3, v_color.r * 0.2, v_color.g * 0.3);
    vec3 col = mix(v_color.rgb, v_color.rgb + iridescentShift * v_flow, rim * 0.8);
    // Specular is near-white
    col = mix(col, vec3(1.0, 0.98, 0.97), specular * 0.5);

    float a = v_color.a * u_opacityMultiplier;
    outColor = vec4(col * glow * a, glow * a);
}
