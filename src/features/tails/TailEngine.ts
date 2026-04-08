import { BaseTail } from "./BaseTail";
import type { TailSpecificConfig } from "@/types";

// Spawn a particle every 4px of mouse travel (was 2px).
// Halves particle count with imperceptible visual difference.
const SPAWN_DENSITY_PX = 4;

// Hard cap on particles spawned per mouse event to prevent bursts on fast moves
const MAX_PARTICLES_PER_EVENT = 30;

export class TailEngine {
  private readonly tail: BaseTail;
  private lastMouse = { x: 0, y: 0 };
  private hasMouse = false;

  constructor(tail: BaseTail) {
    this.tail = tail;
  }

  updateMouse(x: number, y: number): void {
    const now = performance.now();

    if (!this.hasMouse) {
      this.lastMouse = { x, y };
      this.hasMouse = true;
      // Nothing to interpolate on first event — just record position
      return;
    }

    const dx = x - this.lastMouse.x;
    const dy = y - this.lastMouse.y;
    const dist = Math.hypot(dx, dy);
    const count = Math.min(Math.ceil(dist / SPAWN_DENSITY_PX), MAX_PARTICLES_PER_EVENT);

    // Write all particles for this mouse event into the CPU-side buffer
    for (let i = 0; i <= count; i++) {
      const t = count === 0 ? 1 : i / count;
      const px = this.lastMouse.x + dx * t;
      const py = this.lastMouse.y + dy * t;

      // Small random velocity for natural spread
      const rx = (Math.random() - 0.5) * 30;
      const ry = (Math.random() - 0.5) * 30;

      this.tail.writeParticle(px, py, rx, ry, now);
    }

    // Single GPU upload for the whole batch — was one call per particle before
    this.tail.flushParticles(now);

    this.lastMouse = { x, y };
  }

  updateConfig(config: TailSpecificConfig): void {
    this.tail.updateConfig(config);
  }

  destroy(): void {
    this.tail.destroy();
  }
}
