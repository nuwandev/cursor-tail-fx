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
out float v_twinkle;
out float v_life;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 1.2, 0.001);
    float lifeRatio = age / expectedLife;

    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    float id = float(gl_InstanceID);

    // Each particle gets a unique random phase and orbit radius
    float phase  = hash(id * 1.3)  * 6.28318;
    float radius = hash(id * 2.7)  * 18.0 * (1.0 - lifeRatio);
    float speed  = hash(id * 4.1)  * 0.008 + 0.002;

    // Spiral outward from spawn point, slowing as it fades
    float angle  = phase + age * speed;
    vec2  drift  = vec2(cos(angle), sin(angle)) * radius;
    vec2  pos    = i_position + drift;

    // Rapid high-frequency shimmer per particle (unique frequency per id)
    float twinkleFreq = 0.04 + hash(id * 5.9) * 0.06;
    float twinkle = 0.5 + 0.5 * sin(age * twinkleFreq + phase);

    float size  = (5.0 + hash(id * 3.3) * 8.0) * u_sizeMultiplier * twinkle * (1.0 - lifeRatio * 0.6);
    float alpha = pow(1.0 - lifeRatio, 1.2) * twinkle;

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    // Hot-white flash on birth, transitions to theme color
    vec3 col = mix(vec3(1.0, 1.0, 0.95), i_color, min(lifeRatio * 3.0, 1.0));
    v_color   = vec4(col, alpha);
    v_uv      = a_quadPos;
    v_twinkle = twinkle;
    v_life    = lifeRatio;
}
