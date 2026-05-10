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
out float v_pulse;

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 1.5, 0.001); // longer base length to show off pulse
    float lifeRatio = age / expectedLife;
    
    // Slightly segmented feel: deterministically drop every 4th instance to create breaks
    if (lifeRatio < 0.0 || lifeRatio >= 1.0 || (gl_InstanceID % 4) == 0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }
    
    vec2 pos = i_position;
    
    // Brightness/size wavelength based on age (animates strongly over time)
    // Offset phase by spawnTime so the wave travels down the trail
    float wave = 0.5 + 0.5 * sin((age * 0.015) - (i_spawnTime * 0.005));
    
    float size = 20.0 * u_sizeMultiplier * (0.3 + 0.7 * wave) * (1.0 - lifeRatio * 0.5);
    
    // Retain higher alpha longer
    float alpha = (1.0 - pow(lifeRatio, 2.0));
    
    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );
    
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    
    v_pulse = wave; 
    v_color = vec4(i_color, alpha);
    v_uv = a_quadPos;
}
