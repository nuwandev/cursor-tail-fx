import { AppConfig, DEFAULT_CONFIG, THEMES, EFFECTS } from "../config";
import { VS_SRC, FS_SRC } from "./shaders";

const MAX_PARTICLES = 2000;
const FLOATS_PER_INSTANCE = 9; // x, y, vx, vy, spawnTime, lifeTime, r, g, b

export class TrailEngine {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private canvas: HTMLCanvasElement;

    private instanceBuffer: WebGLBuffer;
    private instanceData: Float32Array;
    private headIndex: number = 0;

    private config: AppConfig = { ...DEFAULT_CONFIG };

    // Uniform Locations
    private locs = {
        u_resolution: null as WebGLUniformLocation | null,
        u_time: null as WebGLUniformLocation | null,
        u_sizeMultiplier: null as WebGLUniformLocation | null,
        u_lengthMultiplier: null as WebGLUniformLocation | null,
        u_opacityMultiplier: null as WebGLUniformLocation | null,
        u_effect: null as WebGLUniformLocation | null,
    };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext("webgl2", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false
        }) as WebGL2RenderingContext;

        if (!gl) {
            throw new Error("WebGL2 not supported");
        }
        this.gl = gl;

        // Resize Hook
        window.addEventListener("resize", this.resize.bind(this));
        this.resize();

        // Shaders
        const vs = this.createShader(gl.VERTEX_SHADER, VS_SRC)!;
        const fs = this.createShader(gl.FRAGMENT_SHADER, FS_SRC)!;
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
        }

        gl.useProgram(this.program);

        // Blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // Quad
        const quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);

        const a_quadPos = gl.getAttribLocation(this.program, "a_quadPos");
        gl.enableVertexAttribArray(a_quadPos);
        gl.vertexAttribPointer(a_quadPos, 2, gl.FLOAT, false, 0, 0);

        // Instances
        this.instanceData = new Float32Array(MAX_PARTICLES * FLOATS_PER_INSTANCE);
        this.instanceBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);

        const stride = FLOATS_PER_INSTANCE * 4;
        const setupAttrib = (name: string, size: number, offset: number) => {
            const loc = gl.getAttribLocation(this.program, name);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
            gl.vertexAttribDivisor(loc, 1);
        };

        setupAttrib("i_position", 2, 0);
        setupAttrib("i_velocity", 2, 8);
        setupAttrib("i_spawnTime", 1, 16);
        setupAttrib("i_lifeTime", 1, 20);
        setupAttrib("i_color", 3, 24);

        // Uniforms
        this.locs.u_resolution = gl.getUniformLocation(this.program, "u_resolution");
        this.locs.u_time = gl.getUniformLocation(this.program, "u_time");
        this.locs.u_sizeMultiplier = gl.getUniformLocation(this.program, "u_sizeMultiplier");
        this.locs.u_lengthMultiplier = gl.getUniformLocation(this.program, "u_lengthMultiplier");
        this.locs.u_opacityMultiplier = gl.getUniformLocation(this.program, "u_opacityMultiplier");
        this.locs.u_effect = gl.getUniformLocation(this.program, "u_effect");

        this.render = this.render.bind(this);
        requestAnimationFrame(this.render);
    }

    private resize() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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

    public spawnParticle(x: number, y: number, vx: number, vy: number, t: number) {
        const idx = this.headIndex * FLOATS_PER_INSTANCE;

        this.instanceData[idx + 0] = x;
        this.instanceData[idx + 1] = y;
        this.instanceData[idx + 2] = vx;
        this.instanceData[idx + 3] = vy;
        this.instanceData[idx + 4] = t;
        this.instanceData[idx + 5] = 800.0; // Lifetime

        const themeColor = THEMES[this.config.theme] || THEMES.cyan;
        this.instanceData[idx + 6] = themeColor.r;
        this.instanceData[idx + 7] = themeColor.g;
        this.instanceData[idx + 8] = themeColor.b;

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, idx * 4, this.instanceData.subarray(idx, idx + FLOATS_PER_INSTANCE));

        this.headIndex = (this.headIndex + 1) % MAX_PARTICLES;
    }

    private render(time: number) {
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.uniform2f(this.locs.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.locs.u_time, time);
        gl.uniform1f(this.locs.u_sizeMultiplier, this.config.sizeMultiplier);
        gl.uniform1f(this.locs.u_lengthMultiplier, this.config.lengthMultiplier);
        gl.uniform1f(this.locs.u_opacityMultiplier, this.config.opacityMultiplier);
        gl.uniform1i(this.locs.u_effect, EFFECTS[this.config.effect] ?? 0);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, MAX_PARTICLES);

        requestAnimationFrame(this.render);
    }
}
