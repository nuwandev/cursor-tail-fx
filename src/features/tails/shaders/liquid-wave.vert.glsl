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
    
    // Perpendicular oscillation using global positional noise offsets
    // meaning the whole line undulates simultaneously like a fluid ribbon.
    float waveX = sin(i_position.y * 0.02 + age * 0.005) * 15.0 * lifeRatio;
    float waveY = cos(i_position.x * 0.02 + age * 0.005) * 15.0 * lifeRatio;
    
    vec2 pos = i_position + vec2(waveX, waveY);
    
    float size = 14.0 * u_sizeMultiplier * (1.0 - lifeRatio * 0.5);
    
    // Breathe naturally
    float alpha = sin(lifeRatio * 3.1415);
    
    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2((finalPos.x / u_resolution.x) * 2.0 - 1.0, 1.0 - (finalPos.y / u_resolution.y) * 2.0);
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    
    v_color = vec4(i_color, alpha * 0.8);
    v_uv = a_quadPos;
}
