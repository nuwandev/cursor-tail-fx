#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_rotation;
in float v_life;

uniform float u_opacityMultiplier;
out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;

    // Rotate local UV by per-rune spin angle
    float c = cos(v_rotation);
    float s = sin(v_rotation);
    vec2 ruv = vec2(c * v_uv.x - s * v_uv.y,
                    s * v_uv.x + c * v_uv.y);

    // --- Rune geometry ---
    // Outer circle ring
    float outerRing = smoothstep(0.05, 0.0, abs(dist - 0.80));

    // Inner diamond / rhombus
    float diamond = max(abs(ruv.x), abs(ruv.y));
    float innerDiamond = smoothstep(0.05, 0.0, abs(diamond - 0.42));

    // Cross spokes (axis-aligned)
    float spokeW = 0.07;
    float spokes = max(
        smoothstep(spokeW, 0.0, abs(ruv.x)) * step(dist, 0.78),
        smoothstep(spokeW, 0.0, abs(ruv.y)) * step(dist, 0.78)
    );

    // Diagonal spokes (45°)
    vec2 ruv45 = vec2(ruv.x + ruv.y, ruv.x - ruv.y) * 0.7071;
    float diagSpokes = max(
        smoothstep(spokeW, 0.0, abs(ruv45.x)) * step(dist, 0.60),
        smoothstep(spokeW, 0.0, abs(ruv45.y)) * step(dist, 0.60)
    );

    float mask = clamp(outerRing + innerDiamond + spokes + diagSpokes, 0.0, 1.0);
    if (mask <= 0.01) discard;

    // Glow bleeding — softly lit beyond the hard lines
    float glow = exp(-dist * 2.5) * 0.3;

    // Core symbols are bright; glow adds a magical aura
    vec3 col = mix(v_color.rgb, vec3(1.0, 0.9, 1.0), mask * 0.25);

    float a = v_color.a * u_opacityMultiplier;
    outColor = vec4(col * (mask + glow) * a, (mask + glow) * a);
}
