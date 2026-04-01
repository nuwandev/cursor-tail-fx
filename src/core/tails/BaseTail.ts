import type { TailClass } from "./index";

export interface TailMeta {
  id: string;
  name: string;
  description: string;
  class: TailClass;
}
import { AppConfig } from "../config/index";
import { getThemeById } from "../config/themes";

export const MAX_PARTICLES = 2000;
export const FLOATS_PER_INSTANCE = 9; // x, y, vx, vy, spawnTime, lifeTime, r, g, b

export abstract class BaseTail {
  protected gl: WebGL2RenderingContext;
  protected program: WebGLProgram;
  protected canvas: HTMLCanvasElement;

  protected instanceBuffer: WebGLBuffer;
  protected instanceData: Float32Array;
  protected headIndex: number = 0;

  protected isRendering: boolean = true;
  protected lastParticleTime: number = 0;

  protected config: AppConfig;

  protected locs = {
    u_resolution: null as WebGLUniformLocation | null,
    u_time: null as WebGLUniformLocation | null,
    u_sizeMultiplier: null as WebGLUniformLocation | null,
    u_lengthMultiplier: null as WebGLUniformLocation | null,
    u_opacityMultiplier: null as WebGLUniformLocation | null,
  };

  protected quadBuffer: WebGLBuffer;
  protected vao: WebGLVertexArrayObject;

  constructor(canvas: HTMLCanvasElement, config: AppConfig) {
    this.canvas = canvas;
    this.config = config;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    }) as WebGL2RenderingContext;

    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    window.addEventListener("resize", this.resize.bind(this));
    this.resize();

    const { vertex, fragment } = this.getShaders();
    const vs = this.createShader(gl.VERTEX_SHADER, vertex)!;
    const fs = this.createShader(gl.FRAGMENT_SHADER, fragment)!;
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
    }
    // Cleanup shaders after linkage
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Setup VAO to isolate attribute state between tails!
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // Quad
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const a_quadPos = gl.getAttribLocation(this.program, "a_quadPos");
    gl.enableVertexAttribArray(a_quadPos);
    gl.vertexAttribPointer(a_quadPos, 2, gl.FLOAT, false, 0, 0);

    // Instances
    this.instanceData = new Float32Array(MAX_PARTICLES * FLOATS_PER_INSTANCE);
    // Initialize with dead particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.instanceData[i * FLOATS_PER_INSTANCE + 4] = -99999;
      this.instanceData[i * FLOATS_PER_INSTANCE + 5] = 1;
    }

    this.instanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.instanceData.byteLength,
      gl.DYNAMIC_DRAW,
    );

    const stride = FLOATS_PER_INSTANCE * 4;
    const setupAttrib = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(this.program, name);
      if (loc === -1) return;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
      gl.vertexAttribDivisor(loc, 1);
    };

    setupAttrib("i_position", 2, 0);
    setupAttrib("i_velocity", 2, 8);
    setupAttrib("i_spawnTime", 1, 16);
    setupAttrib("i_lifeTime", 1, 20);
    setupAttrib("i_color", 3, 24);

    // Unbind VAO for safety
    gl.bindVertexArray(null);

    this.locs.u_resolution = gl.getUniformLocation(
      this.program,
      "u_resolution",
    );
    this.locs.u_time = gl.getUniformLocation(this.program, "u_time");
    this.locs.u_sizeMultiplier = gl.getUniformLocation(
      this.program,
      "u_sizeMultiplier",
    );
    this.locs.u_lengthMultiplier = gl.getUniformLocation(
      this.program,
      "u_lengthMultiplier",
    );
    this.locs.u_opacityMultiplier = gl.getUniformLocation(
      this.program,
      "u_opacityMultiplier",
    );

    this.setupCustomUniforms();

    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  /**
   * Subclasses must provide their vertex and fragment shader source.
   */
  public abstract getShaders(): { vertex: string; fragment: string };

  /**
   * Subclasses must implement effect-specific per-frame logic here.
   * This is called once per frame, before rendering.
   */
  public abstract updateEffect(dt: number): void;

  // Optionally overridden in subclasses
  protected setupCustomUniforms(): void {
    /* intentionally empty */
  }
  // Optionally overridden in subclasses
  protected applyCustomUniforms(_time: number): void {
    /* intentionally empty */
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    // Always match the window size for overlay
    const displayWidth = window.innerWidth * dpr;
    const displayHeight = window.innerHeight * dpr;
    if (
      this.canvas.width !== displayWidth ||
      this.canvas.height !== displayHeight
    ) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private createShader(type: number, source: string) {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public updateConfig(config: AppConfig) {
    this.config = config;
  }

  public spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    t: number,
  ) {
    this.lastParticleTime = t;
    if (!this.isRendering) {
      this.isRendering = true;
      this.render(performance.now());
    }

    const idx = this.headIndex * FLOATS_PER_INSTANCE;
    this.instanceData[idx + 0] = x;
    this.instanceData[idx + 1] = y;
    this.instanceData[idx + 2] = vx;
    this.instanceData[idx + 3] = vy;
    this.instanceData[idx + 4] = t;
    this.instanceData[idx + 5] = 800; // Base Lifetime

    const theme = getThemeById(this.config.themeId) || getThemeById("cyan");
    const [r, g, b] = theme ? theme.rgb : [0, 0.8, 1];
    this.instanceData[idx + 6] = r;
    this.instanceData[idx + 7] = g;
    this.instanceData[idx + 8] = b;

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      idx * 4,
      this.instanceData.subarray(idx, idx + FLOATS_PER_INSTANCE),
    );

    this.headIndex = (this.headIndex + 1) % MAX_PARTICLES;
  }

  private render(time: number) {
    if (!this.isRendering) return;

    if (time - this.lastParticleTime > 3000) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.isRendering = false;
      return;
    }

    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    if (this.locs.u_resolution)
      gl.uniform2f(
        this.locs.u_resolution,
        this.canvas.width,
        this.canvas.height,
      );
    if (this.locs.u_time) gl.uniform1f(this.locs.u_time, time);
    if (this.locs.u_sizeMultiplier)
      gl.uniform1f(this.locs.u_sizeMultiplier, this.config.sizeMultiplier);
    if (this.locs.u_lengthMultiplier)
      gl.uniform1f(this.locs.u_lengthMultiplier, this.config.lengthMultiplier);
    if (this.locs.u_opacityMultiplier)
      gl.uniform1f(
        this.locs.u_opacityMultiplier,
        this.config.opacityMultiplier,
      );

    this.applyCustomUniforms(time);

    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, MAX_PARTICLES);
    gl.bindVertexArray(null);

    requestAnimationFrame(this.render);
  }

  public destroy() {
    this.isRendering = false;

    // Clean up WebGL resources to prevent crashes on high-frequency tail switching
    if (this.program) this.gl.deleteProgram(this.program);
    if (this.instanceBuffer) this.gl.deleteBuffer(this.instanceBuffer);
    if (this.quadBuffer) this.gl.deleteBuffer(this.quadBuffer);
    if (this.vao) {
      this.gl.bindVertexArray(null);
      this.gl.deleteVertexArray(this.vao);
    }

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
}
