import { listen } from "@tauri-apps/api/event";
import { AppConfig, loadConfigSafe, validateConfig } from "../../config";
import { getTailSafe } from "../../core/tails";
import { TailEngine } from "../../core/tails/TailEngine";

let currentEngine: TailEngine | null = null;
let currentConfig: AppConfig = loadConfigSafe();

function createEngine(effect: string, canvas: HTMLCanvasElement): TailEngine {
  const TailClass = getTailSafe(effect);
  const tail = new TailClass(canvas);
  tail.updateConfig(currentConfig);
  return new TailEngine(tail);
}

async function init() {
  try {
    const canvas = document.getElementById("trail-canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Could not find trail-canvas element");

    currentEngine = createEngine(currentConfig.effect, canvas);

    // Listen to Configuration Updates
    listen<AppConfig>("config-update", (event) => {
      const newConfig = validateConfig(event.payload);
      if (newConfig.effect === currentConfig.effect) {
        currentEngine?.updateConfig(newConfig);
      } else {
        if (currentEngine) currentEngine.destroy();
        currentEngine = createEngine(newConfig.effect, canvas);
      }
      currentConfig = newConfig;
    });

    // Listen to IPC Mouse Move
    listen<[number, number]>("cursor-move", (event) => {
      const [nx, ny] = event.payload;
      currentEngine?.updateMouse(nx * canvas.width, ny * canvas.height);
    });
  } catch (err) {
    console.error("CRITICAL OVERLAY ERROR:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
