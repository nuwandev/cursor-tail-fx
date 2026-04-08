#version 300 es
in vec2 a_quadPos;
in vec2 i_position;
in vec2 i_velocity;
in float i_spawnTime;
in float i_lifeTime;
in vec3 i_color;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_sizeMultiplier;
uniform float u_lengthMultiplier;

out vec4 v_color;
out vec2 v_uv;
out float v_hueShift;

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier, 0.001);
    float lifeRatio = age / expectedLife;

    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    // Stationary spawn point, displaced perpendicular to cursor movement
    vec2 pos = i_position;

    // Perpendicular direction to velocity (ribbon-like curtain effect)
    vec2 velocity = i_velocity;
    float velLen = length(velocity);
    vec2 perpDir = (velLen > 0.001)
        ? normalize(vec2(-velocity.y, velocity.x))
        : vec2(0.0, 1.0);

    // Sinusoidal ripple along the ribbon — creates the aurora "curtain" wave
    float wave = sin(age * 0.008 + i_spawnTime * 0.003);
    pos += perpDir * wave * 12.0;

    // Size pulses slightly over lifetime for a shimmering feel
    float size = 18.0 * u_sizeMultiplier * (0.5 + 0.5 * sin(age * 0.006 + i_spawnTime * 0.002));

    // Smooth bell-curve alpha: peaks at mid-life, fades at birth and death
    float alpha = sin(lifeRatio * 3.14159);

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    // Hue shift increases as the particle ages — produces the colour-cycling aurora shimmer
    v_hueShift = lifeRatio * 2.8;
    v_color = vec4(i_color, alpha);
    v_uv = a_quadPos;
}
