import { BaseTail } from "./BaseTail";

export class CometTail extends BaseTail {
  public getShaders() {
    return {
      vertex: `#version 300 es
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
}
`,
      fragment: `#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;

uniform float u_opacityMultiplier;

out vec4 outColor;

void main() {
    float dist = length(v_uv);
    if (dist > 1.0) discard;
    
    float glow = exp(-dist * 3.0); 
    outColor = vec4(v_color.rgb * v_color.a * glow * u_opacityMultiplier, v_color.a * glow * u_opacityMultiplier);
}
`,
    };
  }

  public updateEffect(_dt: number): void {
    // CometTail-specific per-frame logic (if any)
  }
}
