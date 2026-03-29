import { listen } from "@tauri-apps/api/event";
import { AppConfig, loadConfigSafe, validateConfig } from "../../config";
import { BaseTail } from "../../core/tails/BaseTail";
import { getTailSafe } from "../../core/tails";

let currentTail: BaseTail | null = null;
let currentConfig: AppConfig = loadConfigSafe();

function createTail(effect: string, canvas: HTMLCanvasElement): BaseTail {
  const TailClass = getTailSafe(effect);
  return new TailClass(canvas);
}

async function init() {
  try {
    const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Could not find trail-canvas element");

    currentTail = createTail(currentConfig.effect, canvas);
    currentTail.updateConfig(currentConfig);

    let lastMouse = { x: 0, y: 0 };
    let hasMouse = false;

    // Listen to Configuration Updates
    listen<AppConfig>("config-update", (event) => {
      const newConfig = validateConfig(event.payload);

      // If effect completely changed, we need to swap the tail engine
      if (newConfig.effect !== currentConfig.effect) {
        if (currentTail) currentTail.destroy();
        currentTail = createTail(newConfig.effect, canvas);
      }

      currentConfig = newConfig;
      if (currentTail) currentTail.updateConfig(currentConfig);
    });

    // Listen to IPC Mouse Move
    listen<[number, number]>("cursor-move", (event) => {
      const [nx, ny] = event.payload;

      const x = nx * canvas.width;
      const y = ny * canvas.height;
      const now = performance.now();

      if (!hasMouse) {
        lastMouse = { x, y };
        hasMouse = true;
      }

      const dist = Math.hypot(x - lastMouse.x, y - lastMouse.y);
      const density = 2.0;
      const count = Math.min(Math.ceil(dist / density), 50);

      for (let i = 0; i <= count; i++) {
        const t = count === 0 ? 1 : i / count;
        const px = lastMouse.x + (x - lastMouse.x) * t;
        const py = lastMouse.y + (y - lastMouse.y) * t;

        const rx = (Math.random() - 0.5) * 30.0;
        const ry = (Math.random() - 0.5) * 30.0;

        if (currentTail) currentTail.spawnParticle(px, py, rx, ry, now);
      }
      lastMouse = { x, y };
    });
  } catch (err) {
    console.error("CRITICAL OVERLAY ERROR:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
