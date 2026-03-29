import { BaseTail } from "./BaseTail";

export class TailEngine {
  private readonly tail: BaseTail;
  private lastMouse = { x: 0, y: 0 };
  private hasMouse = false;

  constructor(tail: BaseTail) {
    this.tail = tail;
  }

  updateMouse(x: number, y: number) {
    const now = performance.now();
    if (!this.hasMouse) {
      this.lastMouse = { x, y };
      this.hasMouse = true;
    }

    const dist = Math.hypot(x - this.lastMouse.x, y - this.lastMouse.y);
    const density = 2;
    const count = Math.min(Math.ceil(dist / density), 50);

    for (let i = 0; i <= count; i++) {
      const t = count === 0 ? 1 : i / count;
      const px = this.lastMouse.x + (x - this.lastMouse.x) * t;
      const py = this.lastMouse.y + (y - this.lastMouse.y) * t;

      const rx = (Math.random() - 0.5) * 30;
      const ry = (Math.random() - 0.5) * 30;

      this.tail.spawnParticle(px, py, rx, ry, now);
    }

    this.lastMouse = { x, y };
  }

  updateConfig(config: any) {
    this.tail.updateConfig(config);
  }

  destroy() {
    this.tail.destroy();
  }
}
