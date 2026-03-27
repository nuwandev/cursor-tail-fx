import { BaseTail } from "./BaseTail";

export class RainbowTail extends BaseTail {
    protected getVertexShader(): string {
        return `#version 300 es
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
out float v_age;

void main() {
    float age = u_time - i_spawnTime;
    float expectedLife = max(i_lifeTime * u_lengthMultiplier, 0.001);
    float lifeRatio = age / expectedLife;
    
    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }
    
    // Completely solid line, no velocity scatter
    vec2 pos = i_position; 
    float size = 15.0 * u_sizeMultiplier * (1.0 - lifeRatio);
    float alpha = 1.0 - lifeRatio;
    
    vec2 finalPos = pos + a_quadPos * size;
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );
    
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    v_color = vec4(i_color, alpha);
    v_uv = a_quadPos;
    v_age = age;
}
`;
    }

    protected getFragmentShader(): string {
        return `#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_age;

uniform float u_opacityMultiplier;
uniform float u_time;

out vec4 outColor;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;
    
    float glow = exp(-dist * 3.0); 
    
    // Rainbow shifts hue over time and particle age
    float hue = fract(u_time * 0.0002 + v_age * 0.001);
    vec3 rgb = hsv2rgb(vec3(hue, 1.0, 1.0));

    outColor = vec4(rgb * v_color.a * glow * u_opacityMultiplier, v_color.a * glow * u_opacityMultiplier);
}
`;
    }
}
