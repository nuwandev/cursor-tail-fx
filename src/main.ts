import { listen } from "@tauri-apps/api/event";
import { AppConfig, DEFAULT_CONFIG, THEMES, EFFECTS } from "./config";

const VS_SRC = `#version 300 es
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
uniform int u_effect;

out vec4 v_color;
out vec2 v_uv;
out float v_age;
flat out int v_effect;

void main() {
    float age = u_time - i_spawnTime;
    float lifeRatio = age / (i_lifeTime * u_lengthMultiplier);
    
    if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
        // Hide dead particles
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }
    
    vec2 pos = i_position + i_velocity * (age / 1000.0);
    
    float size = 15.0 * u_sizeMultiplier;
    float alpha = 1.0 - lifeRatio;

    // Apply Effect Modifiers
    if (u_effect == 0) { // Comet
        size *= (1.0 - lifeRatio);
    } else if (u_effect == 1) { // Sparkle
        size *= (0.5 + 0.5 * sin(age * 0.02)); // Twinkle size
        alpha *= (0.5 + 0.5 * sin(age * 0.05)); // Twinkle alpha
    } else if (u_effect == 2) { // Orb
        size *= (0.5 + 1.5 * lifeRatio); // Expanding sphere
    } else if (u_effect == 3) { // Rainbow
        size *= (1.0 - lifeRatio);
    }
    
    vec2 finalPos = pos + a_quadPos * size;
    // clipSpace needs to map [0, resolution] to [-1, 1]
    vec2 clipSpace = vec2(
        (finalPos.x / u_resolution.x) * 2.0 - 1.0,
        1.0 - (finalPos.y / u_resolution.y) * 2.0
    );
    
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    v_color = vec4(i_color, alpha);
    v_uv = a_quadPos;
    v_age = age;
    v_effect = u_effect;
}
`;

