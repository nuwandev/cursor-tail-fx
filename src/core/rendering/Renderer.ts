import { AppConfig, normalizeConfig } from "../config";
import { getTailSafe } from "../tails";
import { TailEngine } from "../tails/TailEngine";
import type { BaseTail } from "../tails/BaseTail";

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private config: AppConfig;
  private engine: TailEngine | null = null;
  private tail: BaseTail | null = null;

  constructor(canvas: HTMLCanvasElement, config: AppConfig) {
    if (!canvas) throw new Error("Renderer: canvas is required");
    this.canvas = canvas;
    this.config = normalizeConfig(config);
    this.initTail(this.config.tailId);
  }

  private initTail(tailId: string) {
    // Always destroy previous
    this.destroy();
    let TailClass;
    try {
      TailClass = getTailSafe(tailId);
    } catch {
      TailClass = getTailSafe("comet");
    }
    try {
      this.tail = new TailClass(this.canvas, this.config);
    } catch {
      // fallback to comet if instantiation fails
      TailClass = getTailSafe("comet");
      this.tail = new TailClass(this.canvas, this.config);
    }
    this.tail.updateConfig(this.config);
    this.engine = new TailEngine(this.tail);
  }

  handleMouseMove(nx: number, ny: number) {
    if (!this.engine) return;
    const x = nx * this.canvas.width;
    const y = ny * this.canvas.height;
    this.engine.updateMouse(x, y);
  }

  handleConfigUpdate(newConfig: AppConfig) {
    const normalized = normalizeConfig(newConfig);
    if (normalized.tailId === this.config.tailId) {
      this.config = normalized;
      this.engine?.updateConfig(this.config);
    } else {
      this.config = normalized;
      this.initTail(normalized.tailId);
    }
  }

  destroy() {
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
    if (this.tail) {
      this.tail.destroy();
      this.tail = null;
    }
  }
}
