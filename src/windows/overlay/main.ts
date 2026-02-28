import { listen } from "@tauri-apps/api/event";
import { AppConfig } from "../../config";
import { TrailEngine } from "../../core/engine";

async function init() {
  const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;
  const engine = new TrailEngine(canvas);

  let lastMouse = { x: 0, y: 0 };
  let hasMouse = false;

  // Listen to Configuration Updates
  listen<AppConfig>("config-update", (event) => {
    engine.updateConfig(event.payload);
  });

  // Listen to IPC Mouse Move
  listen<[number, number]>("cursor-move", (event) => {
    const [nx, ny] = event.payload;

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

      engine.spawnParticle(px, py, rx, ry, now);
    }
    lastMouse = { x, y };
  });
}

document.addEventListener("DOMContentLoaded", init);
