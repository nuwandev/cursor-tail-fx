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
    float expectedLife = max(i_lifeTime * u_lengthMultiplier, 0.001);
    float lifeRatio = age / expectedLife;

    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    // Slow directional push in the direction of spawn velocity
    vec2 velocity = i_velocity;
    float velLen = length(velocity);
    vec2 dir = (velLen > 0.001) ? normalize(velocity) : vec2(0.0, 1.0);
    vec2 pos = i_position + dir * age * 0.03;

    // Blooms fast then stays large — pow(lifeRatio, 0.3) rises steeply near 0
    float size = 12.0 * u_sizeMultiplier * pow(lifeRatio, 0.3);

    // Fades out with a gentle curve, plateaus slightly above zero early on
    float alpha = pow(1.0 - lifeRatio, 1.5) * 0.9;

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    v_life  = lifeRatio;
    v_color = vec4(i_color, alpha);
    v_uv    = a_quadPos;
}
