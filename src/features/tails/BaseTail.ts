import { TailSpecificConfig } from "@/types";
import { getThemeById } from "@/shared/config/themes";

/**
 * Rendering defaults are tuned for a lightweight desktop overlay:
 * keep GPU memory bounded, avoid excessive particle density, and cap work to ~60fps.
 */
export const MAX_PARTICLES = 1000;
export const FLOATS_PER_INSTANCE = 9; // x, y, vx, vy, spawnTime, lifeTime, r, g, b

const BASE_PARTICLE_LIFETIME_MS = 800;

const MAX_DPR = 1.5;

const MAX_CANVAS_PX = 1920;

const TARGET_FRAME_MS = 1000 / 60;

/** Maximum delta-time fed to simulation. Caps spikes (tab-switch, GC pauses) so
 *  they don't cause large jumps in particle positions or sizes. */
const DT_MAX_MS = 32;

const IDLE_TIMEOUT_MS = 1500;

const RESIZE_DEBOUNCE_MS = 50;

export abstract class BaseTail {
  protected gl: WebGL2RenderingContext;
  protected program: WebGLProgram;
  protected canvas: HTMLCanvasElement;

  /** Stable reference so `removeEventListener` works on tail switch. */
  private readonly boundResize = this.onResize.bind(this);

  protected instanceBuffer: WebGLBuffer;
  protected instanceData: Float32Array;
  protected headIndex: number = 0;

  private activeParticleCount: number = 0;

  protected isRendering: boolean = false;
  protected lastParticleTime: number = 0;

  private lastFrameTime: number = 0;

  private cachedColor: [number, number, number] = [0, 0.8, 1];

  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  protected config: TailSpecificConfig;

  protected locs = {
    u_resolution: null as WebGLUniformLocation | null,
    u_time: null as WebGLUniformLocation | null,
    u_sizeMultiplier: null as WebGLUniformLocation | null,
    u_lengthMultiplier: null as WebGLUniformLocation | null,
    u_opacityMultiplier: null as WebGLUniformLocation | null,
  };

  protected quadBuffer: WebGLBuffer;
  protected vao: WebGLVertexArrayObject;

