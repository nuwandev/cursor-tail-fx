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
    float expectedLife = max(i_lifeTime * u_lengthMultiplier, 0.001);
    float lifeRatio = age / expectedLife;
    
    // Segmented layout along path by completely dropping modulo pieces
    if (lifeRatio < 0.0 || lifeRatio >= 1.0 || (gl_InstanceID % 5) < 2) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0); return;
    }
    
    // Rigid size stepping
    float sizeStep = floor((1.0 - lifeRatio) * 4.0) / 4.0;
    float size = 16.0 * u_sizeMultiplier * (0.2 + 0.8 * sizeStep);
    
    // Rigid alpha stepping
    float alpha = floor((1.0 - lifeRatio) * 5.0) / 5.0;
    
    vec2 finalPos = i_position + a_quadPos * size;
    vec2 clipSpace = vec2((finalPos.x / u_resolution.x) * 2.0 - 1.0, 1.0 - (finalPos.y / u_resolution.y) * 2.0);
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    
    v_color = vec4(i_color, alpha);
    v_uv = a_quadPos;
}
