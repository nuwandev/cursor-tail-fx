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
out float v_life;
out float v_flow;

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 1.8, 0.001);
    float lifeRatio = age / expectedLife;

    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    // Compute a consistent lateral (perpendicular) wave relative to motion direction
    vec2 vel = i_velocity;
    float speed = length(vel);
    vec2 forward = (speed > 0.001) ? vel / speed : vec2(1.0, 0.0);
    vec2 perp    = vec2(-forward.y, forward.x);

    // Two-frequency wave layered for organic, "not quite periodic" feel
    float phase = i_spawnTime * 0.004;
    float wave1 = sin(age * 0.007 + phase) * 18.0;
    float wave2 = sin(age * 0.013 + phase * 1.7 + 1.2) * 6.0;
    vec2  pos   = i_position + perp * (wave1 + wave2);

    // Very gentle slide along the forward axis
    pos += forward * age * 0.012;

    float flow = wave1 / 18.0; // –1..+1, used in frag for color

    // Gently breathing size
    float breathe = 0.85 + 0.15 * sin(age * 0.009 + phase);
    float size    = 16.0 * u_sizeMultiplier * breathe * (1.0 - lifeRatio * 0.4);

    float alpha = sin(lifeRatio * 3.14159) * 0.9;

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    v_flow  = flow;
    v_life  = lifeRatio;
    v_color = vec4(i_color, alpha);
    v_uv    = a_quadPos;
}