const FS_SRC = `#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
in float v_age;
flat in int v_effect;

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
    
    float glow = exp(-dist * 3.0); // Soft exponential fade
    if (v_effect == 2) { // Orb uses a softer, wider glow
        glow = exp(-dist * 1.5);
    }
    
    vec3 rgb = v_color.rgb;
    if (v_effect == 3) { // Rainbow shifts hue over time and particle age
        float hue = fract(u_time * 0.0002 + v_age * 0.001);
        rgb = hsv2rgb(vec3(hue, 1.0, 1.0));
    }

    outColor = vec4(rgb * v_color.a * glow * u_opacityMultiplier, v_color.a * glow * u_opacityMultiplier);
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

async function init() {
  const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false
  }) as WebGL2RenderingContext;

  if (!gl) {
    console.error("WebGL2 not supported");
    return;
  }

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resize);
  resize();

  const vs = createShader(gl, gl.VERTEX_SHADER, VS_SRC)!;
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SRC)!;
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  // Additive blending for glows
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // Quad Geometry
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW);

  const a_quadPos = gl.getAttribLocation(program, "a_quadPos");
  gl.enableVertexAttribArray(a_quadPos);
  gl.vertexAttribPointer(a_quadPos, 2, gl.FLOAT, false, 0, 0);

  // Instancing Setup
  const MAX_PARTICLES = 2000;
  const FLOATS_PER_INSTANCE = 9; // x, y, vx, vy, spawnTime, lifeTime, r, g, b
  const instanceData = new Float32Array(MAX_PARTICLES * FLOATS_PER_INSTANCE);

  // Initialize to zero/dead
  for (let i = 0; i < instanceData.length; i++) {
    instanceData[i] = 0;
  }

  const instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, instanceData.byteLength, gl.DYNAMIC_DRAW);

  // Bind attributes
  const locs = {
    i_position: gl.getAttribLocation(program, "i_position"),
    i_velocity: gl.getAttribLocation(program, "i_velocity"),
    i_spawnTime: gl.getAttribLocation(program, "i_spawnTime"),
    i_lifeTime: gl.getAttribLocation(program, "i_lifeTime"),
    i_color: gl.getAttribLocation(program, "i_color")
  };

  const stride = FLOATS_PER_INSTANCE * 4;

  gl.enableVertexAttribArray(locs.i_position);
  gl.vertexAttribPointer(locs.i_position, 2, gl.FLOAT, false, stride, 0);
  gl.vertexAttribDivisor(locs.i_position, 1);

  gl.enableVertexAttribArray(locs.i_velocity);
  gl.vertexAttribPointer(locs.i_velocity, 2, gl.FLOAT, false, stride, 8);
  gl.vertexAttribDivisor(locs.i_velocity, 1);

  gl.enableVertexAttribArray(locs.i_spawnTime);
  gl.vertexAttribPointer(locs.i_spawnTime, 1, gl.FLOAT, false, stride, 16);
  gl.vertexAttribDivisor(locs.i_spawnTime, 1);

  gl.enableVertexAttribArray(locs.i_lifeTime);
  gl.vertexAttribPointer(locs.i_lifeTime, 1, gl.FLOAT, false, stride, 20);
  gl.vertexAttribDivisor(locs.i_lifeTime, 1);

  gl.enableVertexAttribArray(locs.i_color);
  gl.vertexAttribPointer(locs.i_color, 3, gl.FLOAT, false, stride, 24);
  gl.vertexAttribDivisor(locs.i_color, 1);

  const u_resolution = gl.getUniformLocation(program, "u_resolution");
  const u_time = gl.getUniformLocation(program, "u_time");
  const u_sizeMultiplier = gl.getUniformLocation(program, "u_sizeMultiplier");
  const u_lengthMultiplier = gl.getUniformLocation(program, "u_lengthMultiplier");
  const u_opacityMultiplier = gl.getUniformLocation(program, "u_opacityMultiplier");
  const u_effect = gl.getUniformLocation(program, "u_effect");

  let headIndex = 0;
  let lastMouse = { x: 0, y: 0 };
  let hasMouse = false;

  let currentConfig: AppConfig = { ...DEFAULT_CONFIG };
  listen<AppConfig>("config-update", (event) => {
    currentConfig = event.payload;
  });

  function spawnParticle(x: number, y: number, vx: number, vy: number, t: number) {
    const idx = headIndex * FLOATS_PER_INSTANCE;

    instanceData[idx + 0] = x;
    instanceData[idx + 1] = y;
    instanceData[idx + 2] = vx;
    instanceData[idx + 3] = vy;
    instanceData[idx + 4] = t;
    instanceData[idx + 5] = 800.0; // Math.random() * 500 + 300

    const themeColor = THEMES[currentConfig.theme] || THEMES.cyan;
    instanceData[idx + 6] = themeColor.r;
    instanceData[idx + 7] = themeColor.g;
    instanceData[idx + 8] = themeColor.b;

    // Direct subset upload for speed
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, idx * 4, instanceData.subarray(idx, idx + FLOATS_PER_INSTANCE));

    headIndex = (headIndex + 1) % MAX_PARTICLES;
  }

  // Listen to IPC
  listen<[number, number]>("cursor-move", (event) => {
    const [nx, ny] = event.payload;
    const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;

    // Convert normalized [0..1] coordinates directly to canvas physical pixels
    const x = nx * canvas.width;
    const y = ny * canvas.height;

    const now = performance.now();

    if (!hasMouse) {
      lastMouse = { x, y };
      hasMouse = true;
    }

    // Interpolate to fill gaps
    const dist = Math.hypot(x - lastMouse.x, y - lastMouse.y);
    const density = 2.0; // spawn every 2 pixels
    const count = Math.min(Math.ceil(dist / density), 50); // limit burst

    for (let i = 0; i <= count; i++) {
      const t = count === 0 ? 1 : (i / count);
      const px = lastMouse.x + (x - lastMouse.x) * t;
      const py = lastMouse.y + (y - lastMouse.y) * t;

      // Small random drift floating outwards, completely removing forward translation
      const rx = (Math.random() - 0.5) * 30.0;
      const ry = (Math.random() - 0.5) * 30.0;

      spawnParticle(px, py, rx, ry, now);
    }

    lastMouse = { x, y };
  });

  function render(time: number) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform2f(u_resolution, canvas.width, canvas.height);
    gl.uniform1f(u_time, time);
    gl.uniform1f(u_sizeMultiplier, currentConfig.sizeMultiplier);
    gl.uniform1f(u_lengthMultiplier, currentConfig.lengthMultiplier);
    gl.uniform1f(u_opacityMultiplier, currentConfig.opacityMultiplier);
    gl.uniform1i(u_effect, EFFECTS[currentConfig.effect] ?? 0);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, MAX_PARTICLES);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

document.addEventListener("DOMContentLoaded", init);
