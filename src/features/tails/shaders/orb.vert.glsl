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
out float v_pulse;

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 1.8, 0.001);
    float lifeRatio = age / expectedLife;

    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    // Gentle inertial drift that naturally slows — like a ball rolling to a stop
    vec2 vel = i_velocity;
    float speed = length(vel);
    vec2 dir = (speed > 0.001) ? vel / speed : vec2(0.0, 1.0);
    vec2 pos = i_position + dir * speed * (age / 1000.0) * (1.0 - lifeRatio * 0.8);

    // Breathes: starts compact, swells to full size by mid-life, then shrinks
    float breathe = sin(lifeRatio * 3.14159);
    float size = 22.0 * u_sizeMultiplier * (0.4 + 0.6 * breathe);

    // Dual-frequency heartbeat pulse
    float pulse = 0.5 + 0.3 * sin(age * 0.012) + 0.2 * sin(age * 0.031 + 1.0);

    // Long, smooth fade — almost never fully transparent until the very end
    float alpha = pow(1.0 - lifeRatio, 0.8) * (0.7 + 0.3 * pulse);

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    v_pulse  = pulse;
    v_life   = lifeRatio;
    v_color  = vec4(i_color, alpha);
    v_uv     = a_quadPos;
}
