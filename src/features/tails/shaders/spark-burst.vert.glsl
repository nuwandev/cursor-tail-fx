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

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier * 0.8, 0.001);
    float lifeRatio = age / expectedLife;
    
    // Time-based clustering: Force bursts only in 15ms windows every 100ms
    float cluster = mod(i_spawnTime, 100.0);
    
    // Internal randomization
    float rnd = hash(vec2(float(gl_InstanceID), 1.0));
    
    // Drop all particles outside burst windows, and thin out clusters 
    // to strictly create non-continuous, violent explosion bursts
    if (lifeRatio < 0.0 || lifeRatio >= 1.0 || cluster > 15.0 || rnd > 0.8) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }
    
    // Dramatic velocity scatter scaling for each particle
    float scatterSpeed = mix(5.0, 25.0, rnd);
    vec2 drift = i_velocity * (age / 80.0) * scatterSpeed;
    
    // Simulated gravity: positive Y is mathematically down on the canvas
    drift.y += pow(age / 100.0, 2.0) * 2.5; 
    
    vec2 pos = i_position + drift;
    
    // Rapid shrink as it burns out
    float size = 16.0 * u_sizeMultiplier * (1.0 - pow(lifeRatio, 0.4)) * mix(0.5, 1.5, rnd);
    float alpha = pow(1.0 - lifeRatio, 2.0); // sharp quadratic fade
    
    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );
    
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    
    // Flash white directly after birth
    vec3 finalColor = mix(vec3(1.0), i_color, lifeRatio * 4.0);
    v_color = vec4(finalColor, alpha);
    v_uv = a_quadPos;
}
