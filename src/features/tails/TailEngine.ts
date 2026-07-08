import { BaseTail } from "./BaseTail";
import type { TailSpecificConfig } from "@/types";

/*
 * Particle spawn density is tuned for performance.
 * A per-event cap prevents bursts on very fast mouse moves.
 */
const SPAWN_DENSITY_PX = 4;

const MAX_PARTICLES_PER_EVENT = 30;

export class TailEngine {
  private readonly tail: BaseTail;
  private lastMouse = { x: 0, y: 0 };
  private hasMouse = false;
  /** True when writeParticle was called since the last flush(). */
  private dirty = false;

  constructor(tail: BaseTail) {
    this.tail = tail;
  }

  updateMouse(x: number, y: number): void {
    const now = performance.now();

    if (!this.hasMouse) {
      this.lastMouse = { x, y };
      this.hasMouse = true;
      return;
    }

    const dx = x - this.lastMouse.x;
    const dy = y - this.lastMouse.y;
    const dist = Math.hypot(dx, dy);
    const count = Math.min(Math.ceil(dist / SPAWN_DENSITY_PX), MAX_PARTICLES_PER_EVENT);

    for (let i = 0; i <= count; i++) {
      const t = count === 0 ? 1 : i / count;
      const px = this.lastMouse.x + dx * t;
      const py = this.lastMouse.y + dy * t;

      const rx = (Math.random() - 0.5) * 30;
      const ry = (Math.random() - 0.5) * 30;

      this.tail.writeParticle(px, py, rx, ry, now);
    }

    /* Mark dirty — actual GPU upload is deferred to flush(), called once per rAF frame. */
    this.dirty = true;
    this.lastMouse = { x, y };
  }

  /**
   * Upload the CPU particle buffer to the GPU.
   * Must be called once per rAF frame (after all updateMouse calls for that frame).
   * No-op if no new data has been written since the last flush.
   */
  flush(now: number): void {
    if (!this.dirty) return;
    this.dirty = false;
    this.tail.flushParticles(now);
  }

  updateConfig(config: TailSpecificConfig): void {
    this.tail.updateConfig(config);
  }

  destroy(): void {
    this.tail.destroy();
  }
}
