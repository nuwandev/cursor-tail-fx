import { getAllTails } from "@/features/tails";
import { TailEngine } from "@/features/tails/TailEngine";
import type { BaseTail } from "@/features/tails/BaseTail";
import { configManager } from "@/shared/config";

interface PreviewEntry {
  tail: BaseTail;
  engine: TailEngine;
  canvas: HTMLCanvasElement;
  animFrame: number;
  pathPhase: number;
}

function getLissajousPoint(t: number, w: number, h: number, phaseOffset: number) {
  // Each tail gets a unique phase offset based on its index so previews
  // don't all animate in lockstep
  const x = (Math.sin(t * 1.3 + phaseOffset) * 0.38 + 0.5) * w;
  const y = (Math.sin(t * 1.0 + phaseOffset * 0.7) * 0.32 + 0.5) * h;
  return { x, y };
}

export class PreviewManager {
  private entries: Map<string, PreviewEntry> = new Map();
  private containerCanvasMap: Map<string, HTMLCanvasElement> = new Map();
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const target = entry.target as HTMLCanvasElement;
        const tailId = target.dataset.tailId;
        if (!tailId) return;
        if (entry.isIntersecting) {
            this.resumeForId(tailId);
        } else {
            this.pauseForId(tailId);
        }
      });
    }, { threshold: 0.1 });
  }

  async init(container: HTMLElement) {
    const canvases = container.querySelectorAll<HTMLCanvasElement>("canvas[data-tail-id]");
    canvases.forEach(canvas => {
        const tailId = canvas.dataset.tailId;
        if (tailId) {
            this.containerCanvasMap.set(tailId, canvas);
            this.observer.observe(canvas);
        }
    });
  }

  private initPreview(tailId: string, canvas: HTMLCanvasElement) {
    if (this.entries.has(tailId)) return;

    const tails = getAllTails();
    const tailMeta = tails.find(t => t.id === tailId);
    if (!tailMeta) return;

    try {
        const config = configManager.getTailConfig(tailId);
        const tailInstance = new tailMeta.class(canvas, config);
        const engine = new TailEngine(tailInstance);

        const phaseOffset = tails.findIndex(t => t.id === tailId) * 0.5;

        const dpr = Math.min(window.devicePixelRatio, 1.5);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;

        this.entries.set(tailId, {
            tail: tailInstance,
            engine: engine,
            canvas: canvas,
            animFrame: 0,
            pathPhase: phaseOffset
        });
        
        // Immediately repair the WebGL viewport which BaseTail incorrectly set to window.innerWidth
        const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
        if (gl) {
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    } catch (e) {
        console.error(`[PreviewManager] Failed to init preview for tail ${tailId}:`, e);
        // Leave the canvas showing its dark background (#080810) per requirements
    }
  }

  resumeForId(tailId: string) {
    const canvas = this.containerCanvasMap.get(tailId);
    if (canvas && !this.entries.has(tailId)) {
        this.initPreview(tailId, canvas);
    }

    const entry = this.entries.get(tailId);
    if (!entry) return;

    if (entry.animFrame) {
        cancelAnimationFrame(entry.animFrame);
    }

    const tick = (timestamp: number) => {
        const dpr = Math.min(window.devicePixelRatio, 1.5);
        
        // Ensure viewport matches canvas dimensions in case BaseTail triggered a wrong resize internally
        const targetW = Math.floor(entry.canvas.clientWidth * dpr);
        const targetH = Math.floor(entry.canvas.clientHeight * dpr);
        if (entry.canvas.width !== targetW || entry.canvas.height !== targetH) {
            entry.canvas.width = targetW;
            entry.canvas.height = targetH;
            const gl = entry.canvas.getContext("webgl2") as WebGL2RenderingContext | null;
            if (gl) gl.viewport(0, 0, targetW, targetH);
        }

        const t = timestamp * 0.0008; // speed factor
        const { x, y } = getLissajousPoint(t, entry.canvas.width / dpr, entry.canvas.height / dpr, entry.pathPhase);
        
        entry.engine.updateMouse(x, y);
        // tailInstance.render is private and is invoked internally when flushParticles runs via engine.updateMouse
        
        entry.animFrame = requestAnimationFrame(tick);
    };

    entry.animFrame = requestAnimationFrame(tick);
  }

  pauseForId(tailId: string) {
    const entry = this.entries.get(tailId);
    if (!entry) return;
    if (entry.animFrame) {
        cancelAnimationFrame(entry.animFrame);
        entry.animFrame = 0;
    }
  }

  resumeAll() {
    this.entries.forEach((_, tailId) => this.resumeForId(tailId));
  }

  startAll() {
    this.resumeAll();
  }

  pauseAll() {
    this.entries.forEach((_, tailId) => this.pauseForId(tailId));
  }

  destroyAll() {
    this.observer.disconnect();
    this.entries.forEach((entry) => {
        if (entry.animFrame) cancelAnimationFrame(entry.animFrame);
        entry.engine.destroy();
    });
    this.entries.clear();
    this.containerCanvasMap.clear();
  }

  restartForId(tailId: string) {
    this.pauseForId(tailId);
    const entry = this.entries.get(tailId);
    if (entry) {
        entry.engine.destroy();
        this.entries.delete(tailId);
    }
    this.resumeForId(tailId);
  }

  updateConfigForId(tailId: string, config: any) {
    const entry = this.entries.get(tailId);
    if (entry) {
        entry.engine.updateConfig(config);
    }
  }
}
