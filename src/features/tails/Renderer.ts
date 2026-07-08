import type { AppConfig } from "@/types";
import { getTailSafe } from "@/features/tails";
import { TailEngine } from "@/features/tails/TailEngine";
import type { BaseTail } from "@/features/tails/BaseTail";

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private config: AppConfig;
  private engine: TailEngine | null = null;
  private tail: BaseTail | null = null;

  constructor(canvas: HTMLCanvasElement, config: AppConfig) {
    if (!canvas) throw new Error("Renderer: canvas is required");
    this.canvas = canvas;
    this.config = config;
    this.initTail(this.config.activeTailId);
  }

  /**
   * (Re)creates the tail + engine.
   * Falls back to a known-good tail if the requested one is missing or fails to instantiate.
   */
  private initTail(tailId: string) {
    this.destroy();
    let TailClass;
    let safeTailId = tailId;
    try {
      TailClass = getTailSafe(tailId);
    } catch {
      TailClass = getTailSafe("comet");
      safeTailId = "comet";
    }

    let tailConfig = this.config.tailConfigs[safeTailId];
    if (!tailConfig) {
      tailConfig = {
        themeId: "cyan",
        sizeMultiplier: 1,
        lengthMultiplier: 1,
        opacityMultiplier: 1,
      };
    }

    try {
      this.tail = new TailClass(this.canvas, tailConfig);
    } catch (e) {
      console.error("FAILING TO INSTANTIATE TAIL:", e);
      TailClass = getTailSafe("comet");
      this.tail = new TailClass(this.canvas, tailConfig);
    }
    this.tail.updateConfig(tailConfig);
    this.engine = new TailEngine(this.tail);
  }

  handleMouseMove(nx: number, ny: number) {
    if (!this.engine) return;
    const x = nx * this.canvas.width;
    const y = ny * this.canvas.height;
    this.engine.updateMouse(x, y);
  }

  renderFrame(time: number): boolean {
    if (!this.tail) return false;
    return this.tail.renderFrame(time);
  }

  handleConfigUpdate(newConfig: AppConfig) {
    if (newConfig.activeTailId === this.config.activeTailId) {
      this.config = newConfig;
      const tailConfig = newConfig.tailConfigs[newConfig.activeTailId];
      if (tailConfig) {
        this.engine?.updateConfig(tailConfig);
      }
    } else {
      this.config = newConfig;
      this.initTail(newConfig.activeTailId);
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
