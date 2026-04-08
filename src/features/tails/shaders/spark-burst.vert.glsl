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
out float v_heat;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 0.6, 0.001);
    float lifeRatio = age / expectedLife;

    float id = float(gl_InstanceID);
    float rnd = hash(vec2(id, i_spawnTime));

    // Keep only 60% of particles, creating naturalistic density variation
    if (lifeRatio < 0.0 || lifeRatio >= 1.0 || rnd > 0.6) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    // Per-particle randomised launch angle — full 360° scatter
    float launchAngle = rnd * 6.28318;
    float launchSpeed = mix(3.0, 22.0, hash(vec2(id + 1.0, 0.7)));
    vec2 launchDir    = vec2(cos(launchAngle), sin(launchAngle));

    // Bias toward existing cursor velocity direction (sparks go where you're moving)
    float speed = length(i_velocity);
    vec2  bias  = (speed > 0.001) ? normalize(i_velocity) * 0.5 : vec2(0.0);
    launchDir   = normalize(launchDir + bias);

    // Gravity arc — Y increases downward on canvas
    float t   = age / 100.0;
    vec2 drift = launchDir * launchSpeed * t;
    drift.y   += t * t * 3.5;

    vec2 pos   = i_position + drift;

    // Shrink rapidly as it burns out
    float heat = pow(1.0 - lifeRatio, 2.0);
    float size = mix(2.0, 10.0, hash(vec2(id, 2.1))) * u_sizeMultiplier * heat;
    float alpha = heat * 0.95;

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    // Ember color: white → yellow → orange → theme color as it cools
    vec3 hotColor  = vec3(1.0, 0.95, 0.7);
    vec3 coolColor = i_color;
    vec3 col = mix(coolColor, hotColor, heat * heat);

    v_heat  = heat;
    v_color = vec4(col, alpha);
    v_uv    = a_quadPos;
}
