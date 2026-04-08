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
out float v_rotation;
out float v_life;

float hash(float n) { return fract(sin(n) * 43758.5453); }

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 1.4, 0.001);
    float lifeRatio = age / expectedLife;

    float id = float(gl_InstanceID);

    // Only 1 in 6 particles becomes a rune — they should feel rare and precious
    if (lifeRatio < 0.0 || lifeRatio >= 1.0 || mod(id, 6.0) != 0.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    float rnd = hash(id * 1.618);

    // Rune floats upward (opposite gravity) with a gentle side drift
    // — magical sigils should rise, not fall
    float rise  = age * (0.02 + rnd * 0.015);
    float sway  = sin(age * 0.004 + rnd * 6.28) * 8.0;
    vec2  pos   = i_position + vec2(sway, -rise);

    // Unique constant spin per rune (some slow, some fast, some reverse)
    float spinDir  = (rnd > 0.5) ? 1.0 : -1.0;
    float spinRate = (0.003 + rnd * 0.006) * spinDir;
    float rotation = age * spinRate + rnd * 6.28318;

    // Materialises instantly, then fades out in the last 30% of life
    float fadeIn  = min(age / 80.0, 1.0);
    float fadeOut = 1.0 - smoothstep(0.7, 1.0, lifeRatio);
    float alpha   = fadeIn * fadeOut * (0.7 + 0.3 * sin(age * 0.008));

    float size = 20.0 * u_sizeMultiplier * (0.8 + 0.2 * sin(age * 0.005)) * fadeOut;

    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    // Shift color slightly per rune — makes them feel like different sigils
    vec3 col = mix(i_color, i_color.brg, rnd * 0.35);

    v_rotation = rotation;
    v_life     = lifeRatio;
    v_color    = vec4(col, alpha);
    v_uv       = a_quadPos;
}
