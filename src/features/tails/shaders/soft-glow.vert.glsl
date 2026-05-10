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

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 2.0, 0.001);
    float lifeRatio = age / expectedLife;

    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    // Very slow outward drift — the "afterimage" hangs in space
    vec2 vel = i_velocity;
    float speed = length(vel);
    vec2 dir = (speed > 0.001) ? vel / speed : vec2(0.0, 1.0);
    vec2 pos = i_position + dir * (age / 3000.0) * speed * 0.3;

    // Grows very slowly from compact to wide — ultra-smooth expansion
    float expand = 1.0 + lifeRatio * 2.5;
    float size = 28.0 * u_sizeMultiplier * expand;

    // Extremely gentle fade — stays visible right until the very end
    float alpha = pow(1.0 - lifeRatio, 2.2) * 0.9;

    // Warm centre tint — full theme color at birth, whispers to near-white by death
    vec3 col = mix(i_color, vec3(1.0, 0.98, 0.96), lifeRatio * 0.4);

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    v_life  = lifeRatio;
    v_color = vec4(col, alpha);
    v_uv    = a_quadPos;
}
