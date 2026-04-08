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
flat out int v_id;

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 1.2, 0.001);
    float lifeRatio = age / expectedLife;
    
    // Sparse spawning: Only drop rare runes (1 in 10 particles)
    if (lifeRatio < 0.0 || lifeRatio >= 1.0 || (gl_InstanceID % 10) != 0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0); return;
    }
    
    // Magical swirling outward orbit drift
    float angle = age * 0.005 + float(gl_InstanceID);
    vec2 swirl = vec2(cos(angle), sin(angle)) * (age / 30.0);
    vec2 pos = i_position + swirl + i_velocity * (age / 2000.0);
    
    float size = 18.0 * u_sizeMultiplier * (1.1 - lifeRatio);
    // Smooth pulsing alpha over its life
    float alpha = (1.0 - lifeRatio) * (0.6 + 0.4 * sin(age * 0.01));
    
    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2((finalPos.x / u_resolution.x) * 2.0 - 1.0, 1.0 - (finalPos.y / u_resolution.y) * 2.0);
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    
    v_color = vec4(i_color, alpha);
    v_uv = a_quadPos;
    v_id = gl_InstanceID;
}
