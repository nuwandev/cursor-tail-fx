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

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 1.5, 0.001);
    float lifeRatio = age / expectedLife;
    
    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0); return;
    }
    
    // Slow outward drift
    vec2 pos = i_position + i_velocity * (age / 1500.0);
    
    // Expands outwards broadly over its life
    float size = 25.0 * u_sizeMultiplier * (1.0 + lifeRatio * 1.5);
    
    // Smooth ease-out beta
    float alpha = pow(1.0 - lifeRatio, 1.5);
    
    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2((finalPos.x / u_resolution.x) * 2.0 - 1.0, 1.0 - (finalPos.y / u_resolution.y) * 2.0);
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    
    // Warm, desaturated color
    vec3 col = mix(i_color, vec3(0.5), 0.3);
    v_color = vec4(col, alpha);
    v_uv = a_quadPos;
}