  constructor(canvas: HTMLCanvasElement, config: TailSpecificConfig) {
    this.canvas = canvas;
    this.config = config;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
      /*
       * Prefer the integrated GPU and decouple canvas updates from vsync to reduce
       * compositor overhead for an always-on overlay effect.
       */
      powerPreference: "low-power",
      desynchronized: true,
    }) as WebGL2RenderingContext;

    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    this.cacheThemeColor();

    window.addEventListener("resize", this.boundResize);
    this.applyResize();

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
    /* Shaders can be deleted after linking; the program keeps the compiled result. */
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    /* Isolate attribute state so switching tails doesn't leak bindings. */
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

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

    /* Per-instance particle buffer; layout matches `FLOATS_PER_INSTANCE`. */
    this.instanceData = new Float32Array(MAX_PARTICLES * FLOATS_PER_INSTANCE);
    /* Initialize all slots as dead (spawnTime far past, lifeTime minimal). */
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.instanceData[i * FLOATS_PER_INSTANCE + 4] = -99999;
      this.instanceData[i * FLOATS_PER_INSTANCE + 5] = 1;
    }

    this.instanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);

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

    gl.bindVertexArray(null);

    this.locs.u_resolution = gl.getUniformLocation(this.program, "u_resolution");
    this.locs.u_time = gl.getUniformLocation(this.program, "u_time");
    this.locs.u_sizeMultiplier = gl.getUniformLocation(this.program, "u_sizeMultiplier");
    this.locs.u_lengthMultiplier = gl.getUniformLocation(this.program, "u_lengthMultiplier");
    this.locs.u_opacityMultiplier = gl.getUniformLocation(this.program, "u_opacityMultiplier");

    this.setupCustomUniforms();
  }

  /**
   * Subclasses must provide their vertex and fragment shader source.
   */
  public abstract getShaders(): { vertex: string; fragment: string };

  /**
   * Subclasses must implement effect-specific per-frame logic here.
   * Called once per frame before rendering.
   */
  public abstract updateEffect(dt: number): void;

  protected setupCustomUniforms(): void {
    /* intentionally empty */
  }
  protected applyCustomUniforms(_time: number): void {
    /* intentionally empty */
  }

  /** Cache theme color once — called on init and config update */
  private cacheThemeColor(): void {
    const theme = getThemeById(this.config.themeId) ?? getThemeById("cyan");
    this.cachedColor = theme ? theme.rgb : [0, 0.8, 1];
  }

  /** Debounced resize handler — prevents GPU thrash on rapid window resizing */
  private onResize(): void {
    if (this.resizeTimer !== null) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.applyResize();
      this.resizeTimer = null;
    }, RESIZE_DEBOUNCE_MS);
  }

  private applyResize(): void {
    /*
     * Cap DPR and apply a hard pixel cap to avoid massive framebuffers on
     * multi-monitor / HiDPI setups.
     */
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const rawW = Math.floor(window.innerWidth * dpr);
    const rawH = Math.floor(window.innerHeight * dpr);

    const scale = Math.min(1, MAX_CANVAS_PX / Math.max(rawW, rawH));
    const displayWidth = Math.floor(rawW * scale);
    const displayHeight = Math.floor(rawH * scale);

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
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

  public updateConfig(config: TailSpecificConfig): void {
    this.config = config;
    this.cacheThemeColor();
  }

  /**
   * Write particle data into the CPU-side Float32Array.
   * Does NOT upload to GPU — caller must call flushParticles() after batch.
   */
  public writeParticle(x: number, y: number, vx: number, vy: number, t: number): void {
    const idx = this.headIndex * FLOATS_PER_INSTANCE;
    this.instanceData[idx + 0] = x;
    this.instanceData[idx + 1] = y;
    this.instanceData[idx + 2] = vx;
    this.instanceData[idx + 3] = vy;
    this.instanceData[idx + 4] = t;
    this.instanceData[idx + 5] = BASE_PARTICLE_LIFETIME_MS;
    this.instanceData[idx + 6] = this.cachedColor[0];
    this.instanceData[idx + 7] = this.cachedColor[1];
    this.instanceData[idx + 8] = this.cachedColor[2];

    this.headIndex = (this.headIndex + 1) % MAX_PARTICLES;
    if (this.activeParticleCount < MAX_PARTICLES) {
      this.activeParticleCount++;
    }
  }

  /**
   * Single GPU upload for all particles written since last flush.
   * Called once per updateMouse() — not per individual particle.
   */
  public flushParticles(t: number): void {
    this.lastParticleTime = t;

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData);

    if (!this.isRendering) {
      this.isRendering = true;
      this.lastFrameTime = 0;
    }
  }

  public renderFrame(time: number): boolean {
    if (!this.isRendering) return false;

    if (time - this.lastParticleTime > IDLE_TIMEOUT_MS) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.isRendering = false;
      return false;
    }

    const elapsed = time - this.lastFrameTime;
    if (elapsed < TARGET_FRAME_MS) {
      return true;
    }
    this.lastFrameTime = time - (elapsed % TARGET_FRAME_MS); // Carry over remainder

    /* Clamp dt so scheduling spikes don't produce large simulation jumps. */
    const dt = Math.min(elapsed, DT_MAX_MS);
    this.updateEffect(dt);

    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    if (this.locs.u_resolution)
      gl.uniform2f(this.locs.u_resolution, this.canvas.width, this.canvas.height);
    if (this.locs.u_time) gl.uniform1f(this.locs.u_time, time);
    if (this.locs.u_sizeMultiplier)
      gl.uniform1f(this.locs.u_sizeMultiplier, this.config.sizeMultiplier);
    if (this.locs.u_lengthMultiplier)
      gl.uniform1f(this.locs.u_lengthMultiplier, this.config.lengthMultiplier);
    if (this.locs.u_opacityMultiplier)
      gl.uniform1f(this.locs.u_opacityMultiplier, this.config.opacityMultiplier);

    this.applyCustomUniforms(time);

    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.activeParticleCount);
    gl.bindVertexArray(null);

    return true;
  }

  public destroy(): void {
    this.isRendering = false;

    if (this.resizeTimer !== null) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }

    window.removeEventListener("resize", this.boundResize);

    /* Release WebGL resources so tail switching doesn't leak GPU memory. */
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
